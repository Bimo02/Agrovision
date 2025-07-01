import React from "react";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import "./sensor.css";
import { useState } from "react";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";


function SensorPage() {
        const { t, i18n } = useTranslation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("https://api.agrovision.ltd/api/export-sensors", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      
      const workbook = XLSX.read(data);
      

      
      XLSX.writeFile(workbook, "sensor_history.xlsx");
      
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error! try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app" dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </div>
        <div className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}>
          <div className="main-sider frame-sensor d-flex">
            <div className="botton">
              <button 
                onClick={handleDownload}
                disabled={isLoading}
                className="download-button"
              >
                {isLoading ? t("loading..." ): t("Download History")}
              </button>
            </div>
            <iframe
              src="https://relaxed-darling-coral.ngrok-free.app"
              frameBorder="0"
              width="100%"
              height="100%"
              className="mt-4"
              title="Sensor Data"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SensorPage;