// Tabbed Multi-Page Navigation Logic
function switchPage(pageId, element) {
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(page => page.classList.remove('active'));
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(pageId).classList.add('active');
    if(element) element.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Theme Toggle Handler supporting Dark, Light, Cyberpunk, and Emerald Palettes
function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
}

// Dynamic Font Selection Logic
function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--font-main', fontFamily);
}
// ================= AI Chatbot Widget (Gemini-powered via /api/chat) =================
let conversationHistory = [];

function toggleChatbot() {
    const win = document.getElementById('chatbotWindow');
    const btn = document.getElementById('chatbotToggle');
    win.classList.toggle('active');
    btn.classList.toggle('active');
    if (win.classList.contains('active')) {
        const input = document.getElementById('chatbot-input');
        if (input) input.focus();
    }
}

function appendChatbotMessage(text, sender) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const msg = document.createElement('div');
    msg.className = 'chatbot-msg ' + (sender === 'user' ? 'user-msg' : 'bot-msg');
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function sendChatbotMessage() {
    const input = document.getElementById('chatbot-input');
    const messagesDiv = document.getElementById('chatbot-messages');
    const typing = document.getElementById('chatbot-typing');
    const text = input.value.trim();
    if (!text) return;

    appendChatbotMessage(text, 'user');
    conversationHistory.push({ role: 'user', parts: [{ text: text }] });
    input.value = '';

    typing.style.display = 'flex';
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const systemPrompt = "You are the AI assistant embedded in Muhammad Humayal's portfolio website. Humayal is a science student, Hafiz-e-Quran, and self-taught web developer building this site with HTML, CSS, and vanilla JavaScript. He took part in the Cambridge Climate Quest (SDG and climate research), plays cricket and football, and is preparing for O-Level exams while targeting top universities in Computer Science / Software Engineering. Answer visitor questions about his skills, projects, and background in a friendly, concise tone, under 3 sentences. If you don't know something specific about him, say so honestly instead of guessing.";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemPrompt: systemPrompt,
                contents: conversationHistory
            })
        });

        const raw = await response.text();
        let data = {};
        if (raw) {
            try {
                data = JSON.parse(raw);
            } catch (parseErr) {
                throw new Error('Received an invalid response from the server.');
            }
        }

        if (!response.ok) {
            throw new Error((data && data.error) || 'The chat request failed.');
        }

        const candidate = data.candidates && data.candidates[0];
        let reply;
        if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
            reply = candidate.content.parts[0].text.trim();
        } else if (candidate && candidate.finishReason && candidate.finishReason !== 'STOP') {
            reply = "I can't answer that one (reason: " + candidate.finishReason + "). Try rephrasing your question.";
        } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            reply = "That question was blocked (reason: " + data.promptFeedback.blockReason + "). Try rephrasing it.";
        } else {
            reply = "Sorry, I couldn't come up with a reply just now.";
        }

        conversationHistory.push({ role: 'model', parts: [{ text: reply }] });
        appendChatbotMessage(reply, 'bot');
    } catch (err) {
        console.error('Chatbot error:', err);
        const isNetworkError = err instanceof TypeError;
        const message = isNetworkError
            ? "I can't reach the chat server right now. Make sure this page is running through a server (e.g. your Vercel deployment or `node server.js`), not opened directly as a file."
            : "Sorry, something went wrong: " + err.message;
        appendChatbotMessage(message, 'bot');
    } finally {
        typing.style.display = 'none';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}