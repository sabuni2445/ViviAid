/**
 * ViviAid Buddy AI - Live Concept Prototype
 * A high-performance, edge-AI vision system for mobile browser testing.
 */

let model;
let videoElement;
let canvasElement;
let ctx;
let isDetecting = false;
let lastSpoken = "";
let lastSpokenTime = 0;

// Amharic Vocabulary Mapping
const AMHARIC_MAP = {
    "person": "ሰው (Sew)",
    "bicycle": "ቢስክሌት (Bisklete)",
    "car": "መኪና (Mekina)",
    "motorcycle": "ሞተር (Motor)",
    "airplane": "አውሮፕላን (Airplane)",
    "bus": "አውቶቡስ (Autobus)",
    "train": "ባቡር (Babur)",
    "truck": "ትልቅ መኪና (Truck)",
    "boat": "ጀልባ (Jelba)",
    "traffic light": "የትራፊክ መብራት (Mebirat)",
    "stop sign": "የቁም ምልክት (Stop Sign)",
    "bench": "ወንበር (Bench)",
    "bird": "ወፍ (Wof)",
    "cat": "ድመት (Dimet)",
    "dog": "ውሻ (Wusha)",
    "horse": "ፈረስ (Feres)",
    "sheep": "በግ (Beg)",
    "cow": "ላም (Lam)",
    "backpack": "ቦርሳ (Backpack)",
    "umbrella": "ጃንጥላ (Jantila)",
    "handbag": "ቦርሳ (Handbag)",
    "suitcase": "ሻንጣ (Shanta)",
    "bottle": "ጠርሙስ (Bottle)",
    "cup": "ብርጭቆ (Cup)",
    "fork": "ሹካ (Shuka)",
    "knife": "ቢላዋ (Knife)",
    "spoon": "ማንኪያ (Mankia)",
    "bowl": "ሰህን (Bowl)",
    "banana": "ሙዝ (Muz)",
    "apple": "ፖም (Pom)",
    "orange": "ብርቱካን (Orange)",
    "chair": "ወንበር (Chair)",
    "couch": "ሶፋ (Couch)",
    "potted plant": "ተክል (Plant)",
    "bed": "አልጋ (Bed)",
    "dining table": "ጠረጴዛ (Table)",
    "toilet": "ሸንት ቤት (Toilet)",
    "tv": "ቲቪ (TV)",
    "laptop": "ላፕቶፕ (Laptop)",
    "mouse": "ማውዝ (Mouse)",
    "remote": "ሪሞት (Remote)",
    "keyboard": "ኪቦርድ (Keyboard)",
    "cell phone": "ስልክ (Phone)",
    "book": "መጽሐፍ (Metsehaf)",
    "clock": "ሰዓት (Time)",
    "scissors": "መቀስ (Scissors)",
    "teddy bear": "ድብ (Bear)",
    "toothbrush": "የጥርስ ብሩሽ (Brush)"
};

async function init() {
    videoElement = document.getElementById('video');
    canvasElement = document.getElementById('canvas');
    ctx = canvasElement.getContext('2d');

    try {
        console.log("Waiting for TensorFlow...");
        await tf.ready();

        console.log("Loading COCO-SSD Model (this may take 10-20 seconds)...");
        model = await cocoSsd.load({
            base: 'mobilenet_v2' // Lighter and faster for mobile
        });

        // Update Status to Ready
        const status = document.getElementById('model-status');
        if (status) {
            status.querySelector('span').innerText = "BUDDY: READY";
            status.querySelector('.pulse').style.background = "var(--accent)";
            status.querySelector('.pulse').style.boxShadow = "0 0 10px var(--accent)";
        }

        document.getElementById('loader').style.display = 'none';
        console.log("Buddy AI Architecture Successfully Loaded.");
    } catch (e) {
        showError("AI Init Failed: " + e.message);
        console.error("DEBUG:", e);
    }
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
        videoElement.srcObject = stream;

        // Auto-scale canvas to video size
        videoElement.onloadedmetadata = () => {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        };

        return true;
    } catch (e) {
        showError("Camera Access Denied. Buddy cannot see.");
        return false;
    }
}

async function toggleAI() {
    const btn = document.getElementById('btn-action');

    if (!isDetecting) {
        const success = await startCamera();
        if (success) {
            isDetecting = true;
            btn.innerText = "PAUSE BUDDY";
            btn.style.background = "#ff4d4d";
            document.getElementById('info-box').style.display = 'block';
            speak("Welcome. Buddy AI is active.");
            detectFrame();
        }
    } else {
        isDetecting = false;
        btn.innerText = "START BUDDY AI";
        btn.style.background = "linear-gradient(135deg, var(--accent), var(--accent-purple))";

        // Stop camera stream
        const stream = videoElement.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
}

async function detectFrame() {
    if (!isDetecting) return;

    const predictions = await model.detect(videoElement);

    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (predictions.length === 0) {
        document.getElementById('obj-en').innerText = "Scanning...";
        document.getElementById('obj-am').innerText = "በመፈለግ ላይ...";
    }

    // Filter predictions (Confidence > 45% for better discovery)
    const validPredictions = predictions.filter(p => p.score > 0.45);

    if (validPredictions.length > 0) {
        // Get the most dominant object
        const top = validPredictions[0];
        updateUI(top.class);

        // Logic to speak about the object
        processSpeech(top.class);

        // Draw HUD boxes
        validPredictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
            ctx.fillRect(x, y, width, height);

            ctx.fillStyle = '#00e5ff';
            ctx.font = '20px Outfit';
            ctx.fillText(prediction.class, x, y > 10 ? y - 10 : 10);
        });
    }

    requestAnimationFrame(detectFrame);
}

function updateUI(className) {
    const amharic = AMHARIC_MAP[className] || className;
    document.getElementById('obj-en').innerText = className.charAt(0).toUpperCase() + className.slice(1);
    document.getElementById('obj-am').innerText = amharic;
}

function processSpeech(className) {
    const now = Date.now();

    // Only speak every 4 seconds for the SAME object, or instantly for a NEW object
    if (className !== lastSpoken || (now - lastSpokenTime > 4000)) {
        const amWord = AMHARIC_MAP[className] ? AMHARIC_MAP[className].split(" ")[0] : className;
        speak(amWord);
        lastSpoken = className;
        lastSpokenTime = now;
    }
}

function speak(text) {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);

    // Try to find an Amharic voice or fallback
    const voices = window.speechSynthesis.getVoices();
    const amharicVoice = voices.find(v => v.lang.startsWith('am'));
    if (amharicVoice) utterance.voice = amharicVoice;

    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    window.speechSynthesis.cancel(); // Stop current speech
    window.speechSynthesis.speak(utterance);
}

function showError(msg) {
    const err = document.getElementById('error-msg');
    err.style.display = 'block';
    err.innerText = msg;
}

// Initialise on load
window.onload = init;
document.addEventListener('speechSynthesisVoicesChanged', () => {
    // Some browsers need this to populate voices
});
