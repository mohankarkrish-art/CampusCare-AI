const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// ==========================================
// STORE CONVERSATIONS IN MEMORY
// ==========================================

const conversations = {};


// ==========================================
// SYSTEM PROMPT
// ==========================================

const SYSTEM_PROMPT = `
You are CampusCare AI, a smart college complaint assistant.

Your job is to understand student complaints and classify them correctly.

Allowed categories:
- Electrical
- Plumbing
- Cleaning
- Internet/Network
- Classroom Equipment
- Security
- Other

Priority levels:
- High
- Medium
- Low


IMPORTANT RULES:

1. Analyze the student's current complaint and the conversation history provided.

2. NEVER invent previous complaints or information.

3. Do not ask unnecessary questions.

4. Only ask a question when important information is genuinely missing.

5. Do not ask safety questions unless the complaint clearly indicates a safety risk.

6. A complaint is complete when you know:
   - Category
   - Problem
   - Location

7. Do NOT require a building name if the room/location is already clear.

8. A broken classroom fan is ALWAYS Medium priority.

9. Sparks, exposed wires, electrical burning smell, fire risk, or dangerous electrical faults are High priority.

10. Minor cleaning or cosmetic problems are Low priority.

11. Normal Wi-Fi/network problems are Medium priority.

12. Plumbing leakage is normally Medium priority unless there is an obvious serious safety risk.

13. If location is missing, ask:
"Please provide the location of the problem."

14. If the problem is missing or unclear, ask:
"Please describe what is not working or what problem you are experiencing."


WHEN THE COMPLAINT IS COMPLETE:

Return EXACTLY this format:

Category: [category]
Priority: [High/Medium/Low]
Location: [location]
Problem: [problem description]
Recommended Action: [recommended action]


EXAMPLES:

Student:
"The fan in Room 204 is not working."

Response:
Category: Electrical
Priority: Medium
Location: Room 204
Problem: Fan is not working
Recommended Action: Inspect and repair or replace the faulty fan.


Student:
"There are sparks coming from the electrical socket in Lab 3."

Response:
Category: Electrical
Priority: High
Location: Lab 3
Problem: Sparks coming from electrical socket
Recommended Action: Immediately isolate the electrical supply if safe to do so and have the socket inspected by qualified maintenance staff.


Student:
"There is water leakage."

Response:
Please provide the location of the problem.


Student:
"The Wi-Fi is not working in Lab 2."

Response:
Category: Internet/Network
Priority: Medium
Location: Lab 2
Problem: Wi-Fi is not working
Recommended Action: Check the network connection, access point, and related network equipment.


Student:
"The classroom is dirty in Room 301."

Response:
Category: Cleaning
Priority: Low
Location: Room 301
Problem: Classroom is dirty
Recommended Action: Request cleaning staff to clean and inspect the classroom.
`;


// ==========================================
// HOME / HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "CampusCare AI backend is running"
    });

});


// ==========================================
// CHAT API
// ==========================================

app.post("/api/chat", async (req, res) => {

    try {

        const { message, sessionId } = req.body;


        if (!message || !message.trim()) {

            return res.status(400).json({
                success: false,
                error: "Message is required."
            });

        }


        const currentSession =
            sessionId || "default";


        if (!conversations[currentSession]) {

            conversations[currentSession] = [];

        }


        // Save student message
        conversations[currentSession].push({
            role: "user",
            text: message.trim()
        });


        // Keep recent conversation only
        const recentHistory =
            conversations[currentSession]
                .slice(-10);


        // Create Gemini conversation
        const contents = recentHistory.map(item => ({

            role:
                item.role === "user"
                    ? "user"
                    : "model",

            parts: [
                {
                    text: item.text
                }
            ]

        }));


        // Add system instructions to first user message
        const requestContents = [

            {
                role: "user",

                parts: [
                    {
                        text:
                            SYSTEM_PROMPT +
                            "\n\nStudent complaint:\n" +
                            message.trim()
                    }
                ]

            }

        ];


        // Add previous conversation after system instructions
        if (contents.length > 1) {

            requestContents.push(
                ...contents.slice(0, -1)
            );

        }


        // ======================================
        // GEMINI API
        // ======================================

        const apiKey =
            process.env.GEMINI_API_KEY;


        if (!apiKey) {

            return res.status(500).json({

                success: false,

                error:
                    "GEMINI_API_KEY is missing from .env file."

            });

        }


        const geminiURL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" +
            apiKey;


        const geminiResponse =
            await fetch(geminiURL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: requestContents

                })

            });


        const geminiData =
            await geminiResponse.json();


        if (!geminiResponse.ok) {

            console.error(
                "Gemini API Error:",
                geminiData
            );


            return res.status(
                geminiResponse.status
            ).json({

                success: false,

                error:
                    geminiData?.error?.message ||
                    "Gemini API request failed."

            });

        }


        const reply =
            geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;


        if (!reply) {

            return res.status(500).json({

                success: false,

                error:
                    "Gemini returned an empty response."

            });

        }


        // Save AI response
        conversations[currentSession].push({

            role: "model",

            text: reply

        });


        // Return response
        res.json({

            success: true,

            reply: reply

        });


    } catch (error) {

        console.error(
            "Server Error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Unable to process the complaint."

        });

    }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);