import { useState, useEffect } from "react";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import axios from "axios";
import "./AddNewTeam.css";
import { useTranslation } from "react-i18next";



function AddNewTeam() {
      const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "male",
    job_title: "", // تغيير من role إلى job_title
    image: "",
  });
  

  const navigate = useNavigate();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    if (location.state?.memberToEdit) {
      const { memberToEdit } = location.state;
      console.log("Member data to edit:", memberToEdit);
      
      setFormData({
        name: memberToEdit.name,
        email: memberToEdit.email,
        phone: memberToEdit.phone,
        gender: memberToEdit.gender,
        job_title: memberToEdit.job_title || memberToEdit.role || "", // دمج الحقلين
        image: memberToEdit.image,
        password: "" // لا نحمي كلمة السر القديمة
      });
      
      setIsEditMode(true);
      setMemberId(memberToEdit.id);
    }
  }, [location.state]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      console.log("Selected file:", file);
      setFormData({ ...formData, image: file });
    } else {
      alert("Please select a valid image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
  
    if (!token) {
      alert("Authentication token is missing. Please log in again.");
      navigate("/login");
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("job_title", formData.job_title); // تغيير من role إلى job_title
  
      // حقول اختيارية
      if (formData.password) formDataToSend.append("password", formData.password);
      if (formData.image instanceof File) formDataToSend.append("image", formData.image);
  
      // طباعة بيانات FormData للتأكد
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }
  
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };
  
      let response;
      if (isEditMode && memberId) {
        formDataToSend.append("_method", "PUT");
        response = await axios.post(
          `https://final.agrovision.ltd/api/add-member/${memberId}`,
          formDataToSend,
          config
        );
      } else {
        formDataToSend.append("user_id", userId);
        response = await axios.post(
          `https://final.agrovision.ltd/api/add-member`,
          formDataToSend,
          config
        );
      }
  
      // تحقق من الاستجابة
      if (response.data?.member) {
        console.log("Edited successfully", response.data.member);
        alert("Edited successfully");
        navigate("/teamMember", { state: { refreshed: true } });
      } else {
        throw new Error("Error!");
      }
    } catch (error) {
      console.error("Error details :", {
        message: error.message,
        response: error.response?.data,
        config: error.config,
      });
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };
  

  return (
    <div className="app"  dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </div>
        <div className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}>
          <main className="main-content-Add">
            <h1>{isEditMode ? t("Edit Team Member") : t("Add Team Member")}</h1>
            <form onSubmit={handleSubmit} className="form">
              <div className="upload-photo">
                <label htmlFor="upload-input">
                  {formData.image ? (
                    formData.image instanceof File ? (
                      <img
                        src={URL.createObjectURL(formData.image)}
                        alt="member"
                        className="uploaded-image"
                      />
                    ) : (
                      <img
                      src={`https://final.agrovision.ltd/storage/app/public/${formData.image}`}
                      alt="member"
                        className="uploaded-image"
                      />
                    )
                  ) : (
                    <div className="photo-placeholder">
                      <FaCamera />
                    </div>
                  )}
                </label>
                <p className="mb-0 mt-3">{t("Upload Photo")}</p>
                <input
                  type="file"
                  id="upload-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </div>
              <div className="form-fields">
                <div className="form-group">
                  <label>{t("Full Name")}</label>
                  <input
                    type="text"
                    name="name"
                    placeholder={t("Enter Full Name")}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Your Email")}</label>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("Enter Your Email")}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Password")}</label>
                  <input
                    type="password"
                    name="password"
                    placeholder={t("Enter Password")}
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>{t("Phone Number")}</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder={t("Enter your Phone Number")}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Gender")}</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="male">{t("Male")}</option>
                    <option value="female">{t("Female")}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t("Position")}</label>
                  <input
                    type="text"
                    name="job_title" 
                    placeholder={t("CEO")}
                    value={formData.job_title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="add-button">
                {isEditMode ? t("Update") : t("Add Now")}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AddNewTeam;
