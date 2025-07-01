import { useState, useEffect } from "react";
import Sidebar from "../compontents/sidebar/sidebar";
import Navbar from "../compontents/navBar/navbar";
import MainContent from "../compontents/Main-component/MainContent";
import RightSidebar from "../compontents/RightSidebar/RightSidebar";
import '../pages/Home page/Home.css';
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import MetaShortcut from "./chatting/metaShortcut";
import { useTranslation } from "react-i18next";


function Home() {
        const { t, i18n } = useTranslation();

  const navigate = useNavigate();

  // حالة التحقق والتحميل
  // const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login'); // إعادة التوجيه إلى صفحة الـ login إذا لم يكن التوكن موجودًا
    } else {
      // setIsLoading(false); // التوكن موجود وبدأنا في تحميل الصفحة
    }
  }, [navigate]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  



  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1120) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // عرض مؤشر تحميل أثناء التحقق
  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="app" dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
          <Sidebar />
        </div>
        <div className={`content ${isSidebarOpen ? 'shifted' : ''}`}>
          <MainContent />
          <RightSidebar />
        </div>
      </div>
      <MetaShortcut />
    </div>
  );
}

export default Home;