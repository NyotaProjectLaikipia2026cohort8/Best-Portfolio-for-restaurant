/**
* Template Name: Instant
* Template URL: https://bootstrapmade.com/newtemplate-bootstrap-website-template/
* Updated: Jul 07 2025 with Bootstrap v5.3.7
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
/* ============================================================
   ST GEORGE YOUTH CHAT
   DEBUGGED CHAT ENGINE
   ============================================================ */

/*
 IMPORTANT:
 Replace this URL with the /exec URL from your CURRENT
 Google Apps Script Web App deployment.
*/
const API_URL =
"https://script.google.com/macros/s/AKfycbyX6LQnFHqPySpKc__sX34P-Kj_iJGGAvwkSyX_GVy8YCwFO_4Q2aLzGqmelpZG7apy/exec";

const ROOM_ID = "general";
const AI_NAME = "Youth Assistant 🤖";

let currentUser = localStorage.getItem("chatUser") || "";
let messages = [];
let selectedImage = null;
let loadingMessages = false;
let sendingMessage = false;


/* ============================================================
   START APPLICATION
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    setupUser();
    setupKeyboard();

    // Load messages after page has completely initialized
    setTimeout(function () {
        loadMessages();
    }, 500);

    // Refresh messages every 3 seconds
    setInterval(function () {
        loadMessages();
    }, 3000);

});


/* ============================================================
   USER
   ============================================================ */

function setupUser() {

    const overlay = document.getElementById("registerOverlay");
    const display = document.getElementById("userDisplay");

    if (!overlay || !display) return;

    if (currentUser) {

        overlay.classList.add("hidden");
        display.textContent = currentUser;

    } else {

        overlay.classList.remove("hidden");
        display.textContent = "Guest";

    }
}


async function registerUser() {

    const input = document.getElementById("username");

    if (!input) return;

    const name = input.value.trim();

    if (!name) {

        alert("Please enter your name.");
        input.focus();
        return;

    }

    if (name.length < 2) {

        alert("Please enter at least 2 characters.");
        return;

    }

    const button = document.querySelector(
        "#registerOverlay button"
    );

    if (button) {
        button.disabled = true;
        button.textContent = "Joining...";
    }

    try {

        const result = await apiRequest({
            action: "registerMember",
            name: name
        });

        if (!result || result.success === false) {

            throw new Error(
                result?.message ||
                "Registration failed."
            );

        }

        currentUser = name;

        localStorage.setItem(
            "chatUser",
            currentUser
        );

        const overlay =
            document.getElementById("registerOverlay");

        const display =
            document.getElementById("userDisplay");

        if (overlay) {
            overlay.classList.add("hidden");
        }

        if (display) {
            display.textContent = currentUser;
        }

        await loadMessages();

    } catch (error) {

        console.error("REGISTRATION ERROR:", error);

        alert(
            "Registration failed.\n\n" +
            getErrorMessage(error)
        );

    } finally {

        if (button) {

            button.disabled = false;
            button.textContent = "Join Community";

        }

    }

}


/* ============================================================
   API REQUEST
   ============================================================ */

async function apiRequest(payload) {

    console.log("API REQUEST:", payload);

    let response;

    try {

        /*
         DO NOT add:
         Content-Type: application/json

         Keeping the request simple avoids unnecessary
         CORS preflight problems with Google Apps Script.
        */

        response = await fetch(API_URL, {

            method: "POST",

            body: JSON.stringify(payload),

            cache: "no-store"

        });

    } catch (networkError) {

        console.error(
            "NETWORK ERROR:",
            networkError
        );

        throw new Error(
            "Cannot connect to Google Apps Script. " +
            "Check your Web App URL, deployment access, " +
            "internet connection and Apps Script deployment."
        );

    }


    const rawText = await response.text();

    console.log(
        "API RESPONSE:",
        rawText
    );


    if (!response.ok) {

        throw new Error(
            "Server returned HTTP " +
            response.status
        );

    }


    if (!rawText) {

        throw new Error(
            "Google Apps Script returned an empty response."
        );

    }


    try {

        return JSON.parse(rawText);

    } catch (jsonError) {

        console.error(
            "INVALID JSON FROM SERVER:",
            rawText
        );

        throw new Error(
            "The server did not return valid JSON.\n\n" +
            "This usually means the Apps Script deployment " +
            "or Code.gs has an error."
        );

    }

}


