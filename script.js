// Tabbed Multi-Page Navigation Logic
function switchPage(pageId, element) {
    const pages = document.querySelectorAll('.page-view');
    pages.forEach(page => page.classList.remove('active'));
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    document.getElementById(pageId).classList.add('active');
    if(element) element.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (pageId === 'metrics') animateMetrics();
    if (pageId === 'weather') startWeatherPage();
}

// Theme Toggle Handler supporting Dark, Light, Cyberpunk, and Emerald Palettes
function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    document.querySelectorAll('.theme-toggle').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === themeName));
}

// Dynamic Font Selection Logic
function changeFont(fontFamily) {
    document.documentElement.style.setProperty('--font-main', fontFamily);
}

// Contact Form: delivers the message to your email, shows a thank-you, then the form returns
// No API key needed. Just type YOUR email address on the line below (that is where messages will arrive).
// Delivery uses FormSubmit (https://formsubmit.co), a free email-forwarding service.
const CONTACT_EMAIL = "humayal.888@gmail.com";
const CONTACT_ENDPOINT = "https://formsubmit.co/ajax/";
const CONTACT_THANKS_SECONDS = 2;   // how long the thank-you stays before the form comes back
const CF_DEFAULT_TOPIC = "Just Saying Hi";
let cfTopic = CF_DEFAULT_TOPIC;
let cfSending = false;
let cfThanksTimer = null;
let cfTypingTimer = null;

function cfEl(id) {
    return document.getElementById(id);
}

function cfSetStatus(message, type) {
    const el = cfEl("cf-status");
    el.className = "weather-status" + (type ? " " + type : "");
    el.textContent = message || "";
}

// Steps list: everything before `n` is done, `n` is current (n = 4 marks all done)
function cfSetStep(n) {
    document.querySelectorAll("#contact-steps li").forEach(li => {
        const step = parseInt(li.dataset.step, 10);
        li.classList.toggle("done", step < n);
        li.classList.toggle("current", step === n);
    });
}

function cfConfigured() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(CONTACT_EMAIL) && CONTACT_EMAIL.indexOf("YOUR_EMAIL") === -1;
}

// Setup hints are only shown to you while testing locally; live visitors get a friendly message instead
function cfIsLocal() {
    return ["", "localhost", "127.0.0.1"].indexOf(window.location.hostname) !== -1;
}

// Checks the three fields; `show` also reveals the error messages
function cfValidate(show) {
    const name = cfEl("cf-name").value.trim();
    const email = cfEl("cf-email").value.trim();
    const message = cfEl("cf-message").value.trim();
    const checks = [
        { id: "name", ok: name.length >= 2, error: "Please enter your name." },
        { id: "email", ok: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), error: "Please enter a valid email so I can reply." },
        { id: "message", ok: message.length >= 1, error: "Please write a message." }
    ];

    checks.forEach(c => {
        const field = cfEl("cf-" + c.id + "-field");
        field.classList.toggle("valid", c.ok);
        if (c.ok) {
            field.classList.remove("invalid");
            cfEl("cf-" + c.id + "-error").textContent = "";
        } else if (show) {
            field.classList.add("invalid");
            cfEl("cf-" + c.id + "-error").textContent = c.error;
        }
    });

    const done = checks.filter(c => c.ok).length;
    const percent = Math.round(done / checks.length * 100);
    cfEl("cf-progress-fill").style.width = percent + "%";
    cfEl("cf-progress-text").textContent = percent + "%";
    const send = cfEl("cf-send");
    send.classList.toggle("ready", done === checks.length);
    send.classList.toggle("not-ready", done !== checks.length);
    if (!cfEl("contact-form").hidden && !cfSending) cfSetStep(done === checks.length ? 2 : 1);
    return done === checks.length;
}

// Live preview bubble mirrors what the visitor types (the typing dots use setTimeout)
function cfUpdatePreview() {
    const name = cfEl("cf-name").value.trim();
    const message = cfEl("cf-message").value;
    cfEl("pv-name").textContent = name || "Your name";
    cfEl("pv-avatar").textContent = name ? name.charAt(0).toUpperCase() : "?";
    cfEl("pv-topic").textContent = cfTopic;
    const bubble = cfEl("pv-bubble");
    bubble.textContent = message.trim() ? message : "Your message will appear here as you type.";
    bubble.classList.toggle("empty", !message.trim());

    const typing = cfEl("pv-typing");
    typing.classList.add("active");
    clearTimeout(cfTypingTimer);
    cfTypingTimer = setTimeout(() => typing.classList.remove("active"), 1200);
}

function initContactForm() {
    if (!cfEl("contact-form")) return;
    ["cf-name", "cf-email", "cf-message"].forEach(id => {
        cfEl(id).addEventListener("input", () => {
            cfValidate(false);
            cfUpdatePreview();
        });
    });

    cfEl("cf-topics").addEventListener("click", e => {
        const chip = e.target.closest(".topic-chip");
        if (!chip) return;
        document.querySelectorAll(".topic-chip").forEach(c => c.classList.toggle("active", c === chip));
        cfTopic = chip.dataset.topic;
        cfEl("contact-grid").dataset.accent = chip.dataset.accent;
        cfUpdatePreview();
    });
}
document.addEventListener("DOMContentLoaded", initContactForm);

