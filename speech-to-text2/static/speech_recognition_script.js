function uploadAudio() {
    let fileInput = document.getElementById("audioFile");
    let file = fileInput.files[0];

    if (!file) {
        alert("يرجى اختيار ملف صوتي!");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);

    fetch("/upload-audio", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = "النص المستخرج: " + data.text;
    })
    .catch(error => {
        console.error("Error:", error);
    });
}