/* ============================================================
   LOAD MESSAGES
   ============================================================ */

async function loadMessages() {

    if (loadingMessages) return;

    loadingMessages = true;

    try {

        const url =
            API_URL +
            "?action=getMessages" +
            "&roomId=" +
            encodeURIComponent(ROOM_ID);

        const response = await fetch(
            url,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        const rawText = await response.text();

        console.log(
            "GET MESSAGES:",
            rawText
        );

        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }

        let data;

        try {

            data = JSON.parse(rawText);

        } catch (e) {

            throw new Error(
                "Messages endpoint returned invalid JSON."
            );

        }


        if (data.success === false) {

            throw new Error(
                data.message ||
                "Unable to load messages."
            );

        }


        if (Array.isArray(data)) {

            messages = data;

        } else if (
            data &&
            Array.isArray(data.messages)
        ) {

            messages = data.messages;

        } else {

            messages = [];

        }


        setConnectionStatus(
            "● Online",
            true
        );

        renderMessages();

    } catch (error) {

        console.error(
            "LOAD MESSAGES ERROR:",
            error
        );

        setConnectionStatus(
            "● Offline",
            false
        );

    } finally {

        loadingMessages = false;

    }

}


/* ============================================================
   CONNECTION STATUS
   ============================================================ */

function setConnectionStatus(text, online) {

    const element =
        document.getElementById(
            "connectionStatus"
        );

    if (!element) return;

    element.textContent = text;

    if (online) {

        element.style.color = "#8ff0c8";

    } else {

        element.style.color = "#ffb4b4";

    }

}


/* ============================================================
   SEND MESSAGE
   ============================================================ */

async function sendMessage() {

    if (sendingMessage) return;

    if (!currentUser) {

        alert(
            "Please join the community first."
        );

        return;

    }


    const input =
        document.getElementById(
            "messageInput"
        );

    if (!input) return;


    const text =
        input.value.trim();


    if (!text && !selectedImage) {

        return;

    }


    const button =
        document.getElementById(
            "sendButton"
        );


    sendingMessage = true;


    if (button) {

        button.disabled = true;

        button.innerHTML =
            '<span class="spinner-border spinner-border-sm"></span>';

    }


    try {

        let media = null;


        /* ====================================================
           IMAGE
           ==================================================== */

        if (selectedImage) {

            showTyping("Uploading image...");

            media =
                await uploadImage(
                    selectedImage
                );

        }


        /* ====================================================
           SEND MESSAGE
           ==================================================== */

        hideTyping();


        const result =
            await apiRequest({

                action: "sendMessage",

                name: currentUser,

                message: text,

                roomId: ROOM_ID,

                messageType:
                    media
                    ? "image"
                    : "text",

                mediaUrl:
                    media
                    ? media.url
                    : "",

                mediaId:
                    media
                    ? media.id
                    : "",

                fileName:
                    media
                    ? media.name
                    : ""

            });


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                "Message was rejected by the server."
            );

        }


        input.value = "";

        removeAttachment();

        hideEmoji();

        await loadMessages();


        /* ====================================================
           AI COMMAND
           ==================================================== */

        if (text) {

            const lower =
                text.toLowerCase().trim();


            let aiQuestion = "";


            if (
                lower.startsWith("@ai")
            ) {

                aiQuestion =
                    text
                        .replace(/^@ai/i, "")
                        .trim();

            }

            else if (
                lower.startsWith("ai,")
            ) {

                aiQuestion =
                    text
                        .replace(/^ai,/i, "")
                        .trim();

            }

            else if (
                lower.startsWith(
                    "youth assistant"
                )
            ) {

                aiQuestion =
                    text
                        .replace(
                            /^youth assistant/i,
                            ""
                        )
                        .trim();

            }


            if (aiQuestion) {

                await askAI(
                    aiQuestion
                );

            }

        }


    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );

        alert(
            "Message could not be sent.\n\n" +
            getErrorMessage(error)
        );

    } finally {

        sendingMessage = false;

        hideTyping();

        if (button) {

            button.disabled = false;

            button.innerHTML =
                '<i class="bi bi-send-fill"></i>';

        }

    }

}


/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

