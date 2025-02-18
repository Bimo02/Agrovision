from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import uvicorn

# Load the models
potato_model = tf.keras.models.load_model("D:\\GradProject2025\\AI\\AgroVisionAI_2\\potato_disease_model.keras")
tomato_model = tf.keras.models.load_model("D:\\GradProject2025\\AI\\AgroVisionAI_2\\tomatato_1.keras")

# Class names for each model
potato_class_names = ['Early Blight', 'Healthy', 'Late Blight']
tomato_class_names = ['Early Blight', 'Healthy', 'Late Blight']

IMAGE_SIZE = 256

# Initialize FastAPI app
app = FastAPI()

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
    return {"message": "Welcome to the Disease Prediction API"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), plant: str = Form(...)):
    try:
        # Read the uploaded file
        image_data = await file.read()

        # Decide which model to use
        if plant.lower() == "potato":
            model = potato_model
            class_names = potato_class_names
        elif plant.lower() == "tomato":
            model = tomato_model
            class_names = tomato_class_names
        else:
            return JSONResponse({"error": "Invalid plant type. Use 'potato' or 'tomato'."}, status_code=400)

        # Make a prediction
        predicted_class, confidence = predict_image(model, image_data, class_names)

        # Set reason and control based on predictions
        if plant.lower() == "potato" and predicted_class == "Early Blight":
            reason = "Potato early blight is caused by the fungal pathogen Alternaria solani, thriving in warm, humid conditions and infecting stressed or weakened plants."
            control = "Ensure good irrigation and side dressing of fertilizers, spray organic fungicides."
        elif plant.lower() == "potato" and predicted_class == "Late Blight":
            reason = "Potato late blight is caused by the oomycete pathogen Phytophthora infestans, spreading rapidly in cool, wet conditions and leading to widespread plant and tuber destruction."
            control = "Use resistant potato varieties, practicing crop rotation, removing infected debris, and applying fungicides preventively during cool, wet conditions."
        elif plant.lower() == "tomato" and predicted_class == "Early Blight":
            reason = "Tomato early blight is caused by the fungal pathogen Alternaria solani, leading to dark, concentric ring lesions on leaves, stems, and fruits, especially in warm, humid conditions."
            control = "Use resistant varieties, rotating crops, maintaining proper spacing for air circulation, removing infected debris, and applying fungicides preventively in warm, humid conditions."
        elif plant.lower() == "tomato" and predicted_class == "Late Blight":
            reason = "Tomato late blight is caused by the oomycete pathogen Phytophthora infestans, leading to water-soaked lesions on leaves, stems, and fruits, thriving in cool, wet conditions."
            control = "Using resistant varieties, practicing crop rotation, removing infected plant debris, ensuring proper spacing for airflow, and applying fungicides during cool, wet conditions."
        else:
            reason = "Your plant is Healthy."
            control = "No action needed."

        return JSONResponse({"class": predicted_class, "confidence": confidence, "reason": reason, "control": control})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
