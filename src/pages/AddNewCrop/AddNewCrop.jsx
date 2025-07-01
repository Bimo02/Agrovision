import { useState, useEffect } from "react";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import axios from "axios";
import { useTranslation } from "react-i18next";

import "./AddNewCrop.css";

function AddNewCrop() {
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    productName: "",
    pricePerKilo: "",
    productCategory: "",
    quantity: "",
    status: "In Stock",
    photo: null, // سيتم استخدام هذا للحفظ المؤقت للصورة
    photoURL: "", // سيتم استخدام هذا لعرض الصورة
  });

  const navigate = useNavigate();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [cropId, setCropId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

useEffect(() => {
  if (location.state && location.state.cropToEdit) {
    const crop = location.state.cropToEdit;
    console.log("Product data to edit:", crop);

    const updatedFormData = { ...crop };

    // إذا كانت الصورة موجودة، قم بتحديث photoURL لعرضها
    if (updatedFormData.photo) {
      // تحديد ما إذا كانت الصورة مخزنة في مجلد photos أم لا
      const isInPhotosFolder = updatedFormData.photo.includes('photos/');
      
      updatedFormData.photoURL = isInPhotosFolder
        ? `https://final.agrovision.ltd/storage/app/public/${updatedFormData.photo}`
        : `https://final.agrovision.ltd/storage/app/public/photos/${updatedFormData.photo}`;
    }

    setFormData(updatedFormData);
    setIsEditMode(true);
    setCropId(crop.id);
  }
}, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (jpeg, png, jpg).");
        return;
      }

      // التحقق من حجم الملف (2MB كحد أقصى)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        alert("Image size should not exceed 2MB.");
        return;
      }

      // تحديث حالة formData
      setFormData({
        ...formData,
        photo: file, // حفظ الملف المؤقت
        photoURL: URL.createObjectURL(file), // إنشاء رابط مؤقت لعرض الصورة
      });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("Authentication token or user ID is missing. Please log in again.");
    navigate("/login");
    return;
  }

  const formDataToSend = new FormData();
  formDataToSend.append("productName", formData.productName);
  formDataToSend.append("pricePerKilo", formData.pricePerKilo);
  formDataToSend.append("productCategory", formData.productCategory);
  formDataToSend.append("quantity", formData.quantity);
  formDataToSend.append("status", formData.status);
  formDataToSend.append("user_id", userId);

  if (isEditMode) {
    formDataToSend.append("is_edit", "true");
  }

  // التعديل هنا: استخدام photo بدلاً من photo_url
  if (formData.photo instanceof File) {
    formDataToSend.append("photo", formData.photo);
  } else if (isEditMode && formData.photo) {
    // إذا كان في وضع التعديل ولم يتم رفع صورة جديدة
    const photoName = formData.photo.split('/').pop();
    formDataToSend.append("existing_photo", photoName);
  }

  try {
    let url, method;
    if (isEditMode) {
      url = `https://final.agrovision.ltd/api/crops/${cropId}`;
      formDataToSend.append("_method", "PUT");
      method = "post";
    } else {
      url = "https://final.agrovision.ltd/api/crops";
      method = "post";
    }

    const response = await axios[method](url, formDataToSend, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    alert(isEditMode ? "Crop updated successfully!" : "Crop added successfully!");
    navigate("/inventory", {
      state: isEditMode
        ? { updatedProduct: { ...formData, id: cropId } }
        : { newProduct: response.data }
    });
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    alert(`Error: ${error.response?.data?.message || error.message}`);
  }
};

  return (
    <div className="app" dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div
          className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}
        >
          <Sidebar />
        </div>
        <div
          className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}
        >
          <main className="main-content-Add">
      <h1>{isEditMode ? t("Edit Crop") : t("Add New Crop")}</h1>
            <form onSubmit={handleSubmit} className="form">
              <div className="upload-photo">
                <label htmlFor="upload-input">
                  {formData.photoURL ? (
                    <img
                      src={formData.photoURL}
                      alt="Crop"
                      className="uploaded-image"
                    />
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
                  <label>{t("Product Name")}</label>
                  <input
                    type="text"
                    name="productName"
                    placeholder={t("Enter Product Name")}
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Product Price per Kilo")}</label>
                  <input
                    type="number"
                    name="pricePerKilo"
                    placeholder={t("Enter Product Price per Kilo")}
                    value={formData.pricePerKilo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Product Category")}</label>
                  <input
                    type="text"
                    name="productCategory"
                    placeholder={t("Enter Product Category")}
                    value={formData.productCategory}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Quantity")}</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder={t("Enter Quantity")}
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t("Status")}</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="In Stock">{t("In Stock")}</option>
                    <option value="Out of Stock">{t("Out of Stock")}</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="add-button">
                {isEditMode ? t("Update Crop") : t("Add Crop")}
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AddNewCrop;