async function uploadImage(file) {

    if (!file) {

        throw new Error(
            "No image selected."
        );

    }


    if (!file.type.startsWith("image/")) {

        throw new Error(
            "Only image files are supported."
        );

    }


    /*
     Limit original image size.
     This prevents huge phone photos from
     crashing the Apps Script request.
    */

    if (file.size > 10 * 1024 * 1024) {

        throw new Error(
            "Image is too large. " +
            "Please choose an image below 10 MB."
        );

    }


    const compressed =
        await compressImage(file);


    const base64 =
        await fileToBase64(
            compressed
        );


    const pureBase64 =
        base64.split(",")[1];


    if (!pureBase64) {

        throw new Error(
            "Could not prepare image data."
        );

    }


    const result =
        await apiRequest({

            action: "uploadMedia",

            name: currentUser,

            roomId: ROOM_ID,

            fileName:
                "chat_" +
                Date.now() +
                ".jpg",

            mimeType:
                "image/jpeg",

            data: pureBase64

        });


    if (
        !result ||
        result.success === false
    ) {

        throw new Error(
            result?.message ||
            "Image upload failed."
        );

    }


    if (!result.url) {

        throw new Error(
            "Image uploaded but server did not return a URL."
        );

    }


    return {

        url: result.url,

        id: result.id || "",

        name:
            result.name ||
            "image.jpg"

    };

}


/* ============================================================
   IMAGE COMPRESSION
   ============================================================ */

