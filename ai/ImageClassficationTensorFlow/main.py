from fastapi import FastAPI, File, UploadFile, Form , BackgroundTasks
from fastapi.responses import JSONResponse
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import uvicorn
import requests
import time
import threading
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from firebase_admin.exceptions import FirebaseError

if not firebase_admin._apps:
    cred = credentials.Certificate("D:\\Downloads\\Compressed\\Agrovision-Chatbot-main\\config\\agrovision-d5e22-firebase-adminsdk-fbsvc-db61864363.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://agrovision-d5e22-default-rtdb.firebaseio.com/'
    })
    
# Load the models
potato_model = tf.keras.models.load_model("D:\\GradProject2025\\AI\\AgroVisionAI_2\\Agrovision\\ai\\ImageClassficationTensorFlow\\potato_disease_model.keras")
tomato_model = tf.keras.models.load_model("D:\\GradProject2025\\AI\\AgroVisionAI_2\\Agrovision\\ai\\ImageClassficationTensorFlow\\tomatato_1.keras")
plant_verification_model = tf.keras.models.load_model("D:\\GradProject2025\\AI\\AgroVisionAI_2\\Agrovision\\ai\\ImageClassficationTensorFlow\\plant_identfication_model 1.2 .keras")

# Class names for each model
potato_class_names = ['Early Blight', 'Healthy', 'Late Blight']
tomato_class_names = ['Early Blight', 'Healthy', 'Late Blight']
plant_verification_class_names = ['Random', 'T&P']

IMAGE_SIZE = 256

#ESP32_IP = "http://192.168.34.72"
#ESP32_IP = "http://192.168.1.11"  # غيّر الـ IP حسب جهازك
API_URL = "https://final.agrovision.ltd/api/firebase/last-record"
MOISTURE_THRESHOLD = 60.0

# متغير يتحكم في تشغيل / إيقاف الوضع الأوتوماتيكي
auto_mode_active = False
auto_thread = None  # للسيطرة على الـ thread الخاص بالـ Auto Mode

headers = {
    "User-Agent": "PostmanRuntime/7.32.2",
    "Accept": "*/*",
    "Connection": "keep-alive"
}

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://dashboard.agrovision.ltd", "http://localhost:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
# Prediction function
def predict_image(model, image_data, class_names):
    # Load and preprocess the image
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))
    img_array = np.array(img)
    img_array = tf.expand_dims(img_array, 0)  # Create a batch

    predictions = model.predict(img_array)
    predicted_class = class_names[np.argmax(predictions[0])]
    confidence = round(100 * (np.max(predictions[0])), 2)
    return predicted_class, confidence

@app.get("/")
async def root():
    return {"message": "Welcome to AgroVision AI API"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), plant: str = Form(...)):
    try:
        image_data = await file.read()

        # First, verify that it's a valid plant image
        verification_class, verification_confidence = predict_image(
            plant_verification_model,
            image_data,
            plant_verification_class_names,
             )

        if verification_class == "Random":
            return JSONResponse({
                "class": "Invalid Input",
                "confidence": verification_confidence,
                "reason": "The uploaded image doesn't appear to be a plant leaf.",
                "control": "Please upload a clear image of a plant leaf for disease classification."
            })

        # Continue with disease prediction if verified
        plant = plant.lower()
        if plant == "potato":
            model, class_names = potato_model, potato_class_names
        elif plant == "tomato":
            model, class_names = tomato_model, tomato_class_names
        else:
            return JSONResponse({"error": "Invalid plant type. Use 'potato' or 'tomato'."}, status_code=400)

        predicted_class, confidence = predict_image(model, image_data, class_names)

        # Disease-specific info
        if plant == "potato" and predicted_class == "Early Blight":
            reason = "Potato early blight is caused by the fungal pathogen Alternaria solani..."
            control = "Ensure good irrigation and side dressing of fertilizers, spray organic fungicides."
        elif plant == "potato" and predicted_class == "Late Blight":
            reason = "Potato late blight is caused by Phytophthora infestans..."
            control = "Use resistant varieties, crop rotation, remove infected debris, apply fungicides."
        elif plant == "tomato" and predicted_class == "Early Blight":
            reason = "Tomato early blight is caused by Alternaria solani..."
            control = "Use resistant varieties, rotate crops, remove debris, apply fungicides."
        elif plant == "tomato" and predicted_class == "Late Blight":
            reason = "Tomato late blight is caused by Phytophthora infestans..."
            control = "Use resistant varieties, proper spacing, remove infected plants, apply fungicides."
        else:
            reason = "Your plant is Healthy."
            control = "No action needed."

        return JSONResponse({
            "plant": plant.capitalize(),
            "prediction": {
                "class": predicted_class,
                "confidence": f"{confidence}%",
                "reason": reason,
                "control": control
            }
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
def get_sensor_data():
    try:
        response = requests.get(API_URL, headers=headers, timeout=60)
        response.raise_for_status()
        data = response.json()
        humidity = data['data']['Hum']
        print("✅ Humidity Received:", humidity)
        return humidity
    except Exception as e:
        print("❌ Error fetching data:", e)
        return None

def send_motor_command(on=True):
    try:
        ref = db.reference('/pump')
        ref.update({
            'state': on,
            'timestamp': int(time.time())
        })
        print(f"🚿 Firebase Motor {'ON' if on else 'OFF'} command sent.")
        return f"Motor {'ON' if on else 'OFF'} command sent."
    except FirebaseError as e:
        print("❌ Firebase Error:", str(e))
        return str(e)
    except Exception as e:
        print("❌ Unexpected Error:", str(e))
        return str(e)

# Control the motor based on moisture level
@app.get("/manual/{state}")
def manual_control(state: str):
    if state.lower() == "on":
        result = send_motor_command(True)
        return JSONResponse(content={"status": "on", "message": result})
    elif state.lower() == "off":
        result = send_motor_command(False)
        return JSONResponse(content={"status": "off", "message": result})
    else:
        return JSONResponse(content={"error": "Invalid state, use 'on' or 'off'"}, status_code=400)

@app.get("/auto")
def auto_control(background_tasks: BackgroundTasks):
    global auto_mode_active
    if auto_mode_active:
        return {"message": "Auto mode is already running."}
    
    # إنشاء thread جديد لبدء الوضع الأوتوماتيكي
    auto_mode_active = True
    global auto_thread
    auto_thread = threading.Thread(target=run_auto_mode)
    auto_thread.start()

    return {"message": "Auto mode started in the background!"}

@app.get("/stop_auto")
def stop_auto():
    global auto_mode_active
    if not auto_mode_active:
        return {"message": "Auto mode is not running."}
    
    auto_mode_active = False
    send_motor_command(False)  # إيقاف الوضع الأوتوماتيكي
    if auto_thread:
        auto_thread.join()  # تأكد من إيقاف الـ thread بشكل صحيح
    return {"message": "Auto mode stopped."}

def run_auto_mode():
    global auto_mode_active
    while auto_mode_active:
        humidity = get_sensor_data()
        if humidity is None:
            print("❌ Failed to fetch sensor data.")
            return
        if humidity < MOISTURE_THRESHOLD:
            send_motor_command(True)
        else:
            send_motor_command(False)
        time.sleep(10)  # تأخير لمدة 10 ثواني بين كل عملية وأخرى
# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
