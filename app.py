from flask import Flask, render_template, request
import speech_recognition as sr

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    audio_file = request.files['audio_file']
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)
    
    try:
        text = recognizer.recognize_google(audio, language='ar-AR')
        return {'text': text}
    except sr.UnknownValueError:
        return {'error': 'Could not understand the audio'}
    except sr.RequestError as e:
        return {'error': f'Request error: {e}'}

if __name__ == "__main__":
    app.run(debug=True)