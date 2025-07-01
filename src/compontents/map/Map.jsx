import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map.css';
import { CiLocationOn } from "react-icons/ci";

const API_KEY = '17ce025ac7a405c79997747a9f2f6337';

const sensors = [
  {
    id: "agro_default_001",
    name: "Main Sensor",
    location: { lat: 31.221413025671588, lon: 29.959908116427286 },
    type: "NPK 8-in-1 Sensor",
  },
  {
    id: "agro_default_002",
    name: "Sensor",
    location: { lat: 31.2218, lon: 29.9602 },
    type: "NPK 8-in-1 Sensor",
  }
];

const createSensorIcon = () => {
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
  });
};

function MyMap() {
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');

  // دالة لجلب بيانات الطقس
  const fetchWeatherData = async (cityName) => {
    try {
      let url;
      if (cityName) {
        // جلب بيانات الطقس بناءً على اسم المدينة مع تحديد الدولة (مصر)
        url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName},EG&appid=${API_KEY}&units=metric`;
      } else {
        // إذا لم تكن المدينة محددة، استخدم الإحداثيات الافتراضية
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${sensors[0].location.lat}&lon=${sensors[0].location.lon}&appid=${API_KEY}&units=metric`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      setError(error.message);
      // في حالة الخطأ، نستخدم الإحداثيات الافتراضية
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${sensors[0].location.lat}&lon=${sensors[0].location.lon}&appid=${API_KEY}&units=metric`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      setWeatherData(fallbackData);
    }
  };

  // استمع لتغيرات في localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedData = localStorage.getItem("userData");
      if (savedData) {
        const userData = JSON.parse(savedData);
        if (userData.city && userData.city !== city) {
          setCity(userData.city);
          fetchWeatherData(userData.city);
        }
      }
    };

    // جلب البيانات الأولية
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      const userData = JSON.parse(savedData);
      if (userData.city) {
        setCity(userData.city);
        fetchWeatherData(userData.city);
      } else {
        fetchWeatherData();
      }
    } else {
      fetchWeatherData();
    }

    // إضافة event listener لتتبع تغيرات localStorage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div>
      {error && <p className="error-message">Error: {error}</p>}
      
      <MapContainer 
        center={[sensors[0].location.lat, sensors[0].location.lon]} 
        zoom={16.8} 
        minZoom={16.8} 
        maxZoom={16.8} 
        className="leaflet-container" 
        zoomControl={false} 
        dragging={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {sensors.map((sensor) => (
          <Marker 
            key={sensor.id}
            position={[sensor.location.lat, sensor.location.lon]}
            icon={createSensorIcon()}
          >
            <Popup className="sensor-popup">
              <div>
                <h3>{sensor.name}</h3>
                <p><strong> sensor id:</strong> {sensor.id}</p>
                <p><strong>type:</strong> {sensor.type}</p>
                <p><strong>location :</strong> {sensor.location.lat.toFixed(6)}, {sensor.location.lon.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <div className="weather-info">
          {weatherData ? (
            <>
              <div className="locate">
                <CiLocationOn />
                <p>{weatherData.name}, {weatherData.sys.country}</p>
              </div>
              <h1>{weatherData.main.temp}°C</h1>
              <div className="details">
                <img 
                  src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} 
                  alt={weatherData.weather[0].description} 
                />
                <p>{weatherData.weather[0].description}</p>
                <div className="day-details">
                  <p>H: {weatherData.main.temp_max}°C</p>
                  <p>L: {weatherData.main.temp_min}°C</p>
                </div>
              </div>
            </>
          ) : (
            <p>Loading weather data...</p>
          )}
        </div>
      </MapContainer>
    </div>
  );
}

export default MyMap;