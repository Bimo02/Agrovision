import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { FaCalendar } from "react-icons/fa";
import { FaCamera } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { BiSolidSave } from "react-icons/bi";
import "./setting.css";
import { useTranslation } from "react-i18next";


function Setting_page() {
      const { t, i18n } = useTranslation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dateInputRef = useRef(null);
  const token = localStorage.getItem("authToken");

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
city: "",
    birthday: "",
    img: "", // قيمة افتراضية واضحة
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenCalendar = () => {
    dateInputRef.current.showPicker();
  };

  const handleDateChange = (event) => {
    setFormData({ ...formData, birthday: event.target.value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { day: "2-digit", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, img: file });

      // عرض معاينة الصورة
      const reader = new FileReader();
      reader.onload = (event) => {
        document.querySelector(".photo-sett img").src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Please login first");
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("birthday", formData.birthday);
      formDataToSend.append("city", formData.city); // إضافة المدينة
      
      if (formData.img instanceof File) {
        formDataToSend.append("img", formData.img);
      }
  
      const response = await fetch(
        "https://final.agrovision.ltd/api/update-account",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );
  
      const responseData = await response.json();
  
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update account");
      }
  
      // حفظ البيانات في localStorage مع إضافة city
      const updatedUserData = {
        ...formData,
        img_url: responseData.img_url || formData.img,
        city: formData.city // تأكيد حفظ المدينة
      };
      
      localStorage.setItem("userData", JSON.stringify(updatedUserData));
      
      // إرسال حدث لتحديث المكونات الأخرى
      window.dispatchEvent(new Event('storage'));
  
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(`An error occurred: ${error.message}`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1120);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem("userData");
    if (savedData) {
      const userData = JSON.parse(savedData);
      console.log("User data from storage:", userData);

      // استخراج مسار الصورة سواء كان كائنًا أو نصًا
      const imgPath =
        userData.img && typeof userData.img === "object"
          ? userData.img.path || userData.img.url || ""
          : userData.img || "";

      setFormData({
        id: userData.id || "",
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        city: userData.city || "", // إضافة المدينة
        birthday: userData.birthday || "",
        img: imgPath || "download.png", // تأكد من أن القيمة دائمًا نصية
      });
    }
  }, []);

  return (
    <div className="app"  dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content main-order">
        <div
          className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}
        >
          <Sidebar />
        </div>
        <div
          className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}
        >
          <div className="s-order s-setting">
            <h3>{t("My Account")}</h3>
            <div className="main-setting">
              <div className="top-topp d-flex">
                <div className="photo-sett">
                  <p className="mb-0">{t("PROFILE PICTURE")}</p>
                  <img
                    src={
                      formData.img instanceof File
                        ? URL.createObjectURL(formData.img)
                        : typeof formData.img === "string"
                        ? `https://final.agrovision.ltd/storage/app/public/${formData.img}`
                        : "ph3.png"
                    }
                    alt="profile"
                    onError={(e) => {
                      e.target.src = "ph3.png";
                      if (formData.img instanceof File) {
                        URL.revokeObjectURL(e.target.src);
                      }
                    }}
                  />{" "}
                  <label htmlFor="file-upload" className="custom-file-upload">
                    <FaCamera className="camera-photo" />{t("Change Photo")}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
                <form className="row g-3" onSubmit={handleSubmit}>
                  <div className="col-md-4">
                    <label className="form-label">{t("NAME")}</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder={t("Enter Your Name")}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t("EMAIL ADDRESS")}</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder={t("Enter Email")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">{t("PHONE NUMBER")}</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder={t("Enter Your Phone")}
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4">
        <label className="form-label">{t("CITY")}</label>
        <input
          type="text"
          name="city"
          className="form-control"
          placeholder={t("Enter Your City")}
          value={formData.city}
          onChange={handleChange}
          required
        />
      </div>
                  <div className="col-md-4">
                    <label className="form-label">{t("BIRTHDAY")}</label>
                    <div className="date-input-container">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={t("Select your birthday")}
                        value={
                          formData.birthday ? formatDate(formData.birthday) : ""
                        }
                        readOnly
                        onClick={handleOpenCalendar}
                      />
                      <FaCalendar
                        className="calendar-icon"
                        onClick={handleOpenCalendar}
                      />
                      <input
                        type="date"
                        name="birthday"
                        ref={dateInputRef}
                        className="hidden-date-picker"
                        value={formData.birthday}
                        onChange={handleDateChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-"></div>
                  <button type="submit" className="save-bot">
                    <BiSolidSave className="camera-photo" /> {t("SAVE SETTINGS")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setting_page;
