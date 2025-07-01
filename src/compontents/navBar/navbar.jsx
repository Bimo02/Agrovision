import { RxHamburgerMenu } from "react-icons/rx";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import { IoNotificationsOutline } from "react-icons/io5";
import "./navbar.css";

function Navbar({ toggleSidebar, isSidebarOpen }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);
  const notificationsRef = useRef(null);


useEffect(() => {
  // تهيئة readNotifications في localStorage إذا لم تكن موجودة
  if (!localStorage.getItem('readNotifications')) {
    localStorage.setItem('readNotifications', JSON.stringify([]));
  }
  
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 30000);
  return () => clearInterval(interval);
}, []);

  // تحديث الإشعارات كل 30 ثانية
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // علامة الإشعار كمقروء عند النقر عليه
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("authToken");
      await fetch(`https://final.agrovision.ltd/api/notifications/${id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // تحديث الحالة المحلية
      setNotifications(notifications.map(notification => 
        notification.id === id ? {...notification, is_read: 1} : notification
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // هذه الدالة يمكن استدعاؤها عند جلب الإشعارات الجديدة
const cleanupReadNotifications = (currentNotifications) => {
  const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
  const currentNotificationIds = currentNotifications.map(n => n.id);
  
  // الاحتفاظ فقط بالإشعارات الموجودة حالياً
  const updatedReadNotifications = readNotifications.filter(id => 
    currentNotificationIds.includes(id)
  );
  
  localStorage.setItem('readNotifications', JSON.stringify(updatedReadNotifications));
};



  const toggleDropdown = () => {
    setShowDropdown((prevState) => !prevState);
    setShowNotifications(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prevState) => !prevState);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((prevState) => !prevState);
    setShowDropdown(false);
    setShowLanguageDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("name");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setShowLanguageDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        (dropdownRef.current && !dropdownRef.current.contains(event.target)) &&
        (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) &&
        (notificationsRef.current && !notificationsRef.current.contains(event.target))
      ) {
        setShowDropdown(false);
        setShowLanguageDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const username = localStorage.getItem("username") || "User";
  const userId = localStorage.getItem("userId") || "Unknown ID";
  const role = localStorage.getItem("role") || "No Role"; 
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const my_img = userData.img || "ph3.png";
  
  
const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch("https://final.agrovision.ltd/api/notifications", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    
    // الحصول على قائمة الإشعارات المقروءة من localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    
    // تحديث حالة is_read بناءً على localStorage
    const updatedNotifications = data.map(notification => {
      return {
        ...notification,
        is_read: readNotifications.includes(notification.id) ? 1 : notification.is_read
      };
    });
    
    setNotifications(updatedNotifications);
    cleanupReadNotifications(data);

    // حساب عدد الإشعارات غير المقروءة
    const unread = updatedNotifications.filter(notification => notification.is_read === 0).length;
    setUnreadCount(unread);
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
};

  return (
    <nav className={`navBar ${!isSidebarOpen ? "expanded" : ""}`}>
      <div className="navbar-left">
        <RxHamburgerMenu className="icon" onClick={toggleSidebar} />
      </div>

      <div className="navbar-right">
        {/* أيقونة الإشعارات مع العداد */}
        <div style={{ position: "relative" }} ref={notificationsRef}>
          <div className="notification-icon-container" onClick={toggleNotifications}>
            <IoNotificationsOutline className="notification-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>

          {showNotifications && (
            <div className="notifications-dropdown" >
              
              <div className="notifications-header">
                <h3>{t("Notifications")}</h3>
                <span>{notifications.length} {t("Notification")} </span>
              </div>
              
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                                            {!notification.is_read && <div className="unread-dot"  style={{ 
      marginLeft: i18n.dir() === 'rtl' ? '0' : '8px',
      marginRight: i18n.dir() === 'rtl' ? '8px' : '0'
    }} ></div>}

                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.body}</p>
                        <small>{new Date(notification.created_at).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications"> No Notifications </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* لغة الترجمة */}
        <div style={{ position: "relative" }} ref={langDropdownRef}>
          <div
            className="language-selector"
            onClick={toggleLanguageDropdown}
            style={{ cursor: "pointer", alignItems: "center", gap: "8px" }}
          >
            {i18n.language === "en" ? (
              <>
                <img src="/flags/en.png" alt="English" className="lang-flag" />
                <span>English</span>
              </>
            ) : (
              <>
                <img src="/flags/ar.png" alt="العربية" className="lang-flag" />
                <span>العربية</span>
              </>
            )}
            <IoMdArrowDropdown className="dropdown-arrow" />
          </div>

          {showLanguageDropdown && (
            <div className="dropdown-menu language-menu">
              <div className="language-option" onClick={() => handleLanguageChange("en")}>
                <img src="/flags/en.png" alt="English" className="lang-flag" />
                <span>English</span>
              </div>
              <div className="language-option" onClick={() => handleLanguageChange("ar")}>
                <img src="/flags/ar.png" alt="العربية" className="lang-flag" />
                <span>العربية</span>
              </div>
            </div>
          )}
        </div>

        {/* الحساب الشخصي */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            className="profile-selector"
            onClick={toggleDropdown}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <img src={`https://final.agrovision.ltd/storage/app/public/${my_img}`} alt="User Avatar" className="profile-pic" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="profile-name">{username}</span>
              <span className="profile-role">{role}</span>
            </div>
            <IoMdArrowDropdown className="dropdown-arrow" />
          </div>

          {showDropdown && (
            <div className="dropdown-menu profile-menu">
              <div className="logout-option" onClick={handleLogout} style={{ cursor: "pointer" ,textAlign:"center"}}>
                {t("logout")}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
};

export default Navbar;