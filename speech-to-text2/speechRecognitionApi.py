from flask import Flask, request, jsonify
from models.speechRecognition import process_audio
import os

app = Flask(__name__)

# Ensure uploads folder exists
uploads_folder = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(uploads_folder):
    os.makedirs(uploads_folder)

@app.route("/upload-audio", methods=["POST"])
def upload_audio():
    if "file" not in request.files:
        return jsonify({"error": "Please upload an audio file."}), 400
    
    file = request.files["file"]
    file_path = os.path.join(uploads_folder, file.filename)
    
    file.save(file_path)

    try:
        text = process_audio(file_path)
    except Exception as e:
        return jsonify({"error": f"An error occurred while processing the audio: {str(e)}"}), 500

    os.remove(file_path)

    return jsonify({"text": text})

if __name__ == "__main__":
    app.run(debug=True)