function compressImage(file) {

    return new Promise(
        function(resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function(event) {

                    const image =
                        new Image();


                    image.onload =
                        function() {

                            const maxWidth = 1200;

                            let width =
                                image.width;

                            let height =
                                image.height;


                            if (
                                width >
                                maxWidth
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        maxWidth /
                                        width
                                    );

                                width =
                                    maxWidth;

                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            if (!ctx) {

                                reject(
                                    new Error(
                                        "Could not create image canvas."
                                    )
                                );

                                return;

                            }


                            ctx.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            canvas.toBlob(
                                function(blob) {

                                    if (!blob) {

                                        reject(
                                            new Error(
                                                "Image compression failed."
                                            )
                                        );

                                        return;

                                    }


                                    resolve(blob);

                                },
                                "image/jpeg",
                                0.72
                            );

                        };


                    image.onerror =
                        function() {

                            reject(
                                new Error(
                                    "Browser could not read image."
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Could not read selected image."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


/* ============================================================
   FILE TO BASE64
   ============================================================ */

function fileToBase64(file) {

    return new Promise(
        function(resolve, reject) {

            const reader =
                new FileReader();


            reader.onload =
                function() {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "File conversion failed."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


/* ============================================================
   IMAGE SELECT
   ============================================================ */

function handleImage(event) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) return;


    if (!file.type.startsWith("image/")) {

        alert(
            "Please select a valid image."
        );

        event.target.value = "";

        return;

    }


    selectedImage = file;


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            const previewImage =
                document.getElementById(
                    "previewImage"
                );

            const previewName =
                document.getElementById(
                    "previewName"
                );

            const preview =
                document.getElementById(
                    "preview"
                );


            if (previewImage) {

                previewImage.src =
                    e.target.result;

            }


            if (previewName) {

                previewName.textContent =
                    file.name;

            }


            if (preview) {

                preview.style.display =
                    "block";

            }

        };


    reader.readAsDataURL(file);

}


function removeAttachment() {

    selectedImage = null;


    const input =
        document.getElementById(
            "imageInput"
        );

    const preview =
        document.getElementById(
            "preview"
        );


    if (input) {

        input.value = "";

    }


    if (preview) {

        preview.style.display =
            "none";

    }

}


/* ============================================================
   RENDER MESSAGES
   ============================================================ */

function renderMessages() {

    const container =
        document.getElementById(
            "messages"
        );


    if (!container) return;


    const wasNearBottom =
        container.scrollTop +
        container.clientHeight >=
        container.scrollHeight - 180;


    container.innerHTML = "";


    if (!messages.length) {

        const empty =
            document.createElement(
                "div"
            );

        empty.style.textAlign =
            "center";

        empty.style.color =
            "#999";

        empty.style.padding =
            "40px 10px";

        empty.innerHTML =
            "👋 Welcome to St George Youth Community<br>" +
            "<small>Start the conversation.</small>";

        container.appendChild(
            empty
        );

        return;

    }


    messages.forEach(
        function(msg) {

            if (!msg) return;


            const sender =
                String(
                    msg.name ||
                    msg.sender ||
                    "Unknown"
                );


            const text =
                String(
                    msg.message ||
                    msg.content ||
                    ""
                );


            const mediaUrl =
                msg.mediaUrl ||
                msg.imageUrl ||
                msg.media_url ||
                "";


            const type =
                String(
                    msg.messageType ||
                    msg.type ||
                    "text"
                ).toLowerCase();


            const isMe =
                sender === currentUser;


            const isAI =
                sender
                    .toLowerCase()
                    .includes(
                        "youth assistant"
                    ) ||
                sender.includes("🤖");


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "message-row" +
                (isMe
                    ? " sent"
                    : "") +
                (isAI
                    ? " ai-message"
                    : "");


            const bubble =
                document.createElement(
                    "div"
                );


            bubble.className =
                "message-bubble";


            /* NAME */

            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "message-name";


            name.textContent =
                isAI
                ? "🤖 Youth Assistant"
                : sender;


            bubble.appendChild(
                name
            );


            /* IMAGE */

            if (
                (
                    type === "image" ||
                    type === "photo"
                ) &&
                mediaUrl
            ) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.className =
                    "chat-image";


                image.src =
                    mediaUrl;


                image.alt =
                    "Shared image";


                image.loading =
                    "lazy";


                image.onerror =
                    function() {

                        image.alt =
                            "Image unavailable";

                        image.style.opacity =
                            "0.5";

                    };


                image.onclick =
                    function() {

                        window.open(
                            mediaUrl,
                            "_blank"
                        );

                    };


                bubble.appendChild(
                    image
                );

            }


            /* TEXT */

            if (text) {

                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "message-text";


                /*
                 textContent is intentional.
                 It prevents users from injecting HTML/JS.
                */

                content.textContent =
                    text;


                bubble.appendChild(
                    content
                );

            }


            /* TIME */

            const time =
                document.createElement(
                    "div"
                );


            time.className =
                "message-time";


            const timestamp =
                msg.timestamp ||
                msg.time ||
                msg.createdAt ||
                "";


            if (timestamp) {

                const date =
                    new Date(timestamp);


                if (
                    !isNaN(
                        date.getTime()
                    )
                ) {

                    time.textContent =
                        date.toLocaleTimeString(
                            [],
                            {
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );

                }

            }


            bubble.appendChild(
                time
            );


            row.appendChild(
                bubble
            );


            container.appendChild(
                row
            );

        }
    );


    if (wasNearBottom) {

        setTimeout(
            function() {

                container.scrollTop =
                    container.scrollHeight;

            },
            50
        );

    }

}


/* ============================================================
   AI ENGINE
   ============================================================ */

async function askAI(question) {

    if (!question) return;


    if (!currentUser) {

        alert(
            "Please join the community first."
        );

        return;

    }


    showTyping(
        "🤖 Youth Assistant is thinking..."
    );


    closeAIPanel();


    try {

        const context =
            buildConversationContext();


        const result =
            await apiRequest({

                action: "askAI",

                name: currentUser,

                question: question,

                roomId: ROOM_ID,

                context: context

            });


        if (
            !result ||
            result.success === false
        ) {

            throw new Error(
                result?.message ||
                "AI could not respond."
            );

        }


        await loadMessages();


    } catch (error) {

        console.error(
            "AI ERROR:",
            error
        );

        alert(
            "Youth Assistant could not respond.\n\n" +
            getErrorMessage(error)
        );

    } finally {

        hideTyping();

    }

}


/* ============================================================
   BUILD AI CONTEXT
   ============================================================ */

function buildConversationContext() {

    const recent =
        messages.slice(-30);


    if (!recent.length) {

        return "No previous conversation.";

    }


    return recent
        .map(
            function(msg) {

                const sender =
                    msg.name ||
                    msg.sender ||
                    "Unknown";

                const message =
                    msg.message ||
                    msg.content ||
                    "";


                if (!message) {

                    return "";

                }


                return (
                    sender +
                    ": " +
                    message
                );

            }
        )
        .filter(Boolean)
        .join("\n");

}


/* ============================================================
   TYPING
   ============================================================ */

function showTyping(text) {

    const typing =
        document.getElementById(
            "typing"
        );


    if (!typing) return;


    if (text) {

        typing.innerHTML =
            text +
            ' <span>•••</span>';

    }


    typing.style.display =
        "block";


    const container =
        document.getElementById(
            "messages"
        );


    if (container) {

        container.scrollTop =
            container.scrollHeight;

    }

}


function hideTyping() {

    const typing =
        document.getElementById(
            "typing"
        );


    if (!typing) return;


    typing.style.display =
        "none";

}


/* ============================================================
   AI PANEL
   ============================================================ */

function toggleAIPanel() {

    const panel =
        document.getElementById(
            "aiPanel"
        );


    if (!panel) return;


    if (
        panel.style.display ===
        "block"
    ) {

        panel.style.display =
            "none";

    } else {

        panel.style.display =
            "block";

    }

}


function closeAIPanel() {

    const panel =
        document.getElementById(
            "aiPanel"
        );


    if (panel) {

        panel.style.display =
            "none";

    }

}


/* ============================================================
   EMOJI
   ============================================================ */

function toggleEmoji() {

    const panel =
        document.getElementById(
            "emojiPanel"
        );


    if (!panel) return;


    panel.style.display =
        panel.style.display ===
        "block"
        ? "none"
        : "block";

}


function hideEmoji() {

    const panel =
        document.getElementById(
            "emojiPanel"
        );


    if (panel) {

        panel.style.display =
            "none";

    }

}


function insertEmoji(emoji) {

    const input =
        document.getElementById(
            "messageInput"
        );


    if (!input) return;


    input.value += emoji;

    input.focus();

}


/* ============================================================
   KEYBOARD
   ============================================================ */

function setupKeyboard() {

    const input =
        document.getElementById(
            "messageInput"
        );


    if (!input) return;


    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


/* ============================================================
   ERROR HANDLER
   ============================================================ */

function getErrorMessage(error) {

    if (!error) {

        return "Unknown error.";

    }


    if (error.message) {

        return error.message;

    }


    return String(error);

}


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.sendMessage =
    sendMessage;

window.registerUser =
    registerUser;

window.askAI =
    askAI;

window.handleImage =
    handleImage;

window.removeAttachment =
    removeAttachment;

window.toggleEmoji =
    toggleEmoji;

window.hideEmoji =
    hideEmoji;

window.insertEmoji =
    insertEmoji;

window.toggleAIPanel =
    toggleAIPanel;

window.closeAIPanel =
    closeAIPanel;
function testAI() {

  const properties =
    PropertiesService.getScriptProperties();

  const apiKey =
    properties.getProperty("OPENAI_API_KEY");

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing from Script Properties."
    );
  }

  const payload = {
    model: "gpt-5.6-luna",

    store: false,

    input: [
      {
        role: "developer",
        content:
          "You are the St George Youth Assistant. Be friendly, concise and helpful."
      },
      {
        role: "user",
        content:
          "Give me one short motivational message for the youth."
      }
    ]
  };

  const response = UrlFetchApp.fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "post",

      contentType: "application/json",

      headers: {
        Authorization:
          "Bearer " + apiKey
      },

      payload:
        JSON.stringify(payload),

      muteHttpExceptions: true
    }
  );

  const status =
    response.getResponseCode();

  const body =
    response.getContentText();

  console.log(
    "HTTP STATUS: " + status
  );

  console.log(
    "RESPONSE: " + body
  );

  if (status < 200 || status >= 300) {

    throw new Error(
      "OpenAI API error (" +
      status +
      "): " +
      body
    );

  }

  const result =
    JSON.parse(body);

  console.log(
    "AI ANSWER: " +
    result.output_text
  );

  return result.output_text;
}
(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init typed.js
   */
  const selectTyped = document.querySelector('.typed');
  if (selectTyped) {
    let typed_strings = selectTyped.getAttribute('data-typed-items');
    typed_strings = typed_strings.split(',');
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Frequently Asked Questions Toggle
   */
  document.querySelectorAll('.faq-item h3, .faq-item .faq-toggle, .faq-item .faq-header').forEach((faqItem) => {
    faqItem.addEventListener('click', () => {
      faqItem.parentNode.classList.toggle('faq-active');
    });
  });

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();