async function handleContactSubmit(event) {
    event.preventDefault();
    if (cfSending) return false;
    if (cfEl("cf-honey").value) return false; // bots fill the hidden field

    const form = cfEl("contact-form");
    if (!cfValidate(true)) {
        cfSetStatus("Please complete the highlighted fields.", "error");
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        setTimeout(() => form.classList.remove("shake"), 450);
        return false;
    }
    if (!cfConfigured()) {
        console.warn("Contact form: type your email address into CONTACT_EMAIL in script.js.");
        cfSetStatus(cfIsLocal() ? "Setup needed: type your email address into CONTACT_EMAIL at the top of the contact section in script.js." : "Sorry, messages can't be sent right now. Please try again later.", "error");
        return false;
    }

    const name = cfEl("cf-name").value.trim();
    const email = cfEl("cf-email").value.trim();
    const message = cfEl("cf-message").value.trim();
    const send = cfEl("cf-send");

    cfSending = true;
    send.classList.add("sending");
    send.querySelector(".send-label").textContent = "Sending…";
    cfSetStatus("Delivering your message…", "loading");

    try {
        const response = await fetch(CONTACT_ENDPOINT + CONTACT_EMAIL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                topic: cfTopic,
                message: message,
                _subject: "Portfolio message (" + cfTopic + ") from " + name,
                _template: "table",
                _captcha: "false"
            })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !(data.success === true || data.success === "true")) {
            throw new Error(data.message || "The message could not be sent. Please try again.");
        }
        cfSetStatus("");
        showContactThanks(name);
    } catch (err) {
        console.error("Contact form error:", err);
        cfSetStatus(err instanceof TypeError ? "Can't reach the mail service. Check your internet connection and try again." : "Sorry, your message couldn't be sent. Please try again in a moment.", "error");
    } finally {
        cfSending = false;
        send.classList.remove("sending");
        send.querySelector(".send-label").textContent = "Send Message";
    }
    return false;
}

// Form fades out -> thank-you appears -> setInterval counts 4..0 -> thank-you disappears and the form returns
function showContactThanks(name) {
    const form = cfEl("contact-form");
    const thanks = cfEl("contact-thankyou");
    const firstName = name.split(" ")[0];
    cfSetStep(3);
    form.classList.add("is-leaving");

    setTimeout(() => {
        form.hidden = true;
        form.classList.remove("is-leaving");
        cfEl("thanks-title").textContent = "Thank you, " + firstName + "!";
        thanks.hidden = false;

        let remaining = CONTACT_THANKS_SECONDS;
        const ring = cfEl("thanks-ring");
        const label = cfEl("contact-countdown");
        label.textContent = "Form returns in " + remaining + "s";
        ring.style.strokeDashoffset = "0";

        clearInterval(cfThanksTimer);
        cfThanksTimer = setInterval(() => {
            remaining--;
            label.textContent = remaining > 0 ? "Form returns in " + remaining + "s" : "Bringing the form back…";
            ring.style.strokeDashoffset = (100 * (1 - remaining / CONTACT_THANKS_SECONDS)).toFixed(1);
            if (remaining <= 0) {
                clearInterval(cfThanksTimer);
                finishContactThanks();
            }
        }, 1000);
    }, 450);
}

function finishContactThanks() {
    const thanks = cfEl("contact-thankyou");
    thanks.classList.add("is-leaving");
    setTimeout(() => {
        thanks.hidden = true;
        thanks.classList.remove("is-leaving");
        resetContactForm();
    }, 450);
}

// Clears everything and brings a fresh, empty form back
function resetContactForm() {
    const form = cfEl("contact-form");
    form.reset();
    ["name", "email", "message"].forEach(id => {
        cfEl("cf-" + id + "-field").classList.remove("valid", "invalid");
        cfEl("cf-" + id + "-error").textContent = "";
    });
    cfTopic = CF_DEFAULT_TOPIC;
    document.querySelectorAll(".topic-chip").forEach(c => c.classList.toggle("active", c.dataset.topic === CF_DEFAULT_TOPIC));
    cfEl("contact-grid").dataset.accent = "hi";
    cfSetStatus("");
    form.hidden = false;
    form.classList.remove("is-entering");
    void form.offsetWidth;
    form.classList.add("is-entering");
    cfValidate(false);
    cfUpdatePreview();
    cfEl("pv-typing").classList.remove("active");
    cfSetStep(1);
}

// ================= Timer-Powered Effects (setTimeout & setInterval) =================
const TYPEWRITER_SENTENCES = [
    "Web Developer & Academic Achiever",
    "Crafting fast, clean vanilla JS sites.",
    "Exploring SDG and climate solutions.",
    "Aiming for Computer Science excellence."
];
const TYPE_SPEED = 65;          // ms per typed character
const DELETE_SPEED = 32;        // ms per deleted character
const HOLD_FULL = 1900;         // pause once a sentence is fully typed
const HOLD_EMPTY = 450;         // pause before the next sentence starts
const SPOTLIGHT_INTERVAL = 3600; // ms between project spotlight changes

// 1) Typewriter with rotating sentences + progress dots (setTimeout)
function startTypewriter() {
    const el = document.getElementById("typewriter-text");
    if (!el) return;
    const dots = document.querySelectorAll(".type-dot");
    let sentenceIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function markDot() {
        dots.forEach((dot, i) => dot.classList.toggle("active", i === sentenceIndex));
    }
    markDot();

    function tick() {
        const sentence = TYPEWRITER_SENTENCES[sentenceIndex];
        let delay;

        if (!deleting) {
            charIndex++;
            el.textContent = sentence.slice(0, charIndex);
            if (charIndex === sentence.length) {
                deleting = true;
                delay = HOLD_FULL;
            } else {
                delay = TYPE_SPEED + Math.random() * 45;
            }
        } else {
            charIndex--;
            el.textContent = sentence.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                sentenceIndex = (sentenceIndex + 1) % TYPEWRITER_SENTENCES.length;
                markDot();
                delay = HOLD_EMPTY;
            } else {
                delay = DELETE_SPEED;
            }
        }
        setTimeout(tick, delay);
    }

    setTimeout(tick, 400);
}

// 2) Live clock pill in the hero (setInterval)
function startLiveClock() {
    const el = document.getElementById("live-clock");
    if (!el) return;
    const pad = n => String(n).padStart(2, "0");

    function render() {
        const now = new Date();
        const colon = '<span class="clock-colon">:</span>';
        el.innerHTML = pad(now.getHours()) + colon + pad(now.getMinutes()) + colon + pad(now.getSeconds());
    }
    render();
    setInterval(render, 1000);
}

// 3) Featured project spotlight that cycles automatically (setInterval)
function startProjectSpotlight() {
    const cards = document.querySelectorAll(".project-card");
    const home = document.getElementById("home");
    if (!cards.length) return;

    document.documentElement.style.setProperty("--spot-duration", SPOTLIGHT_INTERVAL + "ms");
    let current = 0;
    let paused = false;

    function show(index) {
        cards.forEach(card => card.classList.remove("spotlight"));
        void cards[index].offsetWidth; // restart the progress-line animation
        cards[index].classList.add("spotlight");
    }

    cards.forEach((card, index) => {
        card.addEventListener("mouseenter", () => {
            paused = true;
            cards.forEach(c => c.classList.remove("spotlight"));
        });
        card.addEventListener("mouseleave", () => {
            paused = false;
            current = index;
            show(current);
        });
    });

    show(current);
    setInterval(() => {
        if (paused || document.hidden || !home.classList.contains("active")) return;
        current = (current + 1) % cards.length;
        show(current);
    }, SPOTLIGHT_INTERVAL);
}

// 4) Metrics count-up: bars and percentages fill together (setInterval)
let metricsTimer = null;
function animateMetrics() {
    const items = [];
    document.querySelectorAll("#metrics .stat-group").forEach(group => {
        const fill = group.querySelector(".progress-fill");
        const label = group.querySelector(".stat-label span:last-child");
        if (!fill || !label) return;
        if (!fill.dataset.target) {
            fill.dataset.target = parseFloat(fill.style.width) || parseFloat(label.textContent) || 0;
        }
        fill.style.transition = "none";
        fill.style.width = "0%";
        label.textContent = "0%";
        items.push({ fill: fill, label: label, target: parseFloat(fill.dataset.target) });
    });
    if (!items.length) return;

    clearInterval(metricsTimer);
    const DURATION = 1100;
    const STAGGER = 140;
    const startTime = Date.now();

    metricsTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let finished = true;

        items.forEach((item, i) => {
            const t = Math.min(Math.max((elapsed - i * STAGGER) / DURATION, 0), 1);
            const eased = 1 - Math.pow(1 - t, 3);
            const value = item.target * eased;
            item.fill.style.width = value + "%";
            item.label.textContent = Math.round(value) + "%";
            if (t < 1) finished = false;
        });

        if (finished) {
            clearInterval(metricsTimer);
            items.forEach(item => { item.fill.style.transition = ""; });
        }
    }, 16);
}

// 5) Gentle chatbot attention nudge after a short delay (setTimeout)
function startChatbotNudge() {
    const btn = document.getElementById("chatbotToggle");
    if (!btn) return;
    setTimeout(() => {
        if (btn.classList.contains("active")) return;
        btn.classList.add("nudge");
        setTimeout(() => btn.classList.remove("nudge"), 5200);
    }, 8000);
}

document.addEventListener("DOMContentLoaded", () => {
    startTypewriter();
    startLiveClock();
    startProjectSpotlight();
    startChatbotNudge();
});

// ================= AI Chatbot Widget (Gemini-powered via /api/chat) =================
let conversationHistory = [];

