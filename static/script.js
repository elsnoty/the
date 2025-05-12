let recorder, audioContext, stream;

// Add event listener for file change
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('audio_file').addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            document.getElementById('file-name').innerText = this.files[0].name;
        }
    });
});

async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const input = audioContext.createMediaStreamSource(stream);
        recorder = new Recorder(input, { numChannels: 1 });
        recorder.record();
        
        document.getElementById('result').innerHTML = `
            <div class="status recording">
                <span class="icon">⚪</span>
                Recording in progress...
            </div>
        `;
    } catch (err) {
        document.getElementById('result').innerHTML = `
            <div class="status error">
                <span class="icon">❌</span>
                Error accessing microphone: ${err.message}
            </div>
        `;
    }
}

function stopRecording() {
    if (!recorder) return;
    
    recorder.stop();
    if (stream) stream.getAudioTracks()[0].stop();

    document.getElementById('result').innerHTML = `
        <div class="status processing">
            <span class="icon">⏳</span>
            Processing recording...
        </div>
    `;

    recorder.exportWAV(blob => {
        const url = URL.createObjectURL(blob);
        document.getElementById('player').src = url;

        const formData = new FormData();
        formData.append("audio_file", blob, "recording.wav");

        fetch("/convert", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.text) {
                document.getElementById('result').innerHTML = `
                    <div class="status success">
                        <span class="icon">✅</span>
                        ${data.text}
                    </div>
                `;
            } else {
                document.getElementById('result').innerHTML = `
                    <div class="status error">
                        <span class="icon">❌</span>
                        ${data.error || "An error occurred during conversion"}
                    </div>
                `;
            }
        })
        .catch(err => {
            document.getElementById('result').innerHTML = `
                <div class="status error">
                    <span class="icon">❌</span>
                    Connection error: ${err.message}
                </div>
            `;
        });
    });
}

function uploadFile() {
    const fileInput = document.getElementById("audio_file");
    const file = fileInput.files[0];
    if (!file) {
        document.getElementById('result').innerHTML = `
            <div class="status error">
                <span class="icon">⚠️</span>
                Please select an audio file first
            </div>
        `;
        return;
    }

    document.getElementById('result').innerHTML = `
        <div class="status processing">
            <span class="icon">⏳</span>
            Processing file...
        </div>
    `;

    // Play the audio preview
    document.getElementById('player').src = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append("audio_file", file);

    fetch("/convert", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.text) {
            document.getElementById('result').innerHTML = `
                <div class="status success">
                    <span class="icon">✅</span>
                    ${data.text}
                </div>
            `;
        } else {
            document.getElementById('result').innerHTML = `
                <div class="status error">
                    <span class="icon">❌</span>
                    ${data.error || "An error occurred during conversion"}
                </div>
            `;
        }
    })
    .catch(err => {
        document.getElementById('result').innerHTML = `
            <div class="status error">
                <span class="icon">❌</span>
                Connection error: ${err.message}
            </div>
        `;
    });
}