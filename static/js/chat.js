const chatBox = document.getElementById("chat-box");

/* ================= SEND MESSAGE ================= */

async function sendMessage(voiceText = null) {

    const input = document.getElementById("user-input");

    const message =
        voiceText || input.value.trim();

    if (!message) return;

    input.value = "";

    addUserMessage(message);

    const thinkingId = addThinkingAnimation();

    scrollBottom();

    try {

        const res = await fetch("/chat/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                type: voiceText ? "voice" : "text"
            })
        });

        const data = await res.json();

        removeThinkingAnimation(thinkingId);

        typeAIMessage(
            data.reply || "No response generated.",
            data.audio || null
        );

        scrollBottom();

    } catch (err) {

        console.error(err);

        removeThinkingAnimation(thinkingId);

        typeAIMessage("Something went wrong. Please try again.");

    }

}

/* ================= ENTER KEY ================= */

function handleEnter(e) {

    if (e.key === "Enter") {
        sendMessage();
    }

}

/* ================= USER MESSAGE ================= */

function addUserMessage(text) {

    const wrapper = document.createElement("div");

    wrapper.className =
        "flex justify-end message-enter";

    wrapper.innerHTML = `
    
    <div class="max-w-xl bg-indigo-400/10 border border-indigo-300/10
    text-slate-100 px-6 py-4 rounded-[24px] rounded-br-sm leading-relaxed shadow-lg">
    
        ${escapeHtml(text)}
    
    </div>
    
    `;

    chatBox.appendChild(wrapper);

}

/* ================= AI MESSAGE ================= */

function addAIMessage(text) {

    const wrapper = document.createElement("div");

    wrapper.className =
        "flex items-start gap-4 message-enter";

    wrapper.innerHTML = `
    
    <div class="w-12 h-12 rounded-2xl glass
    flex items-center justify-center text-xl shrink-0">
        ✦
    </div>

    <div class="glass rounded-3xl rounded-tl-sm px-6 py-5 max-w-2xl">

        <p class="text-slate-200 leading-relaxed ai-message-content"></p>

    </div>
    
    `;

    chatBox.appendChild(wrapper);

    const target =
        wrapper.querySelector(".ai-message-content");

    typeText(target, text);

}

/* ================= TYPING EFFECT ================= */

