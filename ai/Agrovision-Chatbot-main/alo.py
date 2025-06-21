import firebase_admin
from firebase_admin import credentials, db
import requests

cred = credentials.Certificate("C:\\Users\\alir0\\Downloads\\Compressed\\Agrovision-Chatbot-main\\AR_chatbot\\config\\agrovision-sensor-data-firebase-adminsdk-ag5yl-32cd7df29d.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://agrovision-sensor-data-default-rtdb.firebaseio.com/"
})

def get_latest_sensor_data():
    ref = db.reference("sensor_data")
    data = ref.get()

    if not data or not isinstance(data, dict):
        return "No sensor data available."

    latest_key = max(data.keys())  # Get the latest entry key
    latest_entry = data[latest_key]
    
    return latest_entry
latest_data=get_latest_sensor_data()
sensor_context = (
            f"Latest sensor data:\n"
            f"- Temperature: {latest_data['Temp']}°C\n"
            f"- Humidity: {latest_data['Hum']}%\n"
            f"- pH Level: {latest_data['PH']}\n"
            f"- Soil Fertility: {latest_data['Fertility']}\n"
            f"- Nitrogen: {latest_data['N']}, Phosphorus: {latest_data['P']}, Potassium: {latest_data['K']}\n\n"
        )
# Example usage
print(sensor_context)  # Should print the latest sensor data