function toggleChatbot() {
    const win = document.getElementById('chatbotWindow');
    const btn = document.getElementById('chatbotToggle');
    win.classList.toggle('active');
    btn.classList.toggle('active');
    btn.classList.remove('nudge');
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

// ================= Live Weather Page (Open-Meteo API) =================
const WX_REFRESH_SECONDS = 30;                       // live re-sync every 30 seconds
const WX_REFRESH_MS = WX_REFRESH_SECONDS * 1000;
const WX_DEFAULT_PLACE = { name: "Islamabad", country: "Pakistan", lat: 33.6844, lon: 73.0479 };
let wxPlace = WX_DEFAULT_PLACE;
let wxData = null;
let wxUnit = "C";
let wxStarted = false;
let wxLastUpdate = 0;
let wxRequestId = 0;
let wxCountdown = WX_REFRESH_SECONDS;
let wxShownTemp = 0;
let wxSunFraction = 0;
let wxTempTimer = null;
let wxSunTimer = null;
let wxFxKey = "";
let wxHourlySig = "";
let wxDailySig = "";
let wxCities = [];
let wxCityData = [];
let wxWaveTimers = [];
let wxSweepTimers = [];

function wxEl(id) {
    return document.getElementById(id);
}

// Small setInterval-based tween used for the temperature count-up and the sun arc
function wxTween(duration, step, done) {
    const start = Date.now();
    const id = setInterval(() => {
        const t = Math.min((Date.now() - start) / duration, 1);
        step(1 - Math.pow(1 - t, 3));
        if (t >= 1) {
            clearInterval(id);
            if (done) done();
        }
    }, 16);
    return id;
}

// WMO weather codes -> label, icon and visual theme
function wxDescribe(code, isDay) {
    const day = isDay !== 0;
    if (code === 0) return { label: day ? "Clear sky" : "Clear night", icon: day ? "☀️" : "🌙", theme: "clear" };
    if (code === 1) return { label: "Mainly clear", icon: day ? "🌤️" : "🌙", theme: "clear" };
    if (code === 2) return { label: "Partly cloudy", icon: day ? "⛅" : "☁️", theme: "cloud" };
    if (code === 3) return { label: "Overcast", icon: "☁️", theme: "cloud" };
    if (code === 45 || code === 48) return { label: "Foggy", icon: "🌫️", theme: "fog" };
    if (code >= 51 && code <= 57) return { label: code >= 56 ? "Freezing drizzle" : "Light drizzle", icon: "🌦️", theme: "rain" };
    if (code >= 61 && code <= 67) {
        const rainLabel = code >= 66 ? "Freezing rain" : code === 61 ? "Light rain" : code === 63 ? "Rain" : "Heavy rain";
        return { label: rainLabel, icon: "🌧️", theme: "rain" };
    }
    if (code >= 71 && code <= 77) {
        const snowLabel = code === 77 ? "Snow grains" : code === 71 ? "Light snow" : code === 73 ? "Snowfall" : "Heavy snow";
        return { label: snowLabel, icon: "❄️", theme: "snow" };
    }
    if (code >= 80 && code <= 82) {
        const showerLabel = code === 80 ? "Light showers" : code === 81 ? "Rain showers" : "Violent showers";
        return { label: showerLabel, icon: "🌦️", theme: "rain" };
    }
    if (code === 85 || code === 86) return { label: "Snow showers", icon: "🌨️", theme: "snow" };
    if (code >= 95) return { label: code === 95 ? "Thunderstorm" : "Thunderstorm with hail", icon: "⛈️", theme: "storm" };
    return { label: "Unknown conditions", icon: "🌡️", theme: "cloud" };
}

function wxT(celsius) {
    return wxUnit === "F" ? Math.round(celsius * 9 / 5 + 32) : Math.round(celsius);
}

// Temperature difference in the active unit (used for the change badges)
function wxDiff(celsiusDiff) {
    return wxUnit === "F" ? celsiusDiff * 9 / 5 : celsiusDiff;
}

function wxSetStatus(message, type) {
    const el = wxEl("weather-status");
    el.className = "weather-status" + (type ? " " + type : "");
    el.textContent = message || "";
}

function wxTimeToMinutes(iso) {
    return parseInt(iso.slice(11, 13), 10) * 60 + parseInt(iso.slice(14, 16), 10);
}

function wxHourStart() {
    const key = wxData.current.time.slice(0, 13);
    const index = wxData.hourly.time.findIndex(t => t.slice(0, 13) === key);
    return index < 0 ? 0 : index;
}

function wxSamePlace(a, b) {
    return !!a && !!b && Math.abs(a.lat - b.lat) < 0.001 && Math.abs(a.lon - b.lon) < 0.001;
}

// dawn / day / dusk / night, based on the city's own local time and sun times
function wxSkyPhase() {
    const cur = wxData.current;
    const rise = wxData.daily.sunrise[0];
    const set = wxData.daily.sunset[0];
    if (!rise || !set) return cur.is_day ? "day" : "night";
    const now = wxTimeToMinutes(cur.time);
    const r = wxTimeToMinutes(rise);
    const s = wxTimeToMinutes(set);
    if (now >= r - 30 && now < r + 90) return "dawn";
    if (now >= s - 90 && now < s + 30) return "dusk";
    if (now >= r + 90 && now < s - 90) return "day";
    return "night";
}

// ---- setTimeout colour choreography ----
// Hero accent colours travel blue -> emerald -> orange, then settle on the weather's own colours
function wxColorSweep() {
    const hero = wxEl("weather-hero");
    const stages = [
        ["var(--electric-blue)", "var(--neon-cyan)"],
        ["var(--emerald-green)", "var(--electric-blue)"],
        ["var(--vibrant-orange)", "var(--emerald-green)"]
    ];
    wxSweepTimers.forEach(clearTimeout);
    wxSweepTimers = [];
    stages.forEach((stage, i) => {
        wxSweepTimers.push(setTimeout(() => {
            hero.style.setProperty("--wx-a", stage[0]);
            hero.style.setProperty("--wx-b", stage[1]);
        }, i * 450));
    });
    wxSweepTimers.push(setTimeout(() => {
        hero.style.removeProperty("--wx-a");
        hero.style.removeProperty("--wx-b");
    }, stages.length * 450));
}

// A colour wave lights every card from the first (start) to the last (end), one after another
function wxColorWave() {
    const cards = document.querySelectorAll("#city-board .city-card, #weather-body .glass-card");
    wxWaveTimers.forEach(clearTimeout);
    wxWaveTimers = [];
    cards.forEach((card, i) => {
        const wave = "wave-" + (i % 3);
        wxWaveTimers.push(setTimeout(() => card.classList.add("wx-wave", wave), i * 110));
        wxWaveTimers.push(setTimeout(() => card.classList.remove("wx-wave", wave), i * 110 + 800));
    });
}

// ---- Fetching ----
async function loadWeather(place, silent) {
    const requestId = ++wxRequestId;
    const body = wxEl("weather-body");
    const badge = wxEl("sync-badge");
    if (silent) {
        badge.classList.add("syncing");
        wxEl("sync-text").textContent = "Syncing…";
    } else {
        body.classList.add("is-loading");
        wxSetStatus("Fetching live weather data…", "loading");
    }

    const url = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + place.lat +
        "&longitude=" + place.lon +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m" +
        "&hourly=temperature_2m,weather_code,precipitation_probability" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max" +
        "&timezone=auto&forecast_days=7";

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("The weather service responded with status " + response.status + ".");
        const data = await response.json();
        if (data.error) throw new Error(data.reason || "The weather service returned an error.");
        if (requestId !== wxRequestId) return;

        const previous = wxData && wxSamePlace(wxPlace, place) ? wxData.current : null;
        wxData = data;
        wxPlace = place;
        wxLastUpdate = Date.now();
        wxCountdown = WX_REFRESH_SECONDS;
        renderWeather(previous);
        wxSetStatus("");
        wxColorSweep();
        wxColorWave();
    } catch (err) {
        if (requestId !== wxRequestId) return;
        console.error("Weather error:", err);
        if (!silent) {
            const offline = err instanceof TypeError;
            wxSetStatus(offline ? "Can't reach the weather service. Check your internet connection and try again." : err.message, "error");
        }
    } finally {
        if (requestId === wxRequestId) {
            body.classList.remove("is-loading");
            badge.classList.remove("syncing");
            updateSyncBadge();
        }
    }
}

