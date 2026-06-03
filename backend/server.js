const { GoogleGenAI } = require("@google/genai")
require("dotenv").config()
console.log(process.env.GEMINI_API_KEY)
console.log("VINAY SERVER LOADED")

const express = require("express")
const cors = require("cors")

const app = express()
app.use(express.json())
app.use(cors())
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})

// Home route
app.get("/", (req, res) => {
    res.send("Backend Server Running")
})

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    try {
        // Try the primary model
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage
        });
        return res.json({
            reply: response.text
        });
    } catch (error) {
        console.warn("Primary model (gemini-2.5-flash) failed, attempting fallback:", error.message);
        
        try {
            // Fallback to the highly stable gemini-1.5-flash
            const fallbackResponse = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: userMessage
            });
            return res.json({
                reply: fallbackResponse.text
            });
        } catch (fallbackError) {
            console.error("Fallback model also failed:", fallbackError);
            return res.status(503).json({
                reply: "The AI service is currently experiencing extremely high demand. Please try again in a few moments."
            });
        }
    }
})

app.get("/test-ai", async (req, res) => {

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Say hello to Vinay"
    })

    res.json({
        reply: response.text
    })

})

app.get("/vinay", (req, res) => {
    res.send("Vinay Route Working")
})

// Start server
app.listen(5000, () => {
    console.log("Server started on http://localhost:5000")
})