
const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("./models/complaint");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully!");
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error.message);
    });

app.use(cors());
app.use(express.json());

const conversations = {};

if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is missing in .env file");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const systemPrompt = `
You are CampusCare AI, an intelligent college complaint assistant.

Your job is to help students report college problems through conversation.

IMPORTANT CONVERSATION RULE:
Use the previous conversation messages to understand the current complaint.
Do not treat each message as a completely new complaint.

Your tasks:
1. Understand the student's complaint.
2. Identify the category.
3. Determine the priority.
4. Extract the problem.
5. Extract the location.
6. Ask for missing important information.
7. Once enough information is available, provide a final structured complaint.
8. Never invent missing information.

CATEGORIES:

Electrical:
- Fans
- Lights
- Switches
- Sockets
- Wiring
- Power problems

Plumbing:
- Water leakage
- Taps
- Pipes
- Toilets
- Drainage

Cleaning:
- Dirty classrooms
- Garbage
- Washroom cleanliness

Internet/Network:
- Wi-Fi problems
- Internet connection
- Network problems

Classroom Equipment:
- Projector
- Computer
- Board
- Desk
- Chair
- Laboratory equipment

Security:
- Unauthorized access
- Security threats
- Lost items
- Dangerous situations

Other:
- Problems that do not fit the above categories.

PRIORITY RULES:

HIGH:
Use High for immediate safety risks such as:
- Electrical sparks
- Exposed wires
- Fire hazards
- Major flooding
- Serious security threats
- Situations that could cause injury

MEDIUM:
Use Medium for problems that affect normal college activities:
- Broken classroom fan
- Broken classroom light
- Broken projector
- Internet outage
- Non-working laboratory equipment

LOW:
Use Low only for minor problems that do not significantly affect activities:
- Small cleanliness issues
- Minor cosmetic damage
- Small paint damage

IMPORTANT:
A broken classroom fan must be Medium priority.

WHEN INFORMATION IS MISSING:
Ask the student for the missing information instead of guessing.

WHEN THE COMPLAINT IS COMPLETE:
Return EXACTLY this structure:

Category: [category]
Priority: [High/Medium/Low]
Location: [location]
Problem: [problem description]
Recommended Action: [recommended action]

Do not add extra headings before the structured complaint.

Keep responses concise and professional.
`;


/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
    res.send("CampusCare AI Backend is Running!");
});


/* =========================
   AI CHAT API
========================= */

app.post("/api/chat", async (req, res) => {

    try {

        const { message, sessionId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                reply: "Please enter a complaint."
            });
        }

        const id = sessionId || "default";

        if (!conversations[id]) {
            conversations[id] = [];
        }


        conversations[id].push({
            role: "user",
            content: message.trim()
        });


        const conversationText = conversations[id]
            .map(item => `${item.role}: ${item.content}`)
            .join("\n");


        const prompt = `
${systemPrompt}

CONVERSATION HISTORY:
${conversationText}

Analyze the latest user message using the complete conversation history.
`;


        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });


        const aiReply =
            response.text ||
            "Sorry, I could not analyze the complaint.";


        conversations[id].push({
            role: "assistant",
            content: aiReply
        });


        // Keep conversation memory limited
        if (conversations[id].length > 12) {
            conversations[id] =
                conversations[id].slice(-12);
        }


        res.json({
            reply: aiReply
        });

    } catch (error) {

        console.error("AI Error:", error);

        res.status(500).json({
            reply: "AI service error. Please try again later."
        });

    }

});


/* =========================
   SUBMIT COMPLAINT API
========================= */

app.post("/api/complaints", async (req, res) => {

    try {

        const {
            category,
            priority,
            location,
            problem,
            recommendedAction
        } = req.body;

        if (!category || !priority || !problem) {

            return res.status(400).json({
                success: false,
                message: "Incomplete complaint information."
            });

        }

        const complaintId = `CC-${Date.now()}`;

        const complaint = await Complaint.create({

            complaintId,

            category,

            priority,

            location: location || "Not specified",

            problem,

            recommendedAction:
                recommendedAction || "Not specified",

            status: "Open"

        });

        console.log(
            "New Complaint Saved to MongoDB:",
            complaint.complaintId
        );

        res.status(201).json({

            success: true,

            message:
                "Complaint submitted successfully.",

            complaint

        });

    } catch (error) {

        console.error(
            "Complaint Error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Could not submit complaint."

        });

    }

});

/* =========================
   VIEW COMPLAINTS
========================= */

/* =========================
   VIEW COMPLAINTS
========================= */

app.get("/api/complaints", async (req, res) => {

    try {

        const complaints = await Complaint.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            total: complaints.length,
            complaints
        });

    } catch (error) {

        console.error(
            "Fetch Complaints Error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Could not fetch complaints."
        });

    }

});


/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});