async function typeAIMessage(text, audioUrl = null) {

    const chatBox =
        document.getElementById("chat-box");

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "flex items-start gap-4";

    wrapper.innerHTML = `
        <div class="w-12 h-12 rounded-2xl glass flex items-center justify-center text-lg relative overflow-hidden">
            ✦
        </div>

        <div class="glass rounded-[28px] px-6 py-5 max-w-[80%] border border-white/10 text-[15px] leading-8 text-slate-200">
            <span class="typing-content"></span>
        </div>
    `;

    chatBox.appendChild(wrapper);

    scrollBottom();

    const textElement =
        wrapper.querySelector(".typing-content");

    let typingSpeed = 18;

    /* AUDIO + SYNC */

    if (audioUrl) {

        const result =
            await playAIAudio(audioUrl);

        const durationMs =
            result.duration * 1000;

        typingSpeed =
            Math.max(
                12,
                (durationMs * 0.92) / text.length
            );

    }

    /* TYPEWRITER */

    let index = 0;

    const interval = setInterval(() => {

        const currentText =
            text.substring(0, index);

        /* HIDE RAW MARKDOWN DURING TYPING */

        const cleanedText =
            currentText
                .replace(/\*\*/g, "")
                .replace(/\*/g, "")
                .replace(/#/g, "")
                .replace(/`/g, "");

        textElement.textContent =
            cleanedText;

        index++;

        scrollBottom();

        if (index > text.length) {

            clearInterval(interval);

        }

    }, typingSpeed);

}

function typeText(element, text) {

    let index = 0;

    const speed = 8;

    function type() {

        if (index < text.length) {

            element.textContent += text.charAt(index);

            index++;

            scrollBottom();

            setTimeout(type, speed);

        }

    }

    type();

}

/* ================= THINKING ================= */

function addThinkingAnimation() {

    const id = "thinking-" + Date.now();

    const wrapper = document.createElement("div");

    wrapper.id = id;

    wrapper.className =
        "flex items-start gap-4 message-enter";

    wrapper.innerHTML = `
    
    <div class="w-12 h-12 rounded-2xl glass
    flex items-center justify-center text-xl shrink-0">
        ✦
    </div>

    <div class="glass rounded-3xl rounded-tl-sm px-5 py-4">

        <div class="flex gap-2">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>

    </div>
    
    `;

    chatBox.appendChild(wrapper);

    return id;

}

function removeThinkingAnimation(id) {

    const el = document.getElementById(id);

    if (el) {
        el.remove();
    }

}

/* ================= SCROLL ================= */

function scrollBottom() {

    chatBox.scrollTo({
        top: chatBox.scrollHeight,
        behavior: "smooth"
    });

}

/* ================= MIC ================= */

function startMic() {

    console.log("🎤 startMic called");

    const micBtn =
        document.getElementById("micBtn");

    const input =
        document.getElementById("user-input");

    const voicePopup =
        document.getElementById("voice-popup");

    const voiceTranscript =
        document.getElementById("voice-transcript");

    voicePopup.classList.remove("hidden");
    voicePopup.classList.add("flex");

    micBtn.classList.add(
        "mic-listening"
    );

    input.placeholder =
        "Listening... Speak now";

    const SpeechRecognition =
        window.webkitSpeechRecognition ||
        window.SpeechRecognition;

    if (!SpeechRecognition) {

        alert("Speech Recognition not supported");

        micBtn.classList.remove(
            "mic-listening"
        );

        input.placeholder =
            "Ask anything about Ashish...";

        return;

    }

    const recognition =
        new SpeechRecognition();

    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let animationFrame;
    let audioStream = null;

    function cleanupMic() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        if (audioStream) {
            audioStream.getTracks().forEach((track) => track.stop());
            audioStream = null;
        }

        micBtn.classList.remove(
            "mic-listening"
        );
        voicePopup.classList.add("hidden");
        voicePopup.classList.remove("flex");
        voiceTranscript.innerHTML = "";
        input.placeholder =
            "Ask anything about Ashish...";
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            audioStream = stream;

            audioContext =
                new (window.AudioContext || window.webkitAudioContext)();

            analyser =
                audioContext.createAnalyser();

            microphone =
                audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;

            const bufferLength =
                analyser.frequencyBinCount;

            dataArray =
                new Uint8Array(bufferLength);

            microphone.connect(analyser);

            const bars =
                document.querySelectorAll(".voice-bar");

            analyser.smoothingTimeConstant = 0.82;

            analyser.fftSize = 32;

            function animateOrb() {

                analyser.getByteFrequencyData(dataArray);

                const values =
                    [...dataArray];

                const mapped =
                    [15, 10, 8, 9, 6, 5, 2, 1, 0, 4, 3, 7];

                bars.forEach((bar, i) => {

                    const value =
                        values[mapped[i]] / 255;

                    const scale =
                        Math.max(0.28, value * 1.8);

                    bar.style.transform =
                        `scaleY(${scale})`;

                    bar.style.opacity =
                        Math.max(.25, value);

                });

                animationFrame =
                    requestAnimationFrame(animateOrb);

            }

            animateOrb();

        })
        .catch((err) => {

            console.error(err);

        });

    recognition.lang = "en-US";

    recognition.interimResults = true;

    recognition.continuous = true;

    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {

        console.log("🎙️ Recognition started");

    };

    recognition.onresult = (event) => {

        console.log("✅ onresult fired");

        let transcript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            transcript +=
                event.results[i][0].transcript;

        }

        console.log("Transcript:", transcript);

        input.value = transcript;
        voiceTranscript.innerHTML =
            transcript || "Listening...";

        finalTranscript = transcript;

    };

    recognition.onerror = (event) => {

        console.error(
            "❌ Speech recognition error:",
            event.error
        );

        cleanupMic();

    };

    recognition.onend = () => {

        cleanupMic();

        console.log("🛑 Recognition ended");

        if (finalTranscript.trim()) {

            sendMessage(finalTranscript);

        }

    };

    recognition.start();

    /* AUTO STOP AFTER 6 SECONDS */

    setTimeout(() => {

        recognition.stop();

    }, 6000);

}

/* ================= HELPERS ================= */

function escapeHtml(text) {

    const div = document.createElement("div");

    div.innerText = text;

    return div.innerHTML;

}

/* ================= GLOBAL ================= */

window.sendMessage = sendMessage;

window.handleEnter = handleEnter;

/* ================= AI AUDIO ================= */

function playAIAudio(audioUrl) {

    return new Promise((resolve) => {

        const aiIcons =
            document.querySelectorAll(
                ".w-12.h-12.rounded-2xl.glass"
            );

        const latestAIIcon =
            aiIcons[aiIcons.length - 1];

        if (latestAIIcon) {

            latestAIIcon.classList.add(
                "ai-speaking"
            );

        }

        const audio =
            new Audio(audioUrl);

        audio.play();

        audio.onloadedmetadata = () => {

            resolve({
                audio,
                duration: audio.duration
            });

        };

        audio.onended = () => {

            if (latestAIIcon) {

                latestAIIcon.classList.remove(
                    "ai-speaking"
                );

            }

        };

    });

}

/* ================= GLOBAL ================= */

window.startMic = startMic;