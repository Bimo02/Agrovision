import { useState, useEffect } from "react";
import MyMap from "../map/Map";
import "./MainContent.css";
import { useTranslation } from "react-i18next";

const defaultSensorData = {
  Fertility: 0,
  Temp: 0,
  PH: 0,
  Hum: 0,
  N: 0,
  P: 0,
  K: 0,
  EC: 0,
};

const API_BASE_URL = 'https://positive-tiger-endlessly.ngrok-free.app';

function MainContent() {
      const { t, i18n } = useTranslation();
  const [apiLoading, setApiLoading] = useState(false);
  const [sensorData, setSensorData] = useState(defaultSensorData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [pumpStatus, setPumpStatus] = useState({
    mode: null, // 'auto' or 'manual'
    state: null // 'on' or 'off'
  });

  // Fetch sensor data
  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch('https://final.agrovision.ltd/api/firebase/last-record');
        if (!response.ok) throw new Error('Failed to fetch sensor data');
        
        const responseData = await response.json();
              console.log('Raw sensor data:', responseData); // Debug log

        setSensorData({
          ...defaultSensorData,
          ...(responseData.data || {})
        });
        setError(null);
      } catch (err) {
        console.error(err);
        setSensorData(defaultSensorData);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSensorData();
  }, []);

  // API call function
  const callPumpAPI = async (endpoint) => {
    try {
      setApiLoading(true);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          "ngrok-skip-browser-warning": "true",
          "Access-Control-Allow-Origin": "*" 
        },
        mode: 'cors',
      credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // إذا كان الرد HTML (مثل صفحة خطأ ngrok)
        if (errorText.includes('<!DOCTYPE html>')) {
          throw new Error('Server connection failed');
        }
        throw new Error(errorText || `API Error: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    } finally {
      setApiLoading(false);
    }
  };

  const handleModeChange = async (mode) => {
    try {
      setError(null);
      let endpoint;
      
      if (mode === 'auto') {
        endpoint = pumpStatus.mode === 'auto' ? '/stop_auto' : '/auto';
      } else if (mode === 'manual') {
        endpoint = pumpStatus.mode === 'manual' && pumpStatus.state === 'on' 
          ? '/manual/off' 
          : '/manual/on';
      } else {
        throw new Error('Invalid mode');
      }
  
      const response = await callPumpAPI(endpoint);
      
      // دالة مساعدة للتحقق من نجاح العملية
      const isOperationSuccessful = (response) => {
        // إذا كان الرد نصاً عادياً
        if (typeof response === 'string') {
          return response.includes('success') || 
                 response.includes('تم') ||
                 response.includes('Motor ON command sent') ||
                 response.includes('Motor OFF command sent') ||
                 response.includes('Auto mode started') ||
                 response.includes('Auto mode stopped');
        }
        
        // إذا كان الرد كائن JSON
        try {
          const jsonResponse = typeof response === 'string' ? JSON.parse(response) : response;
          return (jsonResponse.message && (
                    jsonResponse.message.includes('success') || 
                    jsonResponse.message.includes('تم') ||
                    jsonResponse.message.includes('Motor ON command sent') ||
                    jsonResponse.message.includes('Motor OFF command sent') ||
                    jsonResponse.message.includes('Auto mode started') ||
                    jsonResponse.message.includes('Auto mode stopped')
                 )) || 
                 (jsonResponse.status === 'on' || jsonResponse.status === 'off' || jsonResponse.status === 'auto');
        } catch {
          return false;
        }
      };
  
      // دالة مساعدة لاستخراج رسالة الخطأ
      const getErrorMessage = (response) => {
        if (typeof response === 'string') {
          try {
            const jsonResponse = JSON.parse(response);
            return jsonResponse.message || response;
          } catch {
            return response;
          }
        }
        return response.message || JSON.stringify(response);
      };
  
      if (isOperationSuccessful(response)) {
        setPumpStatus(prev => ({
          mode: mode === 'auto' 
            ? (prev.mode === 'auto' ? null : 'auto')
            : 'manual',
          state: mode === 'auto'
            ? (prev.mode === 'auto' ? null : 'on')
            : (prev.mode === 'manual' && prev.state === 'on' ? 'off' : 'on')
        }));
      } else {
        const errorMessage = getErrorMessage(response);
        // حالة خاصة عندما يكون وضع "Auto" مفعلاً بالفعل
        if (errorMessage.includes('Auto mode is already running')) {
          setPumpStatus(prev => ({
            ...prev,
            mode: 'auto',
            state: 'on'
          }));
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      setError(error.message.includes('DOCTYPE html') 
        ? 'Connection failed. Please check the server.' 
        : error.message);
      console.error('Mode change failed:', error);
    }
  };

  const handleSensorClick = (sensorName) => {
    setSelectedSensor(sensorName);
  };

  const closePopup = () => setSelectedSensor(null);

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-icon"></div>
      </div>
    );
  }

  return (
    <div className="mainContent" dir={i18n.dir()}>
      <MyMap />
      <div className="farm-info">
        <div className="d-flex flex-wrap flex-column">
          <div className="first d-flex">
            <div
              className="info-card special col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Fertility")}
            >
              <img src="p1.png" className="my-icon" />
              <p className="main text-direction">{t("Fertility")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.Fertility} mg/kg</p>
                <span>
                  {sensorData.Fertility > 80 ? "Good" : "Needs Attention"}
                </span>
              </div>
              <p className="describe text-direction">{t("describe")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Temperature")}
            >
              <img src="p2.png" className="my-icon" />
              <p className="main text-direction">{t("Soiltemperature")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.Temp}°C</p>
              </div>
              <p className="describe text-direction">{t("decribe2")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("pH Level")}
            >
              <img src="p3.png" className="my-icon" />
              <p className="main text-direction">{t("pHLevel")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.PH} PH</p>
              </div>
              <p className="describe text-direction">{t("descibe3")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Moisture")}
            >
              <img src="p4.png" className="my-icon" />
              <p className="main text-direction">{t("SoilMoisture")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.Hum}%</p>
              </div>
              <p className="describe text-direction">{t("describe4")}</p>
            </div>
          </div>

          <div className="first d-flex">
            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Nitrogen")}
            >
              <img src="p5.png" className="my-icon" />
              <p className="main text-direction">{t("Nitrogen")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.N} mg/kg</p>
              </div>
              <p className="describe text-direction">{t("describe5")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Phosphorus")}
            >
              <img src="p6.png" className="my-icon wi-50" />
              <p className="main text-direction">{t("Phosphorus")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.P} mg/kg</p>
              </div>
              <p className="describe text-direction">{t("describe6")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Potassium")}
            >
              <img src="p6.png" className="my-icon wi-50" />
              <p className="main text-direction">{t("Potassium")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.K} mg/kg</p>
              </div>
              <p className="describe text-direction">{t("describe7")}</p>
            </div>

            <div
              className="info-card col-md-4 col-lg-3"
              onClick={() => handleSensorClick("Electrical Conductivity")}
            >
              <img src="p9.png" className="my-icon wi-35" />
              <p className="main text-direction">{t("Electrical")}</p>
              <div className="per d-flex align-items-center gap-3">
                <p className="mb-0">{sensorData.EC} us/cm</p>
              </div>
              <p className="describe text-direction">{t("describe8")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {selectedSensor && (
        <div className="sensor-popup-overlay">
          <div className="sensor-popup">
            <button className="close-popup" onClick={closePopup}>×</button>
            <div className="popup-header">
              <h2>Smart Pump Control</h2>
              {apiLoading && <div className="spinner-border text-primary"></div>}
            </div>
            <div className="popup-content">
              <div className="sensor-info">
                <h3>{selectedSensor}</h3>
                <div className={`status-indicator ${pumpStatus.mode || 'off'} ${pumpStatus.mode === 'manual' ? pumpStatus.state : ''}`}>
  {pumpStatus.mode === 'auto' && 'Auto Mode Active'}
  {pumpStatus.mode === 'manual' && `Manual Mode: ${pumpStatus.state === 'on' ? 'ON' : 'OFF'}`}
  {!pumpStatus.mode && 'Pump Inactive'}
</div>
              </div>
              
              <div className="mode-buttons">
  <button
    className={`mode-btn auto ${pumpStatus.mode === 'auto' ? 'active' : ''}`}
    onClick={() => handleModeChange('auto')}
    disabled={apiLoading}
  >
    {pumpStatus.mode === 'auto' ? 'Stop Auto' : 'Auto Mode'}
  </button>
  
  <button
    className={`mode-btn manual ${pumpStatus.mode === 'manual' ? 'active' : ''}`}
    onClick={() => handleModeChange('manual')}
    disabled={apiLoading}
  >
    {pumpStatus.mode === 'manual' ? 
      (pumpStatus.state === 'on' ? 'Turn Off' : 'Turn On') : 
      'Manual Mode'}
  </button>
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainContent;