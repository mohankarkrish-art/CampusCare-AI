const sessionId = "student-" + Date.now();

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");


// Backend API URLs

const API_URL = "http://localhost:5000/api/chat";

const COMPLAINT_API_URL =
    "http://localhost:5000/api/complaints";


// =========================
// EVENT LISTENERS
// =========================

sendBtn.addEventListener(
    "click",
    sendMessage
);


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


// =========================
// QUICK BUTTONS
// =========================

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


// =========================
// SIDEBAR BUTTONS
// =========================

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


// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    const message =
        userInput.value.trim();


    if (message === "") {
        return;
    }


    addUserMessage(message);


    userInput.value = "";


    sendBtn.disabled = true;

    sendBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
    `;


    const loadingId =
        addLoadingMessage();


    try {

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


        const data =
            await response.json();


        removeMessage(
            loadingId
        );


        if (!response.ok) {

            throw new Error(

                data.reply ||

                "AI service is currently unavailable."

            );

        }


        addBotMessage(
            data.reply
        );


    } catch (error) {

        console.error(
            "Chatbot Error:",
            error
        );


        removeMessage(
            loadingId
        );


        addBotMessage(
            "Sorry, I could not process your request right now. Please try again."
        );

    }


    sendBtn.disabled = false;

    sendBtn.innerHTML = `
        <span>Send</span>
        <i class="fa-solid fa-paper-plane"></i>
    `;

}


// =========================
// USER MESSAGE
// =========================

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


// =========================
// BOT MESSAGE
// =========================

function addBotMessage(message) {

    const messageDiv =
        document.createElement("div");


    messageDiv.classList.add(
        "message",
        "bot-message"
    );


    const isComplaintAnalysis =

        message.includes("Category:") &&

        message.includes("Priority:") &&

        message.includes("Location:") &&

        message.includes("Problem:") &&

        message.includes(
            "Recommended Action:"
        );


    let content = "";


    if (isComplaintAnalysis) {


        const category =
            extractField(
                message,
                "Category:",
                "Priority:"
            );


        const priority =
            extractField(
                message,
                "Priority:",
                "Location:"
            );


        const location =
            extractField(
                message,
                "Location:",
                "Problem:"
            );


        const problem =
            extractField(
                message,
                "Problem:",
                "Recommended Action:"
            );


        const recommendedAction =
            extractField(
                message,
                "Recommended Action:",
                null
            );


        content = `

            <div class="analysis-title">

                <i class="fa-solid fa-clipboard-check"></i>

                Complaint Analysis

            </div>


            <div class="analysis-grid">


                <div class="analysis-item">

                    <span class="analysis-label">

                        <i class="fa-solid fa-folder"></i>

                        Category

                    </span>

                    <strong>
                        ${escapeHTML(category)}
                    </strong>

                </div>



                <div class="analysis-item">

                    <span class="analysis-label">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        Priority

                    </span>

                    <strong>
                        ${escapeHTML(priority)}
                    </strong>

                </div>



                <div class="analysis-item full-width">

                    <span class="analysis-label">

                        <i class="fa-solid fa-location-dot"></i>

                        Location

                    </span>

                    <strong>
                        ${escapeHTML(location)}
                    </strong>

                </div>



                <div class="analysis-item full-width">

                    <span class="analysis-label">

                        <i class="fa-solid fa-file-lines"></i>

                        Problem

                    </span>

                    <p>
                        ${escapeHTML(problem)}
                    </p>

                </div>



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


            <button
                class="submit-complaint-btn"
            >
                <i class="fa-solid fa-paper-plane"></i>

                Submit Complaint
            </button>

        `;


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


        const submitButton =
            messageDiv.querySelector(
                ".submit-complaint-btn"
            );


        submitButton.addEventListener(
            "click",
            function () {

                submitComplaint(

                    category,

                    priority,

                    location,

                    problem,

                    recommendedAction,

                    submitButton

                );

            }
        );


    } else {


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


    chatBox.appendChild(
        messageDiv
    );


    scrollChat();

}


// =========================
// EXTRACT AI FIELDS
// =========================

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


// =========================
// SUBMIT COMPLAINT
// =========================

async function submitComplaint(

    category,

    priority,

    location,

    problem,

    recommendedAction,

    button

) {

    button.disabled = true;


    button.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Submitting...

    `;


    try {

        const response =
            await fetch(

                COMPLAINT_API_URL,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        category,

                        priority,

                        location,

                        problem,

                        recommendedAction

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||

                "Submission failed."

            );

        }


        button.outerHTML = `

            <div class="complaint-success">

                <i class="fa-solid fa-circle-check"></i>


                <div>

                    <strong>

                        Complaint Submitted Successfully

                    </strong>


                    <p>

                        Complaint ID:

                        ${escapeHTML(
                            data.complaint.complaintId
                        )}

                    </p>


                    <p>

                        Status:

                        ${escapeHTML(
                            data.complaint.status
                        )}

                    </p>


                </div>

            </div>

        `;


    } catch (error) {

        console.error(
            "Complaint Submission Error:",
            error
        );


        button.disabled = false;


        button.innerHTML = `

            <i class="fa-solid fa-paper-plane"></i>

            Submit Complaint

        `;


        alert(
            "Could not submit complaint. Please try again."
        );

    }

}


// =========================
// LOADING MESSAGE
// =========================

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


// =========================
// REMOVE MESSAGE
// =========================

function removeMessage(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.remove();

    }

}


// =========================
// ESCAPE HTML
// =========================

function escapeHTML(text) {

    const div =
        document.createElement("div");


    div.textContent =
        text ?? "";


    return div.innerHTML;

}


// =========================
// SCROLL CHAT
// =========================

function scrollChat() {

    chatBox.scrollTop =
        chatBox.scrollHeight;

}