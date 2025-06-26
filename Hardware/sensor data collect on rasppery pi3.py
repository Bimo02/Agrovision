import serial
import time
import struct
import requests
from datetime import datetime
import pytz


# Firebase configuration
FIREBASE_URL = 'Your Firebase Realtime Database URL'  # Your Firebase Realtime Database URL
DATABASE_PATH = 'Path to the location in your database where data will be stored'  # Path to the location in your database where data will be stored

# Sensor ID (fixed value)
SENSOR_ID = "agro_0001"

# Initialize the serial connection for USB sensor
ser = serial.Serial(
    port='/dev/ttyUSB0',
    baudrate=9600,
    parity=serial.PARITY_NONE,
    stopbits=serial.STOPBITS_ONE,
    bytesize=serial.EIGHTBITS,
    timeout=1  # Timeout for reading in seconds
)


# Function to read sensor data and parse the response (USB sensor)
def read_sensor():
    try:
        command = b'\x01\x03\x00\x00\x00\x08\x44\x0C'  # Command to request data from sensor
        ser.write(command)  # Send the command to the sensor
        response = ser.read(21)  # Read 21 bytes of response

        if response:
            print("Response:", response.hex())  # Print the response in hexadecimal
            return response
        else:
            print("No data from sensor ...")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None


# Function to parse and process the sensor data (USB sensor)
def parse_sensor_data(response):
    # Discard the first 3 bytes
    response = response[3:]

    # Extract and convert each pair of bytes to a decimal value
    humidity = struct.unpack('>H', response[0:2])[0] / 10.0  # Bytes 4 and 5 (Humidity)
    temperature = struct.unpack('>H', response[2:4])[0] / 10.0  # Bytes 6 and 7 (Temperature)
    EC = struct.unpack('>H', response[4:6])[0]  # Bytes 8 and 9 (EC)
    pH = struct.unpack('>H', response[6:8])[0] / 10.0  # Bytes 10 and 11 (pH)
    N = struct.unpack('>H', response[8:10])[0]  # Bytes 12 and 13 (N)
    P = struct.unpack('>H', response[10:12])[0]  # Bytes 14 and 15 (P)
    K = struct.unpack('>H', response[12:14])[0]  # Bytes 16 and 17 (K)
    fertility = struct.unpack('>H', response[14:16])[0]  # Bytes 18 and 19 (Fertility)

    # Return the parsed values
    return {
        "humidity": humidity,
        "temperature": temperature,
        "EC": EC,
        "pH": pH,
        "N": N,
        "P": P,
        "K": K,
        "fertility": fertility
    }


# Function to upload data to Firebase using HTTP requests
def upload_to_firebase(parsed_data):
    # Get the current timestamp in Africa/Cairo timezone
    cairo_tz = pytz.timezone('Africa/Cairo')
    timestamp = datetime.now(cairo_tz).isoformat()  # Get the current time in Cairo timezone and format it

    # Combine both the USB sensor data into one dictionary
    data = {
        "sensor_id": SENSOR_ID,  # Fixed sensor ID
        "timestamp": timestamp,  # Add timestamp
        "Hum": parsed_data["humidity"],
        "Temp": parsed_data["temperature"],
        "EC": parsed_data["EC"],
        "PH": parsed_data["pH"],
        "N": parsed_data["N"],
        "P": parsed_data["P"],
        "K": parsed_data["K"],
        "Fertility": parsed_data["fertility"]
    }

    # Send the data to Firebase Realtime Database using an HTTP POST request
    url = f"{FIREBASE_URL}{DATABASE_PATH}"
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print("Data successfully uploaded to Firebase:", data)
        else:
            print(f"Failed to upload data: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"Error uploading data to Firebase: {e}")


# Main loop to repeatedly read, parse, and upload sensor data every 30 seconds
while True:
    # Read data from USB sensor (USB sensor)
    usb_data = read_sensor()
    parsed_usb_data = None
    if usb_data:
        parsed_usb_data = parse_sensor_data(usb_data)  # Parse the data from USB sensor

    # If sensor data is available, upload it to Firebase
    if parsed_usb_data is not None:
        upload_to_firebase(parsed_usb_data)

    time.sleep(300)  # Wait for 30 seconds before the next read
