const sessionId = "student-" + Date.now();


/* =========================
   DOM ELEMENTS
========================= */

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");


/* =========================
   BACKEND API URL
========================= */

const API_URL = "http://localhost:5000/api/chat";


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================
   ENTER KEY
========================= */

userInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================
   QUICK COMPLAINT BUTTONS
========================= */

document
    .querySelectorAll(".quick-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const complaint =
                    button.innerText.trim();

                userInput.value =
                    complaint;

                sendMessage();

            }
        );

    });


/* =========================
   FEATURE BUTTONS
========================= */

document
    .querySelectorAll(".feature-item")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const message =
                    button.dataset.message;

                if (message) {

                    userInput.value =
                        message;

                    userInput.focus();

                }

            }
        );

    });


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const message =
        userInput.value.trim();


    if (message === "") {
        return;
    }


    /* =========================
       SHOW USER MESSAGE
    ========================= */

    addUserMessage(message);


    /* =========================
       CLEAR INPUT
    ========================= */

    userInput.value = "";


    /* =========================
       DISABLE SEND BUTTON
    ========================= */

    sendBtn.disabled = true;

    sendBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
    `;


    /* =========================
       SHOW LOADING
    ========================= */

    const loadingId =
        addLoadingMessage();


    try {

        /* =========================
           SEND REQUEST TO BACKEND
        ========================= */

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    message:
                        message,

                    sessionId:
                        sessionId

                })

            });


        /* =========================
           READ RESPONSE
        ========================= */

        const data =
            await response.json();


        /* =========================
           REMOVE LOADING
        ========================= */

        removeMessage(
            loadingId
        );


        /* =========================
           CHECK RESPONSE
        ========================= */

        if (!response.ok) {

            throw new Error(

                data.reply ||

                "AI service is currently unavailable."

            );

        }


        /* =========================
           SHOW AI RESPONSE
        ========================= */

        addBotMessage(
            data.reply
        );


    } catch (error) {

        console.error(
            "Chatbot Error:",
            error
        );


        /* =========================
           REMOVE LOADING
        ========================= */

        removeMessage(
            loadingId
        );


        /* =========================
           ERROR MESSAGE
        ========================= */

        addBotMessage(
            "Sorry, I could not process your request right now. Please try again."
        );

    }


    /* =========================
       ENABLE SEND BUTTON
    ========================= */

    sendBtn.disabled = false;

    sendBtn.innerHTML = `
        <span>Send</span>
        <i class="fa-solid fa-paper-plane"></i>
    `;

}


/* =========================
   ADD USER MESSAGE
========================= */

function addUserMessage(message) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "user-message"
    );


    messageDiv.innerHTML = `

        <div class="message-content">

            <div class="message-label">
                You
            </div>

            <div class="message-bubble">
                ${escapeHTML(message)}
            </div>

        </div>

    `;


    chatBox.appendChild(
        messageDiv
    );


    scrollChat();

}


/* =========================
   ADD BOT MESSAGE
========================= */

function addBotMessage(message) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "bot-message"
    );


    /* =========================
       CHECK FOR COMPLAINT ANALYSIS
    ========================= */

    const isComplaintAnalysis =

        message.includes("Category:") &&

        message.includes("Priority:") &&

        message.includes("Location:") &&

        message.includes("Problem:") &&

        message.includes(
            "Recommended Action:"
        );


    let content = "";


    /* =========================
       STRUCTURED COMPLAINT
    ========================= */

    if (isComplaintAnalysis) {


        /* =========================
           EXTRACT CATEGORY
        ========================= */

        const category =
            extractField(
                message,
                "Category:",
                "Priority:"
            );


        /* =========================
           EXTRACT PRIORITY
        ========================= */

        const priority =
            extractField(
                message,
                "Priority:",
                "Location:"
            );


        /* =========================
           EXTRACT LOCATION
        ========================= */

        const location =
            extractField(
                message,
                "Location:",
                "Problem:"
            );


        /* =========================
           EXTRACT PROBLEM
        ========================= */

        const problem =
            extractField(
                message,
                "Problem:",
                "Recommended Action:"
            );


        /* =========================
           EXTRACT RECOMMENDED ACTION
        ========================= */

        const recommendedAction =
            extractField(
                message,
                "Recommended Action:",
                null
            );


        /* =========================
           CREATE ANALYSIS CARD
        ========================= */

        content = `

            <div class="analysis-title">

                <i class="fa-solid fa-clipboard-check"></i>

                Complaint Analysis

            </div>


            <div class="analysis-grid">


                <!-- CATEGORY -->

                <div class="analysis-item">

                    <span class="analysis-label">

                        <i class="fa-solid fa-folder"></i>

                        Category

                    </span>

                    <strong>
                        ${escapeHTML(category)}
                    </strong>

                </div>


                <!-- PRIORITY -->

                <div class="analysis-item">

                    <span class="analysis-label">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        Priority

                    </span>

                    <strong>
                        ${escapeHTML(priority)}
                    </strong>

                </div>


                <!-- LOCATION -->

                <div class="analysis-item full-width">

                    <span class="analysis-label">

                        <i class="fa-solid fa-location-dot"></i>

                        Location

                    </span>

                    <strong>
                        ${escapeHTML(location)}
                    </strong>

                </div>


                <!-- PROBLEM -->

                <div class="analysis-item full-width">

                    <span class="analysis-label">

                        <i class="fa-solid fa-file-lines"></i>

                        Problem

                    </span>

                    <p>
                        ${escapeHTML(problem)}
                    </p>

                </div>


                <!-- RECOMMENDED ACTION -->

                <div class="analysis-item action-item full-width">

                    <span class="analysis-label">

                        <i class="fa-solid fa-screwdriver-wrench"></i>

                        Recommended Action

                    </span>

                    <p>
                        ${escapeHTML(
                            recommendedAction
                        )}
                    </p>

                </div>


            </div>

        `;


        /* =========================
           AI MESSAGE HTML
        ========================= */

        messageDiv.innerHTML = `

            <div class="avatar ai-avatar">

                <i class="fa-solid fa-robot"></i>

            </div>


            <div class="message-content">

                <div class="message-label">
                    CampusCare AI
                </div>


                <div class="message-bubble analysis-bubble">

                    ${content}

                </div>

            </div>

        `;


    } else {


        /* =========================
           NORMAL AI MESSAGE
        ========================= */

        content =
            escapeHTML(message)
                .replace(
                    /\n/g,
                    "<br>"
                );


        messageDiv.innerHTML = `

            <div class="avatar ai-avatar">

                <i class="fa-solid fa-robot"></i>

            </div>


            <div class="message-content">

                <div class="message-label">
                    CampusCare AI
                </div>


                <div class="message-bubble analysis-bubble">

                    ${content}

                </div>

            </div>

        `;

    }


    /* =========================
       ADD TO CHAT
    ========================= */

    chatBox.appendChild(
        messageDiv
    );


    scrollChat();

}


/* =========================
   EXTRACT AI FIELDS
========================= */

function extractField(
    message,
    startLabel,
    endLabel
) {

    const startIndex =
        message.indexOf(
            startLabel
        );


    if (startIndex === -1) {

        return "Not specified";

    }


    const valueStart =
        startIndex +
        startLabel.length;


    let valueEnd =
        message.length;


    if (endLabel) {

        const endIndex =
            message.indexOf(
                endLabel,
                valueStart
            );


        if (endIndex !== -1) {

            valueEnd =
                endIndex;

        }

    }


    return message
        .substring(
            valueStart,
            valueEnd
        )
        .trim();

}


/* =========================
   LOADING MESSAGE
========================= */

function addLoadingMessage() {

    const id =
        "loading-" +
        Date.now();


    const loadingDiv =
        document.createElement("div");


    loadingDiv.id = id;


    loadingDiv.classList.add(
        "message",
        "bot-message"
    );


    loadingDiv.innerHTML = `

        <div class="avatar ai-avatar">

            <i class="fa-solid fa-robot"></i>

        </div>


        <div class="message-content">

            <div class="message-label">
                CampusCare AI
            </div>


            <div class="message-bubble">

                <i class="fa-solid fa-spinner fa-spin"></i>

                Analyzing your complaint...

            </div>

        </div>

    `;


    chatBox.appendChild(
        loadingDiv
    );


    scrollChat();


    return id;

}


/* =========================
   REMOVE MESSAGE
========================= */

function removeMessage(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.remove();

    }

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text ?? "";


    return div.innerHTML;

}


/* =========================
   SCROLL CHAT
========================= */

function scrollChat() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}