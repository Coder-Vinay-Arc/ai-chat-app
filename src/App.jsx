import { useState, useEffect, useRef } from 'react'
import { marked } from 'marked'
import './App.css'

marked.setOptions({
  breaks: true,
  gfm: true
})

function App() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const chatFeedRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to the bottom of the chat feed when messages or typing states change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatFeedRef.current) {
        chatFeedRef.current.scrollTo({
          top: chatFeedRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }

    // Timeout gives the DOM and Markdown renderer time to paint new elements
    const timer = setTimeout(scrollToBottom, 80)
    return () => clearTimeout(timer)
  }, [messages, isTyping])

  // Automatically adjust textarea height as the user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Listen for browser back/forward buttons (History API Integration)
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view === 'chat') {
        setMessages(event.state.messages || [])
      } else {
        setMessages([])
        setMessage("")
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleSend = async (textToSend) => {
    const queryText = typeof textToSend === 'string' ? textToSend.trim() : message.trim()
    if (queryText === "") return

    // Clear input
    if (typeof textToSend !== 'string') {
      setMessage("")
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      role: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    // History API Integration: push on first message, replace state on subsequent
    if (messages.length === 0) {
      window.history.pushState({ view: 'chat', messages: updatedMessages }, '')
    } else {
      window.history.replaceState({ view: 'chat', messages: updatedMessages }, '')
    }

    setIsTyping(true)

    // Simulate natural AI response delay
    setTimeout(async () => {
      try {
        const response = await fetch(
          "https://ai-chat-app-7yn2.onrender.com/chat",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: queryText
            })
          }
        )
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`)
        }
        const data = await response.json()

        const replyMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text: data.reply || "No response text received",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setMessages(prev => {
          const finalMessages = [...prev, replyMessage]
          window.history.replaceState({ view: 'chat', messages: finalMessages }, '')
          return finalMessages
        })
      } catch (error) {
        console.error("Fetch error:", error)
        const errorMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text: `Failed to connect to AI server. (Error: ${error.message})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
        setMessages(prev => {
          const finalMessages = [...prev, errorMessage]
          window.history.replaceState({ view: 'chat', messages: finalMessages }, '')
          return finalMessages
        })
      } finally {
        setIsTyping(false)
      }
    }, 850)
  }

  const handleNewChat = () => {
    if (window.history.state && window.history.state.view === 'chat') {
      window.history.back()
    } else {
      setMessages([])
      setMessage("")
    }
  }

  const suggestionPrompts = [
    { text: "Hello! Who are you?", icon: "✨", label: "Introduce yourself" },
    { text: "Ping the server status", icon: "🌐", label: "Check API ping" },
    { text: "Tell me a joke", icon: "🎭", label: "Lighten the mood" },
    { text: "Help me write an email", icon: "📧", label: "Draft a message" },
    { text: "Explain Quantum Physics", icon: "⚛️", label: "Learn science" },
    { text: "Code a simple webpage", icon: "💻", label: "Get code help" }
  ]

  // Render Perplexity-style input box (shared by both views)
  const renderInputBox = () => (
    <div className="perplexity-input-box">
      <textarea
        ref={textareaRef}
        placeholder="Ask anything..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        rows={1}
      />
      <div className="input-box-footer">
        <div className="footer-left">
          <button className="icon-btn-pill" title="Attach file">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Attach</span>
          </button>
          <button className="icon-btn-pill active" title="Search focus">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span>Search</span>
          </button>
        </div>
        <div className="footer-right">
          <button className="send-btn" onClick={() => handleSend()} title="Send query">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {messages.length === 0 ? (
        /* 1. HOME LAYOUT (Default State) */
        <div className="home-layout">
          <h1 className="home-logo">Quantum AI</h1>

          {renderInputBox()}

          <div className="home-suggestions-header">Try out Quantum prompts</div>
          <div className="home-suggestions-grid">
            {suggestionPrompts.map((prompt, idx) => (
              <div
                key={idx}
                className="home-suggestion-card"
                onClick={() => handleSend(prompt.text)}
              >
                <span className="card-icon">{prompt.icon}</span>
                <div className="card-content">
                  <div className="card-text">{prompt.text}</div>
                  <div className="card-label">{prompt.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 2. CHAT LAYOUT (Active Conversation State) */
        <div className="chat-layout">
          {/* Header Bar */}
          <header className="chat-header">
            <div className="brand" onClick={handleNewChat} style={{ cursor: 'pointer' }}>
              <button className="back-btn" title="Back to Home">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <div className="brand-icon">Q</div>
              <h1 className="title">Quantum AI</h1>
            </div>
            <button className="new-chat-btn" onClick={handleNewChat} title="Clear conversation">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Chat</span>
            </button>
          </header>

          {/* Messages Feed */}
          <div className="chat-feed" ref={chatFeedRef}>
            <div className="chat-feed-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`feed-message ${msg.role} ${msg.isError ? 'error' : ''}`}
                >
                  {msg.role === 'user' ? (
                    /* User Bubble */
                    <div className="bubble">
                      {msg.text}
                    </div>
                  ) : (
                    /* Assistant Answer (Perplexity Style Left Aligned) */
                    <>
                      <div className="bot-avatar">Q</div>
                      <div className="bot-content-wrapper">
                        <div
                          className="bubble markdown-body"
                          dangerouslySetInnerHTML={{ __html: marked.parse(msg.text || "") }}
                        />
                        <span className="feed-message-meta">{msg.timestamp}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="feed-typing-container">
                  <div className="bot-avatar">Q</div>
                  <div className="feed-typing-indicator-bubble">
                    <span className="thinking-text">Thinking...</span>
                    <div className="feed-typing-dots">
                      <span className="feed-typing-dot"></span>
                      <span className="feed-typing-dot"></span>
                      <span className="feed-typing-dot"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Footer Input */}
          <footer className="chat-footer">
            <div className="chat-footer-container">
              {renderInputBox()}
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}

export default App