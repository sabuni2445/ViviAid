/**
 * ViviAid Buddy AI - Live Concept Prototype
 * Bulletproof Mobile Version
 */

let model;
let videoElement;
let canvasElement;
let ctx;
let isDetecting = false;
let lastSpoken = "";
let lastSpokenTime = 0;

const AMHARIC_MAP = {
    "person": "ሰው (Sew)",
    "bicycle": "ቢስክሌት (Bisklete)",
    "car": "መኪና (Mekina)",
    "motorcycle": "ባጃጅ/ሞተር (Bajaj)",
    "bus": "አውቶቡስ (Autobus)",
    "truck": "ትልቅ መኪና (Truck)",
    "stop sign": "የቁም ምልክት (Stop)",
    "bird": "ወፍ (Wof)",
    "cat": "ድመት (Dimet)",
    "dog": "ውሻ (Wusha)",
    "bottle": "ጠርሙስ (Bottle)",
    "cup": "ብርጭቆ (Cup)",
    "chair": "ወንበር (Chair)",
    "couch": "ሶፋ (Couch)",
    "bed": "አልጋ (Bed)",
    "laptop": "ላፕቶፕ (Laptop)",
    "cell phone": "ስልክ (Phone)",
    "book": "መጽሐፍ (Book)",
    "remote": "ሪሞት (Remote)",
    "scissors": "መቀስ (Scissors)",
    "backpack": "ቦርሳ (Backpack)"
};

const SPATIAL_AM = {
    "left": "በግራ (Gera)",
    "right": "በቀኝ (Qegn)",
    "center": "ፊት ለፊት (Fit-lefit)",
    "close": "አጠገብ (Ategeb)",
    "far": "ሩቅ (Ruq)"
};

async function init() {
    console.log("Buddy: Initializing...");

    // UI Elements
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');
    if (canvasElement) ctx = canvasElement.getContext('2d');

    const loaderText = document.querySelector('.loading-text');

    try {
        if (typeof tf === 'undefined' || typeof cocoSsd === 'undefined') {
            throw new Error("AI Libraries failed to load. Check Internet.");
        }

        if (loaderText) loaderText.innerText = "Powering up WebGL/GPU...";
        try {
            await tf.setBackend('webgl');
            await tf.ready();
        } catch (webglErr) {
            console.warn("WebGL failed, falling back to CPU.");
            await tf.setBackend('cpu');
        }

        if (loaderText) loaderText.innerText = "Downloading Brain (20MB)...";
        model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });

        // Update Status to Ready
        const status = document.getElementById('model-status');
        if (status) {
            status.querySelector('span').innerText = "BUDDY: READY";
            status.querySelector('.pulse').style.background = "#00e5ff";
        }

        document.getElementById('loader').style.display = 'none';
        console.log("Buddy: Ready.");
    } catch (e) {
        console.error("Buddy Error:", e);
        showError("Buddy Init Failed: " + e.message);
    }
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        videoElement.srcObject = stream;

        videoElement.onloadedmetadata = () => {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        };
        return true;
    } catch (e) {
        showError("Camera Error: " + e.message);
        return false;
    }
}

async function toggleAI() {
    if (!model) {
        alert("Buddy is still loading. Please wait.");
        return;
    }

    const btn = document.getElementById('btn-action');
    if (!isDetecting) {
        const success = await startCamera();
        if (success) {
            isDetecting = true;
            btn.innerText = "STOP BUDDY";
            btn.style.background = "#ff4d4d";
            document.getElementById('info-box').style.display = 'block';
            speak("Buddy active.");
            detectFrame();
        }
    } else {
        isDetecting = false;
        btn.innerText = "START BUDDY AI";
        btn.style.background = "linear-gradient(135deg, #00e5ff, #7000ff)";
        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(t => t.stop());
        }
    }
}

async function detectFrame() {
    if (!isDetecting || !model) return;

    try {
        // Check if video is actually giving frames
        if (videoElement.readyState < 2) {
            requestAnimationFrame(detectFrame);
            return;
        }

        const predictions = await model.detect(videoElement);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Flash the pulse dot to show AI is alive
        const pulse = document.querySelector('.pulse');
        if (pulse) {
            pulse.style.opacity = (pulse.style.opacity === "0.5") ? "1" : "0.5";
        }

        if (predictions.length === 0) {
            document.getElementById('obj-en').innerText = "Scanning Area...";
        } else {
            // Filter and find the most relevant object
            const top = predictions.filter(p => p.score > 0.3)[0];
            if (top) {
                const [x, y, w, h] = top.bbox;

                // Determine Direction (Split Screen into 3)
                const centerX = x + (w / 2);
                const viewWidth = canvasElement.width;
                let dir = "center";
                if (centerX < viewWidth * 0.35) dir = "left";
                else if (centerX > viewWidth * 0.65) dir = "right";

                // Determine Proximity (Based on height ratio)
                const hRatio = h / canvasElement.height;
                let prox = "medium";
                if (hRatio > 0.6) prox = "close";
                else if (hRatio < 0.25) prox = "far";

                updateUI(top.class, dir, prox);
                processSpeech(top.class, dir, prox);

                // Draw Box (Color coded for proximity)
                ctx.strokeStyle = (prox === "close") ? "#ff4d4d" : '#00e5ff';
                ctx.lineWidth = (prox === "close") ? 10 : 4;
                ctx.strokeRect(x, y, w, h);
            }
        }
    } catch (e) {
        console.error("Detection Error:", e);
    }

    requestAnimationFrame(detectFrame);
}

function updateUI(cls, dir, prox) {
    const amCls = AMHARIC_MAP[cls] ? AMHARIC_MAP[cls].split(" (")[0] : cls;
    const amDir = SPATIAL_AM[dir].split(" (")[0];
    const amProx = (prox !== "medium") ? SPATIAL_AM[prox].split(" (")[0] : "";

    document.getElementById('obj-en').innerText = `${cls.toUpperCase()} | ${dir.toUpperCase()} | ${prox.toUpperCase()}`;
    document.getElementById('obj-am').innerText = `${amCls} ${amDir} ${amProx}`;
}

function processSpeech(cls, dir, prox) {
    const now = Date.now();
    const stateId = `${cls}-${dir}-${prox}`;

    // Speak if object changed OR every 6 seconds if same object stays
    if (stateId !== lastSpoken || (now - lastSpokenTime > 6000)) {
        const amWord = AMHARIC_MAP[cls] ? AMHARIC_MAP[cls].split(" ")[0] : cls;
        const amDir = SPATIAL_AM[dir].split(" ")[0];
        const amProx = (prox !== "medium") ? SPATIAL_AM[prox].split(" ")[0] : "";

        const phrase = `${amWord} ${amDir} ${amProx}`;
        speak(phrase);
        lastSpoken = stateId;
        lastSpokenTime = now;
    }
}

function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

function showError(msg) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
    const err = document.getElementById('error-msg');
    if (err) {
        err.style.display = 'block';
        err.innerText = msg;
    } else {
        alert(msg);
    }
}

window.addEventListener('load', init);
