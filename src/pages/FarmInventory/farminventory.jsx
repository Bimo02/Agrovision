import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { FaSearch } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { BiStore } from "react-icons/bi";
import axios from "axios";
import { useTranslation } from "react-i18next";

import "./FarmInventory.css";

function FarmInventory() {
  const navigate = useNavigate();
  const location = useLocation();
      const { t, i18n } = useTranslation();


  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMarketPopupOpen, setIsMarketPopupOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل


  const handleMarketClick = (product) => {
    setSelectedProduct(product);
    setDescription(product.description || ""); // افترض أن وصف المنتج موجود في بيانات API
    setIsMarketPopupOpen(true);
  };

  const handleSendToMarket = async () => {
    if (!selectedProduct) return;
  
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }
  
      // Create form data
      const formData = new FormData();
      formData.append("crop_id", selectedProduct.id.toString());
      formData.append("product_name", selectedProduct.productName || "Unnamed Product");
      formData.append("price", (selectedProduct.pricePerKilo || 0).toString());
      formData.append("quantity", (selectedProduct.quantity || 1).toString());
      formData.append("description", description);
      formData.append("category_id", 
        (selectedCategory === "fruit" ? 1 : 
         selectedCategory === "vegetables" ? 2 :
         selectedCategory === "seeds" ? 3 : 4).toString()
      );
  
      // Debug: Print selected product info
      console.log("=== Selected Product Details ===");
      console.log("Product ID:", selectedProduct.id);
      console.log("Product Name:", selectedProduct.productName);
      console.log("Image Path:", selectedProduct.photo);
      console.log("Full Image URL:", `https://final.agrovision.ltd/storage/app/public/photos/${selectedProduct.photo}`);
  
      // Handle image upload properly
      if (selectedProduct.photo) {
        try {
          const imageUrl = `https://final.agrovision.ltd/storage/app/public/photos/${selectedProduct.photo}`;
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], selectedProduct.photo, { type: blob.type });
          formData.append("images", file); // تغيير من images[] إلى images
        } catch (error) {
          console.error("Error fetching image:", error);
          formData.append("images", selectedProduct.photo); // Fallback
        }
      }
  
      // Debug: Print all FormData contents
      console.log("=== Form Data Contents ===");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(key, `File: ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          console.log(key, value);
        }
      }
  
      // Make the API request
      const response = await axios.post(
        "https://final.agrovision.ltd/api/products/add-from-crop",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
  
      // Debug: Print full API response
      console.log("=== API Response ===", response.data);
  
      // Handle response
      if (response.data.success) {
        alert("Product sent to market successfully!");
        setIsMarketPopupOpen(false);
      } else {
        alert("Failed to send: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error details:", error);
      
      // Enhanced error logging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
        
        if (error.response.data?.errors) {
          alert("Validation errors:\n" + 
            Object.entries(error.response.data.errors)
              .map(([key, val]) => `${key}: ${val}`)
              .join("\n"));
        }
      } else if (error.request) {
        console.error("Error request:", error.request);
        alert("Network error. Please check your connection.");
      } else {
        console.error("Error message:", error.message);
        alert(`Error occurred: ${error.message}`);
      }
    }
  };

  // Fetch products from the API
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");
  
        if (!token || !userId) {
          throw new Error("No token or user ID found, please log in");
        }
  
        const response = await axios.get(
          `https://final.agrovision.ltd/api/users/${userId}/crops`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        console.log("API Response:", response.data.Crops);
        setProducts(response.data.Crops);
  
        // طباعة أسماء الصور
        response.data.Crops.forEach((product) => {
          console.log("Image Name:", product.photo);
        });
      } catch (error) {
        console.error("Error fetching crops:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchCrops();
  }, []);

  // Add new product to the list
  useEffect(() => {
    if (location.state) {
      if (location.state.updatedProduct) {
        const updatedProduct = location.state.updatedProduct;
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          )
        );
      }
  
      if (location.state.newProduct) {
        const newProduct = location.state.newProduct;
        setProducts((prevProducts) => [...prevProducts, newProduct]);
      }
  
      navigate("/inventory", { replace: true });
    }
  }, [location.state, navigate]);
  

  const filteredProducts = products.filter((product) => {
    const productName = product?.productName || "";
    const productCategory = product?.productCategory || "";
    const search = (searchTerm || "").toLowerCase();

    return (
      productName.toLowerCase().includes(search) ||
      productCategory.toLowerCase().includes(search)
    );
  });

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


  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    localStorage.setItem("searchTerm", value);
  };

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("authToken");

        if (!token) {
          alert("No authentication token found. Please log in again.");
          return;
        }

        const response = await axios.delete(
          `https://final.agrovision.ltd/api/crops/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const updatedProducts = products.filter(
            (product) => product.id !== productId
          );
          setProducts(updatedProducts);
          localStorage.setItem("crops", JSON.stringify(updatedProducts));
          alert("Product deleted successfully!");
        } else {
          alert("Error deleting product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("An error occurred while deleting the product.");
      }
    }
  };

  const handleEdit = (productId) => {
    const productToEdit = products.find((product) => product.id === productId);
    navigate("/add-new-crop", { state: { cropToEdit: productToEdit } });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-icon"></div>
      </div>
    );
  }

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
          <div className="inventory-container">
            <header className="inventory-header">
              <div className="farm-left">
                <h1>{t("Farm Inventory")}</h1>
                <button
                  className="add-new-button"
                  onClick={() =>
                    navigate("/add-new-crop", {
                      state: { action: "add" },
                    })
                  }
                >
                  <p>{t("Add Now")}</p>
                </button>
              </div>

              <div className="search-bar2" style={{ position: "relative" }}>
                <FaSearch
                  className="search-icon"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "15px",
                    transform: "translateY(-50%)",
                    color: "#aaa",
                  }}
                />
                <input
                  type="text"
                  placeholder={t("Search for a product...")}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input2"
                />
              </div>
            </header>
          </div>

          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>{t("Image")}</th>
                  <th>{t("Name")}</th>
                  <th>{t("Category")}</th>
                  <th>{t("Price")}</th>
                  <th>{t("Quantity")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td data-label={t("Image")} >
                      <img
                        src={`https://final.agrovision.ltd/storage/app/public/photos/${product.photo}`}
                        alt={product.productName || "Product"}
                        className="product-image"
                      />
                      </td>
                      <td data-label={t("Name")}>{product.productName || "No Name"}</td>
                      <td data-label={t("Category")}>{product.productCategory || "No Category"}</td>
                      <td data-label={t("Price")}>{product.pricePerKilo || "No Price"}</td>
                      <td data-label={t("Quantity")}>{product.quantity || "No Quantity"}</td>
                      <td data-label={t("Status")}
                        className={
                          product.status === "In Stock"
                            ? "status-in"
                            : "status-out"
                        }
                      >
                        {product.status}
                      </td>

                      <td className="action-icons" data-label={t("Action")}>
                      <div className="back-action d-flex g-4">

                        <FiEdit
                          className="edit-icon"
                          onClick={() => handleEdit(product.id)}
                        />
                        <RiDeleteBinLine
                          className="delete-icon"
                          onClick={() => handleDelete(product.id)}
                        />
                      <BiStore
                        className="edit-icon"
                        onClick={() => handleMarketClick(product)}
                      />

                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isMarketPopupOpen && (
  <div className="market-popup-overlay">
    <div className="market-popup">
      <div className="popup-header">
        <h3>{t("Send to Market")}</h3>
        <button 
          className="close-popup" 
          onClick={() => setIsMarketPopupOpen(false)}
        >
          &times;
        </button>
      </div>
      
      <div className="popup-content">
        <div className="description-section">
          <h4>{t("Description")}</h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("Enter product description...")}
          />
        </div>
        
        <div className="category-section">
          <h4>{t("Category")}</h4>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t("Select a category")}</option>
            <option value="fruit">{t("Fruit")}</option>
            <option value="vegetables">{t("Vegetables")}</option>
            <option value="seeds">{t("Seeds")}</option>
            <option value="fertilizers">{t("Fertilizers")}</option>
          </select>
        </div>
      </div>
      
      <button 
  className="send-to-market-btn"
  onClick={handleSendToMarket}
>
  {t("Send")}
</button>
    </div>
  </div>
)}
    </div>
  );
}

export default FarmInventory;