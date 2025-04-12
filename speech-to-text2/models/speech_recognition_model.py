import speech_recognition as sr
import os
from pydub import AudioSegment
import noisereduce as nr
import scipy.io.wavfile as wav
import numpy as np

def remove_noise(audio_path):
    """إزالة الضوضاء من الملف الصوتي"""
    rate, data = wav.read(audio_path)
    reduced_noise = nr.reduce_noise(y=data, sr=rate)
    clean_audio_path = "cleaned_audio.wav"
    wav.write(clean_audio_path, rate, reduced_noise.astype(np.int16))
    return clean_audio_path

def convert_to_wav(file_path):
    """تحويل الملفات الصوتية إلى WAV إذا كانت بتنسيق مختلف"""
    audio = AudioSegment.from_file(file_path)
    wav_file = "converted_audio.wav"
    audio.export(wav_file, format="wav")
    return wav_file

def process_audio(file_path):
    """تحليل الصوت واستخراج النص"""
    temp_files = []

    if not file_path.endswith(".wav"):
        file_path = convert_to_wav(file_path)
        temp_files.append(file_path)

    clean_audio = remove_noise(file_path)
    temp_files.append(clean_audio)

    recognizer = sr.Recognizer()
    with sr.AudioFile(clean_audio) as audio_file:
        audio = recognizer.record(audio_file)
        try:
            text = recognizer.recognize_google(audio, language='ar-AR')
        except sr.UnknownValueError:
            text = "لم أتمكن من فهم الصوت بوضوح."

    for temp_file in temp_files:
        if os.path.exists(temp_file):
            os.remove(temp_file)

    return text
