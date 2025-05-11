import speech_recognition as sr
import os
from pydub import AudioSegment

def convert_to_wav(file_path):
    audio = AudioSegment.from_file(file_path)
    wav_file = "converted_audio.wav"
    audio.export(wav_file, format="wav")
    return wav_file

def process_audio(file_path):
    temp_files = []

    if not file_path.endswith(".wav"):
        file_path = convert_to_wav(file_path)
        temp_files.append(file_path)

    recognizer = sr.Recognizer()
    with sr.AudioFile(file_path) as audio_file:
        audio = recognizer.record(audio_file)
        try:
            text = recognizer.recognize_google(audio, language='ar-AR')
        except sr.UnknownValueError:
            text = "Could not understand the audio clearly."

    for temp_file in temp_files:
        if os.path.exists(temp_file):
            os.remove(temp_file)

    return text

