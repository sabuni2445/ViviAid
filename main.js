const featureDialogues = {
    navigation: {
        park: {
            user: "Hey Buddy, I need to get to the Central Park.",
            ai: "Of course! I've mapped out the quickest pedestrian route. Turn left in 10 meters, and I'll keep you updated."
        },
        home: {
            user: "Buddy, take me home.",
            ai: "Plotting the route home. It looks like it will take about 20 minutes to walk. Head straight ahead."
        }
    },
    perception: {
        surroundings: {
            user: "Buddy, describe what's around me right now.",
            ai: "You're in a vibrant open space. To your right, there's a group of children playing near a fountain. Several birds are resting on the trees ahead.",
            ambientSounds: [
                "https://www.soundjay.com/nature/sounds/birds-chirping-01.mp3",
                "https://www.soundjay.com/human/sounds/children-playing-1.mp3"
            ]
        },
        read_sign: {
            user: "What does that sign ahead say?",
            ai: "The sign says 'Caution: Wet Floor'. Please be careful walking forward!"
        }
    },
    music: {
        lofi: {
            user: "Hey Buddy, play some relaxing lo-fi music.",
            ai: "Great choice! I'm starting your 'Sunset Lo-fi' playlist now. Enjoy the vibes!"
        },
        workout: {
            user: "Buddy, play my intense work-out playlist.",
            ai: "You got it! Pumping up the 'Beast Mode' playlist. Let's get moving!"
        }
    },
    rideshare: {
        uber: {
            user: "Hey Buddy, can you call an Uber?",
            ai: "I've got you. A silver Tesla will be here in 4 minutes. I've sent your destination to the driver."
        },
        status: {
            user: "How far away is my ride?",
            ai: "Your driver is just pulling around the corner now, they are about 30 seconds away."
        }
    },
    recognition: {
        who: {
            user: "Buddy, who is this walking towards me?",
            ai: "That's Jimmy! He's wearing a blue jacket and laughing. He looks very happy to see you. Should I help you greet him?"
        },
        crowd: {
            user: "Is there anyone I know sitting here?",
            ai: "Scanning... Yes, Sarah from your book club is sitting right at a table to your left. She's blushing and smiling brightly at someone across from her."
        },
        mood: {
            user: "Hey Buddy, how is Jimmy looking right now?",
            ai: "Jimmy's expression just dropped. He looks quite sad and seems to be looking down at his phone. Give him a moment."
        }
    },
    reading: {
        menu: {
            user: "Buddy, can you read the specials on this menu?",
            ai: "Sure! Today's specials are: Roasted Vegetable Panini, Homemade Tomato Soup, and a Fresh Berry Tart."
        },
        book: {
            user: "Read the first page of this book.",
            ai: "Chapter 1. It was the best of times, it was the worst of times, it was the age of wisdom..."
        }
    },
    currency: {
        check: {
            user: "Buddy, check this note for me.",
            ai: "Analyzing... This is a 200 Ethiopian Birr note. It looks authentic and is in good condition."
        },
        fraud: {
            user: "Is this money real? Something feels off.",
            ai: "Caution! I'm detecting inconsistencies in the security thread and watermark of this note. This may be a counterfeit 100 Birr bill. Please do not accept it."
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const userSpeech = document.querySelector('#user-speech-bubble .message-text');
    const aiSpeech = document.querySelector('#ai-speech-bubble .message-text');
    const cards = document.querySelectorAll('.feature-card');

    let availableVoices = [];
    const initVoices = () => {
        availableVoices = window.speechSynthesis.getVoices();
    };
    if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = initVoices;
        initVoices();
    }

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-command')) return;

            const isExpanded = card.classList.contains('expanded');
            cards.forEach(c => c.classList.remove('expanded'));
            if (!isExpanded) card.classList.add('expanded');
        });
    });

    window.simulateVoice = function (featureKey, optionKey) {
        const dialog = featureDialogues[featureKey]?.[optionKey];
        if (!dialog) return;

        // Immersive Soundscape Logic
        if (dialog.ambientSounds) {
            dialog.ambientSounds.forEach((url, index) => {
                const audio = new Audio(url);
                audio.crossOrigin = "anonymous";
                audio.volume = 0;
                audio.play()
                    .then(() => console.log("Ambient Audio Success: " + url))
                    .catch(e => {
                        console.log("Ambient Audio Blocked/Failed: " + url, e);
                    });

                // Fade in
                let vol = 0;
                const fadeIn = setInterval(() => {
                    if (vol < 0.6) { // Louder for testing
                        vol += 0.05;
                        audio.volume = vol;
                    } else {
                        clearInterval(fadeIn);
                    }
                }, 100);

                // Fade out after dialogue + some padding
                setTimeout(() => {
                    const fadeOut = setInterval(() => {
                        if (audio.volume > 0.01) {
                            audio.volume -= 0.01;
                        } else {
                            audio.pause();
                            clearInterval(fadeOut);
                        }
                    }, 100);
                }, 10000 + (index * 500)); // Staggered stop
            });
        }

        document.querySelector('#demo').scrollIntoView({ behavior: 'smooth' });

        userSpeech.parentElement.style.opacity = '1';
        userSpeech.innerText = "...";
        aiSpeech.innerText = "...";

        setTimeout(() => {
            typeEffect(userSpeech, dialog.user, 30, () => {
                setTimeout(() => {
                    typeEffect(aiSpeech, dialog.ai, 40, null, 'ai');
                }, 800);
            }, 'user');
        }, 500);
    };

    function typeEffect(element, text, speed, callback, speakerRole = 'ai') {
        element.innerText = "";
        let i = 0;
        let speechActive = false;

        if (window.speechSynthesis && availableVoices.length > 0) {
            speechActive = true;
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 1.0;

            if (speakerRole === 'ai') {
                utterance.rate = 1.05;
                utterance.pitch = 1.1; // More calm and professional
                let voice = availableVoices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && (v.name.includes('Female') || v.name.includes('Zira')));
                if (!voice) voice = availableVoices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
                if (voice) utterance.voice = voice;
            } else if (speakerRole === 'user') {
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                let voice = availableVoices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && (v.name.includes('Male') || v.name.includes('David')));
                if (!voice) voice = availableVoices.find(v => v.name.includes('Male') || v.name.includes('Alex') || v.name.includes('Daniel'));
                if (voice) utterance.voice = voice;
            }

            if (callback) {
                // Trigger AI response only when the user finishes speaking
                utterance.onend = () => callback();
                utterance.onerror = () => callback();
            }

            window.speechSynthesis.speak(utterance);
        }

        function type() {
            if (i < text.length) {
                element.innerText += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (!speechActive && callback) {
                callback();
            }
        }
        type();
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .hardware-container, .demo-interface').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = '0.8s ease-out';
        observer.observe(el);
    });

    window.startProactiveDemo = function () {
        const btn = document.getElementById('btn-proactive-play');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';

        const subtitleBox = document.getElementById('proactive-subtitle');
        const subtitleText = subtitleBox.querySelector('.subtitle-text');
        const logsBox = document.getElementById('proactive-logs');

        subtitleBox.classList.remove('visible');
        logsBox.innerHTML = '<div class="log-item header-log">Navigation initialized... beginning guidance.</div>';

        // Background Ambience for Proactive Demo
        const ambientAudio = new Audio("https://www.soundjay.com/nature/sounds/birds-chirping-01.mp3");
        ambientAudio.crossOrigin = "anonymous";
        ambientAudio.loop = true;
        ambientAudio.volume = 0;
        ambientAudio.play()
            .then(() => console.log("Proactive Ambience Started"))
            .catch(e => console.log("Proactive Ambience Failed", e));

        let ambVol = 0;
        const fadeInAmb = setInterval(() => {
            if (ambVol < 0.6) {
                ambVol += 0.05;
                ambientAudio.volume = ambVol;
            } else {
                clearInterval(fadeInAmb);
            }
        }, 100);

        const sequence = [
            { text: "Navigation active. Proceed forward on 5th Avenue.", delay: 1000, type: "info" },
            { text: "Caution: there is a pothole on the sidewalk 3 steps ahead. Stay right.", delay: 4000, type: "alert" },
            { text: "Approaching intersection. Stop, the traffic light is currently red. A car is passing.", delay: 5000, type: "alert" },
            { text: "Traffic light is green. The crosswalk is clear. Safe to cross.", delay: 6000, type: "success" },
            { text: "Turn right after crossing to reach your destination.", delay: 4500, type: "info" }
        ];

        let totalDelay = 0;

        const speakProactive = (text) => {
            if (window.speechSynthesis && availableVoices.length > 0) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 1.05;
                utterance.pitch = 1.1; // Calmed to 1.1
                let voice = availableVoices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && (v.name.includes('Female') || v.name.includes('Zira')));
                if (!voice) voice = availableVoices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
                if (voice) utterance.voice = voice;
                window.speechSynthesis.speak(utterance);
            }
        };

        sequence.forEach((item, index) => {
            totalDelay += item.delay;

            setTimeout(() => {
                // Update subtitle class for color and borders
                subtitleText.className = `subtitle-text ${item.type}`;
                if (item.type === 'alert') subtitleBox.className = 'ai-subtitle-box visible alert-border';
                else if (item.type === 'success') subtitleBox.className = 'ai-subtitle-box visible success-border';
                else subtitleBox.className = 'ai-subtitle-box visible';

                subtitleText.innerText = `Buddy: "${item.text}"`;

                // Add log
                const log = document.createElement('div');
                log.className = `log-item`;
                let logColor = item.type === 'alert' ? '#f87171' : item.type === 'success' ? '#34d399' : 'var(--text-primary)';
                log.innerHTML = `<span style="color: ${logColor}">${item.text}</span>`;
                logsBox.appendChild(log);
                logsBox.scrollTop = logsBox.scrollHeight;

                speakProactive(item.text);

                // Hide subtitle after a bit if not the last one
                if (index < sequence.length - 1) {
                    setTimeout(() => {
                        subtitleBox.classList.remove('visible');
                    }, sequence[index + 1].delay - 500);
                } else {
                    setTimeout(() => {
                        subtitleBox.classList.remove('visible');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-play"></i> Restart Simulation';

                        const endLog = document.createElement('div');
                        endLog.className = `log-item`;
                        endLog.innerHTML = `<span style="color: var(--text-secondary)">Simulation complete.</span>`;
                        logsBox.appendChild(endLog);
                        logsBox.scrollTop = logsBox.scrollHeight;

                        // Fade out ambience
                        const fadeOutAmb = setInterval(() => {
                            if (ambientAudio.volume > 0.01) {
                                ambientAudio.volume -= 0.01;
                            } else {
                                ambientAudio.pause();
                                clearInterval(fadeOutAmb);
                            }
                        }, 100);
                    }, 4000);
                }
            }, totalDelay);
        });
    };
});