// One request fetches all four city cards at once
async function loadCityBoard() {
    if (!wxCities.length) return;
    const url = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + wxCities.map(c => c.lat).join(",") +
        "&longitude=" + wxCities.map(c => c.lon).join(",") +
        "&current=temperature_2m,relative_humidity_2m,weather_code,is_day" +
        "&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1";
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("City board request failed (status " + response.status + ").");
        const data = await response.json();
        const list = Array.isArray(data) ? data : [data];
        const previous = wxCityData;
        wxCityData = list.map(d => ({
            temp: d.current.temperature_2m,
            code: d.current.weather_code,
            isDay: d.current.is_day,
            humidity: d.current.relative_humidity_2m,
            max: d.daily.temperature_2m_max[0],
            min: d.daily.temperature_2m_min[0]
        }));
        renderCityBoard(previous);
    } catch (err) {
        console.error("City board error:", err);
    }
}

function refreshWeather() {
    loadWeather(wxPlace, true);
    loadCityBoard();
}

async function searchWeatherCity() {
    const input = wxEl("weather-input");
    const query = input.value.trim();
    if (!query) return;
    wxSetStatus("Searching for \"" + query + "\"…", "loading");

    try {
        const response = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(query) + "&count=1&language=en&format=json");
        if (!response.ok) throw new Error("The city search failed (status " + response.status + ").");
        const data = await response.json();
        if (!data.results || !data.results.length) {
            wxSetStatus("No city found for \"" + query + "\". Try a different spelling.", "error");
            return;
        }
        const r = data.results[0];
        input.value = "";
        loadWeather({ name: r.name, country: r.country || "", lat: r.latitude, lon: r.longitude });
    } catch (err) {
        console.error("City search error:", err);
        wxSetStatus(err instanceof TypeError ? "Can't reach the search service. Check your internet connection." : err.message, "error");
    }
}

function useMyLocation() {
    if (!navigator.geolocation) {
        wxSetStatus("Your browser doesn't support location access.", "error");
        return;
    }
    wxSetStatus("Finding your location…", "loading");
    navigator.geolocation.getCurrentPosition(
        pos => loadWeather({ name: "Your Location", country: "", lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) }),
        () => wxSetStatus("Couldn't get your location. Allow access or search for a city instead.", "error"),
        { timeout: 10000 }
    );
}

function setWeatherUnit(unit) {
    wxUnit = unit;
    wxEl("unit-c").classList.toggle("active", unit === "C");
    wxEl("unit-f").classList.toggle("active", unit === "F");
    if (wxData) renderWxTemps(false);
    if (wxCityData.length) renderCityBoard(null);
}

