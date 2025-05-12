from flask import Flask, render_template, request
import speech_recognition as sr
from pydub import AudioSegment
import os
import tempfile
import subprocess

app = Flask(__name__)

# Configure FFmpeg paths
FFMPEG_BIN = r"C:\ffmpeg\bin\ffmpeg.exe"
FFPROBE_BIN = r"C:\ffmpeg\bin\ffprobe.exe"

# Set paths for PyDub
AudioSegment.converter = FFMPEG_BIN
AudioSegment.ffprobe = FFPROBE_BIN

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    if 'audio_file' not in request.files:
        return {'error': 'No file uploaded'}
    
    audio_file = request.files['audio_file']
    if audio_file.filename == '':
        return {'error': 'No selected file'}
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = os.path.join(temp_dir, audio_file.filename)
            audio_file.save(temp_path)
            
            if not audio_file.filename.lower().endswith('.wav'):
                try:
                    wav_path = os.path.join(temp_dir, 'converted.wav')
                    
                    # Try PyDub conversion first
                    try:
                        audio = AudioSegment.from_file(temp_path)
                        audio.export(wav_path, format='wav')
                    except:
                        # Fallback to direct FFmpeg command
                        cmd = [
                            FFMPEG_BIN,
                            '-y',
                            '-i', temp_path,
                            '-acodec', 'pcm_s16le',
                            '-ar', '44100',
                            '-ac', '1',
                            wav_path
                        ]
                        subprocess.run(cmd, check=True)
                    
                    temp_path = wav_path
                except Exception as e:
                    return {'error': f'Conversion failed: {str(e)}'}
            
            try:
                recognizer = sr.Recognizer()
                with sr.AudioFile(temp_path) as source:
                    audio = recognizer.record(source)
                    text = recognizer.recognize_google(audio, language='ar-AR')
                    return {'text': text}
            except sr.UnknownValueError:
                return {'error': 'Could not understand the audio'}
            except sr.RequestError as e:
                return {'error': f'Google API error: {e}'}
    except Exception as e:
        return {'error': f'Processing error: {str(e)}'}

if __name__ == "__main__":
    app.run()