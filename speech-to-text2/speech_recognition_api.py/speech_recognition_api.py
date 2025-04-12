from flask import Flask, request, jsonify
from models.speech_recognition_model import process_audio  # استيراد الموديل
import os

app = Flask(__name__)

# التأكد من وجود مجلد uploads
uploads_folder = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(uploads_folder):
    os.makedirs(uploads_folder)

@app.route("/upload-audio", methods=["POST"])
def upload_audio():
    """استقبال ملف صوتي من المستخدم وتحليله"""
    # التحقق من وجود الملف في الطلب
    if "file" not in request.files:
        return jsonify({"error": "يرجى رفع ملف صوتي."}), 400
    
    # الحصول على الملف الصوتي من الطلب
    file = request.files["file"]
    
    # تحديد المسار لحفظ الملف الصوتي في مجلد uploads
    file_path = os.path.join(uploads_folder, file.filename)
    
    # حفظ الملف في المسار المحدد
    file.save(file_path)

    try:
        # استدعاء الموديل لمعالجة الصوت
        text = process_audio(file_path)
    except Exception as e:
        # في حالة حدوث خطأ أثناء المعالجة
        return jsonify({"error": f"حدث خطأ أثناء معالجة الصوت: {str(e)}"}), 500

    # حذف الملف بعد التحليل
    os.remove(file_path)

    # إرجاع النص الناتج من التحليل
    return jsonify({"text": text})

if __name__ == "__main__":
    app.run(debug=True)