// ---- Rendering ----
// `previous` is the last reading for the same city (a live refresh); null means a fresh city load
function renderWeather(previous) {
    if (!wxData) return;
    const refresh = !!previous;
    const cur = wxData.current;
    const info = wxDescribe(cur.weather_code, cur.is_day);
    const hero = wxEl("weather-hero");
    const phase = wxSkyPhase();
    hero.dataset.wx = info.theme;
    hero.dataset.sky = phase;

    wxEl("wx-place").textContent = wxPlace.name + (wxPlace.country ? ", " + wxPlace.country : "");
    const dateLabel = new Date(cur.time.slice(0, 10) + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
    wxEl("wx-time").textContent = dateLabel + " • " + cur.time.slice(11, 16) + " local time";
    wxEl("wx-icon").textContent = info.icon;
    wxEl("wx-cond").textContent = info.label;

    const fxKey = info.theme + "|" + phase;
    if (!refresh || fxKey !== wxFxKey) renderWxFx(info.theme, phase);
    wxFxKey = fxKey;

    renderWxSun(refresh);
    renderWxMetrics(refresh);
    renderWxTemps(refresh);
    renderWxDelta(previous);
    updateWxCards();
    updateWxStamp();
}

// Change badge: shows how the temperature moved since the previous sync
function renderWxDelta(previous) {
    const el = wxEl("wx-delta");
    if (!previous) {
        el.className = "tag wx-delta";
        el.textContent = "";
        return;
    }
    const diff = wxDiff(wxData.current.temperature_2m - previous.temperature_2m);
    if (Math.abs(diff) < 0.05) {
        el.className = "tag wx-delta steady";
        el.textContent = "● Steady";
    } else {
        el.className = "tag wx-delta " + (diff > 0 ? "up" : "down");
        el.textContent = (diff > 0 ? "▲ +" : "▼ -") + Math.abs(diff).toFixed(1) + "° since last sync";
    }
}

// Everything that depends on the °C / °F choice
function renderWxTemps(refresh) {
    const cur = wxData.current;
    const daily = wxData.daily;
    wxEl("wx-feels").textContent = "Feels like " + wxT(cur.apparent_temperature) + "°";
    wxEl("wx-hilo").textContent = "H " + wxT(daily.temperature_2m_max[0]) + "° • L " + wxT(daily.temperature_2m_min[0]) + "°";

    const target = wxT(cur.temperature_2m);
    const from = wxShownTemp;
    clearInterval(wxTempTimer);
    wxTempTimer = wxTween(800, p => {
        wxEl("wx-temp").textContent = Math.round(from + (target - from) * p) + "°" + wxUnit;
    }, () => { wxShownTemp = target; });

    const hourlySig = wxUnit + "|" + wxPlace.lat + "|" + wxPlace.lon + "|" + wxHourStart() + "|" + wxData.hourly.temperature_2m.join(",") + "|" + wxData.hourly.weather_code.join(",");
    if (!refresh || hourlySig !== wxHourlySig) {
        wxHourlySig = hourlySig;
        renderWxHourly();
        renderWxChart();
    }
    const dailySig = wxUnit + "|" + wxPlace.lat + "|" + wxPlace.lon + "|" + daily.temperature_2m_max.join(",") + "|" + daily.temperature_2m_min.join(",") + "|" + daily.weather_code.join(",");
    if (!refresh || dailySig !== wxDailySig) {
        wxDailySig = dailySig;
        renderWxDaily();
    }
}

function renderWxFx(theme, phase) {
    let html = "";
    if (theme === "rain" || theme === "storm") {
        for (let i = 0; i < 22; i++) {
            html += '<i class="wx-drop" style="left:' + (Math.random() * 100).toFixed(1) + "%;animation-duration:" + (0.7 + Math.random() * 0.8).toFixed(2) + "s;animation-delay:-" + (Math.random() * 2).toFixed(2) + 's"></i>';
        }
    } else if (theme === "snow") {
        for (let i = 0; i < 18; i++) {
            html += '<i class="wx-flake" style="left:' + (Math.random() * 100).toFixed(1) + "%;animation-duration:" + (4 + Math.random() * 4).toFixed(2) + "s;animation-delay:-" + (Math.random() * 6).toFixed(2) + 's"></i>';
        }
    } else if (phase === "night") {
        for (let i = 0; i < 16; i++) {
            html += '<i class="wx-star" style="left:' + (Math.random() * 100).toFixed(1) + "%;top:" + (Math.random() * 70).toFixed(1) + "%;animation-delay:-" + (Math.random() * 3).toFixed(2) + 's"></i>';
        }
    }
    wxEl("weather-fx").innerHTML = html;
}

function renderWxSun(refresh) {
    const cur = wxData.current;
    const rise = wxData.daily.sunrise[0];
    const set = wxData.daily.sunset[0];
    if (!rise || !set) {
        wxEl("wx-sunrise").textContent = "--:--";
        wxEl("wx-sunset").textContent = "--:--";
        return;
    }
    wxEl("wx-sunrise").textContent = rise.slice(11, 16);
    wxEl("wx-sunset").textContent = set.slice(11, 16);

    const raw = (wxTimeToMinutes(cur.time) - wxTimeToMinutes(rise)) / (wxTimeToMinutes(set) - wxTimeToMinutes(rise));
    const fraction = Math.min(Math.max(raw, 0), 1);
    const from = refresh ? wxSunFraction : 0;
    wxSunFraction = fraction;
    const dot = wxEl("sun-dot");
    const progress = wxEl("sun-progress");
    dot.classList.toggle("night", raw < 0 || raw > 1);

    clearInterval(wxSunTimer);
    wxSunTimer = wxTween(refresh ? 600 : 1200, p => {
        const v = from + (fraction - from) * p;
        const angle = Math.PI * (1 - v);
        dot.setAttribute("cx", (130 + 110 * Math.cos(angle)).toFixed(1));
        dot.setAttribute("cy", (130 - 110 * Math.sin(angle)).toFixed(1));
        progress.style.strokeDashoffset = (100 - v * 100).toFixed(1);
    });
}

function wxSetMetric(key, value, percent, note, refresh) {
    const valueEl = wxEl("m-" + key);
    const changed = refresh && valueEl.textContent !== value;
    valueEl.textContent = value;
    wxEl("m-" + key + "-note").textContent = note;

    const bar = wxEl("m-" + key + "-bar");
    const width = Math.min(Math.max(percent, 0), 100) + "%";
    if (refresh) {
        bar.style.width = width;
    } else {
        bar.style.width = "0%";
        setTimeout(() => { bar.style.width = width; }, 80);
    }
    if (changed) {
        valueEl.classList.add("flash");
        setTimeout(() => valueEl.classList.remove("flash"), 1300);
    }
}

function renderWxMetrics(refresh) {
    const c = wxData.current;
    const d = wxData.daily;
    const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const direction = compass[Math.round(c.wind_direction_10m / 45) % 8];
    const humidity = c.relative_humidity_2m;
    const pressure = c.pressure_msl;
    const uv = d.uv_index_max && d.uv_index_max[0] != null ? d.uv_index_max[0] : 0;
    const rain = d.precipitation_probability_max && d.precipitation_probability_max[0] != null ? d.precipitation_probability_max[0] : 0;
    const uvLabel = uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very high" : "Extreme";

    wxSetMetric("humidity", humidity + "%", humidity, humidity < 30 ? "Dry air" : humidity < 60 ? "Comfortable" : "Humid", refresh);
    wxSetMetric("wind", Math.round(c.wind_speed_10m) + " km/h", c.wind_speed_10m / 60 * 100, "From the " + direction, refresh);
    wxSetMetric("pressure", Math.round(pressure) + " hPa", (pressure - 980) / 70 * 100, pressure < 1009 ? "Low pressure" : pressure > 1022 ? "High pressure" : "Normal range", refresh);
    wxSetMetric("uv", uv.toFixed(1), uv / 11 * 100, uvLabel + " today", refresh);
    wxSetMetric("cloud", c.cloud_cover + "%", c.cloud_cover, c.cloud_cover < 20 ? "Clear skies" : c.cloud_cover < 60 ? "Partly cloudy" : "Mostly cloudy", refresh);
    wxSetMetric("rain", rain + "%", rain, c.precipitation > 0 ? c.precipitation + " mm falling now" : "No rain right now", refresh);
}

function renderWxHourly() {
    const h = wxData.hourly;
    const daily = wxData.daily;
    const start = wxHourStart();
    let html = "";
    for (let i = 0; i < 24 && start + i < h.time.length; i++) {
        const t = h.time[start + i];
        const dIndex = daily.time.indexOf(t.slice(0, 10));
        let isDay = 1;
        if (dIndex >= 0 && daily.sunrise[dIndex] && daily.sunset[dIndex]) {
            isDay = t >= daily.sunrise[dIndex] && t < daily.sunset[dIndex] ? 1 : 0;
        }
        const info = wxDescribe(h.weather_code[start + i], isDay);
        const chance = h.precipitation_probability ? h.precipitation_probability[start + i] : 0;
        html += '<div class="hour-card' + (i === 0 ? " now" : "") + '" style="animation-delay:' + (i * 35) + 'ms">' +
            '<div class="hour-time">' + (i === 0 ? "Now" : t.slice(11, 16)) + "</div>" +
            '<div class="hour-icon">' + info.icon + "</div>" +
            '<div class="hour-temp">' + wxT(h.temperature_2m[start + i]) + "°</div>" +
            '<div class="hour-rain">' + (chance >= 10 ? "💧" + chance + "%" : "") + "</div></div>";
    }
    wxEl("hourly-strip").innerHTML = html;
}

function renderWxChart() {
    const h = wxData.hourly;
    const start = wxHourStart();
    const pts = [];
    for (let i = 0; i < 24 && start + i < h.time.length; i++) {
        pts.push({ label: i === 0 ? "Now" : h.time[start + i].slice(11, 16), v: wxT(h.temperature_2m[start + i]) });
    }
    if (pts.length < 3) return;

    const W = 600, H = 240, L = 38, R = 16, T = 34, B = 36;
    const vals = pts.map(p => p.v);
    let min = Math.min.apply(null, vals);
    let max = Math.max.apply(null, vals);
    if (max - min < 4) { max += 2; min -= 2; }
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;

    const x = i => L + i * (W - L - R) / (pts.length - 1);
    const y = v => T + (max - v) / (max - min) * (H - T - B);
    const c = pts.map((p, i) => [x(i), y(p.v)]);
    const f = n => n.toFixed(1);

    let line = "M" + f(c[0][0]) + " " + f(c[0][1]);
    for (let i = 1; i < c.length - 1; i++) {
        const mx = (c[i][0] + c[i + 1][0]) / 2;
        const my = (c[i][1] + c[i + 1][1]) / 2;
        line += " Q" + f(c[i][0]) + " " + f(c[i][1]) + " " + f(mx) + " " + f(my);
    }
    const last = c[c.length - 1];
    line += " L" + f(last[0]) + " " + f(last[1]);
    const area = line + " L" + f(last[0]) + " " + (H - B) + " L" + f(c[0][0]) + " " + (H - B) + " Z";

    let svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Hourly temperature trend for the next 24 hours">' +
        '<defs><linearGradient id="wxArea" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" style="stop-color: var(--electric-blue); stop-opacity: 0.35"></stop>' +
        '<stop offset="100%" style="stop-color: var(--electric-blue); stop-opacity: 0"></stop></linearGradient></defs>';

    for (let k = 0; k <= 3; k++) {
        const v = max - k * (max - min) / 3;
        svg += '<line class="chart-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + f(y(v)) + '" y2="' + f(y(v)) + '"></line>' +
            '<text class="chart-axis" text-anchor="end" x="' + (L - 8) + '" y="' + f(y(v) + 4) + '">' + Math.round(v) + "°</text>";
    }

    svg += '<path class="chart-area" d="' + area + '" fill="url(#wxArea)"></path>' +
        '<path class="chart-line" pathLength="1" d="' + line + '"></path>' +
        '<circle class="chart-ring" cx="' + f(c[0][0]) + '" cy="' + f(c[0][1]) + '" r="6"></circle>';

    pts.forEach((p, i) => {
        if (i % 4 !== 0) return;
        svg += '<circle class="chart-dot" cx="' + f(c[i][0]) + '" cy="' + f(c[i][1]) + '" r="4.5"><title>' + p.label + " • " + p.v + "°" + wxUnit + "</title></circle>" +
            '<text class="chart-val" x="' + f(c[i][0]) + '" y="' + f(c[i][1] - 12) + '">' + p.v + "°</text>" +
            '<text class="chart-axis" text-anchor="middle" x="' + f(c[i][0]) + '" y="' + (H - 12) + '">' + p.label + "</text>";
    });

    wxEl("wx-chart").innerHTML = svg + "</svg>";
}

function renderWxDaily() {
    const d = wxData.daily;
    const mins = d.temperature_2m_min.map(wxT);
    const maxs = d.temperature_2m_max.map(wxT);
    const lo = Math.min.apply(null, mins);
    const hi = Math.max.apply(null, maxs);
    const span = Math.max(hi - lo, 1);
    let html = "";

    d.time.forEach((date, i) => {
        const info = wxDescribe(d.weather_code[i], 1);
        const name = i === 0 ? "Today" : new Date(date + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        const width = Math.max((maxs[i] - mins[i]) / span * 100, 6);
        const left = Math.min((mins[i] - lo) / span * 100, 100 - width);
        const rain = d.precipitation_probability_max ? d.precipitation_probability_max[i] : null;
        const tip = info.label + (rain !== null ? " • " + rain + "% chance of rain" : "");
        html += '<div class="daily-row" style="animation-delay:' + (i * 70) + 'ms" title="' + tip + '">' +
            '<span class="d-day">' + name + "</span>" +
            '<span class="d-icon">' + info.icon + "</span>" +
            '<span class="d-lo">' + mins[i] + "°</span>" +
            '<div class="d-range"><span style="left:' + left.toFixed(1) + "%;width:" + width.toFixed(1) + '%"></span></div>' +
            '<span class="d-hi">' + maxs[i] + "°</span></div>";
    });
    wxEl("daily-list").innerHTML = html;
}

// ---- City board (Islamabad, Lahore, Faisalabad, Karachi) ----
function initCityBoard() {
    wxCities = Array.from(document.querySelectorAll("#city-board .city-card")).map(el => ({
        el: el,
        name: el.dataset.name,
        country: el.dataset.country,
        lat: parseFloat(el.dataset.lat),
        lon: parseFloat(el.dataset.lon)
    }));
    wxEl("city-board").addEventListener("click", e => {
        const card = e.target.closest(".city-card");
        if (!card) return;
        const city = wxCities.find(c => c.el === card);
        if (city) loadWeather({ name: city.name, country: city.country, lat: city.lat, lon: city.lon });
    });
}

function renderCityBoard(previous) {
    wxCities.forEach((city, i) => {
        const d = wxCityData[i];
        if (!d) return;
        const q = sel => city.el.querySelector(sel);
        const info = wxDescribe(d.code, d.isDay);
        const tempEl = q(".city-temp");
        const deltaEl = q(".city-delta");
        const before = previous && previous[i] ? previous[i] : null;

        const text = wxT(d.temp) + "°" + wxUnit;
        const changed = before && tempEl.textContent !== "--°" && wxT(before.temp) !== wxT(d.temp);
        tempEl.textContent = text;
        q(".city-icon").textContent = info.icon;
        q(".city-cond").textContent = info.label;
        q(".city-hum").textContent = "💧 " + d.humidity + "%";
        q(".city-hilo").textContent = "H " + wxT(d.max) + "° L " + wxT(d.min) + "°";

        if (before && Math.abs(d.temp - before.temp) >= 0.05) {
            const diff = wxDiff(d.temp - before.temp);
            deltaEl.className = "city-delta " + (diff > 0 ? "up" : "down");
            deltaEl.textContent = (diff > 0 ? "▲ +" : "▼ -") + Math.abs(diff).toFixed(1);
        } else {
            deltaEl.className = "city-delta";
            deltaEl.textContent = "";
        }
        if (changed) {
            tempEl.classList.add("flash");
            setTimeout(() => tempEl.classList.remove("flash"), 1300);
        }
    });
}

function updateWxCards() {
    wxCities.forEach(city => {
        city.el.classList.toggle("active", wxSamePlace(city, wxPlace));
    });
}

// ---- Live sync clock ----
function updateWxStamp() {
    const el = wxEl("wx-updated");
    if (!wxLastUpdate) {
        el.textContent = "Waiting for data";
        return;
    }
    const secs = Math.floor((Date.now() - wxLastUpdate) / 1000);
    el.textContent = secs < 5 ? "Synced just now" : secs < 60 ? "Synced " + secs + "s ago" : "Synced " + Math.floor(secs / 60) + " min ago";
}

function updateSyncBadge() {
    const ring = wxEl("sync-ring");
    const text = wxEl("sync-text");
    if (!ring || !text) return;
    ring.style.strokeDashoffset = (100 * (1 - wxCountdown / WX_REFRESH_SECONDS)).toFixed(1);
    if (!wxEl("sync-badge").classList.contains("syncing")) text.textContent = "Next sync " + wxCountdown + "s";
}

// Runs every second (setInterval): counts down to the next live sync, only while the Weather tab is open
function wxTick() {
    updateWxStamp();
    if (!wxEl("weather").classList.contains("active") || document.hidden) return;
    wxCountdown--;
    if (wxCountdown <= 0) {
        wxCountdown = WX_REFRESH_SECONDS;
        refreshWeather();
    }
    updateSyncBadge();
}

// Called whenever the Weather tab opens: loads once, then keeps itself fresh
function startWeatherPage() {
    if (wxStarted) {
        if (Date.now() - wxLastUpdate > WX_REFRESH_MS) {
            wxCountdown = WX_REFRESH_SECONDS;
            refreshWeather();
        }
        wxColorWave();
        return;
    }
    wxStarted = true;
    initCityBoard();
    loadWeather(wxPlace);
    loadCityBoard();
    setInterval(wxTick, 1000);
}