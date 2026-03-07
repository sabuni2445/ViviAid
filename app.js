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
    "motorcycle": "ሞተር (Motor)",
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
    "book": "መጽሐፍ (Book)"
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

        if (loaderText) loaderText.innerText = "Configuring Brain (CPU)...";
        await tf.setBackend('cpu');
        await tf.ready();

        if (loaderText) loaderText.innerText = "Downloading AI Model (20MB)...";
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
        const predictions = await model.detect(videoElement);
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (predictions.length === 0) {
            document.getElementById('obj-en').innerText = "Scanning...";
            document.getElementById('obj-am').innerText = "በመፈለግ ላይ...";
        } else {
            const top = predictions.filter(p => p.score > 0.4)[0];
            if (top) {
                updateUI(top.class);
                processSpeech(top.class);

                // Draw Box
                const [x, y, w, h] = top.bbox;
                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, w, h);
            }
        }
    } catch (e) {
        console.error("Detection Error:", e);
    }

    requestAnimationFrame(detectFrame);
}

function updateUI(cls) {
    document.getElementById('obj-en').innerText = cls.toUpperCase();
    document.getElementById('obj-am').innerText = AMHARIC_MAP[cls] || cls;
}

function processSpeech(cls) {
    const now = Date.now();
    if (cls !== lastSpoken || (now - lastSpokenTime > 5000)) {
        speak(AMHARIC_MAP[cls] ? AMHARIC_MAP[cls].split(" ")[0] : cls);
        lastSpoken = cls;
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
