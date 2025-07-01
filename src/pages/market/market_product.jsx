import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { FaSearch } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";


import axios from "axios";
import "./FarmInventory.css";

function MarketInventory() {
  const navigate = useNavigate();
  const location = useLocation();
        const { t, i18n } = useTranslation();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]); // حالة جديدة للتخزين التصنيفات
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "No Category";
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
          `https://final.agrovision.ltd/api/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const categoriesResponse = await axios.get(
          `https://final.agrovision.ltd/api/categories`, // تأكد من المسار الصحيح
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Full API Response:", response.data);

        // تعديل هنا لمعالجة الاستجابة بشكل صحيح
        const productsData = response.data.data || response.data.Crops || [];

        setProducts(productsData);
        setCategories(categoriesResponse.data.data || []);

        productsData.forEach((product) => {
          console.log("Product Data:", product);
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

      // مسح الـ state بعد التحديث علشان متتكررشي البيانات
      navigate("/inventory", { replace: true });
    }
  }, [location.state, navigate]);

  const filteredProducts = (products || []).filter((product) => {
    const productName = product?.name || product?.productName || "";
    const productCategory =
      product?.category_id || product?.productCategory || "";
    const search = (searchTerm || "").toLowerCase();

    return (
      productName.toLowerCase().includes(search) ||
      String(productCategory).toLowerCase().includes(search)
    );
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    localStorage.setItem("searchTerm", value);
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
          `https://final.agrovision.ltd/api/product/${productId}`,
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

  // const handleEdit = (productId) => {
  //   const productToEdit = products.find((product) => product.id === productId);
  //   navigate("/add-new-crop", { state: { cropToEdit: productToEdit } });
  // };

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
                <h1>{t("Market Products")}</h1>
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
              <tbody className="market">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td data-label="Image">
                        {product.images && (
                          <img
                            src={`https://final.agrovision.ltd/storage/app/public/${product.images}`}
                            alt={
                              product.name || product.productName || "Product"
                            }
                            className="product-image"
                          />
                        )}
                      </td>
                      <td data-label="Name">
                        {product.name || product.productName || "No Name"}
                      </td>
                      <td data-label="Category">
                        {getCategoryName(product.category_id)}
                      </td>
                      {/* <td data-label="Category">{product.category_id || product.productCategory || "No Category"}</td> */}
                      <td data-label="Price">
                        {product.price || product.pricePerKilo || "No Price"}
                      </td>
                      <td data-label="Quantity">
                        {product.quantity || "No Quantity"}
                      </td>
                      <td
                        data-label="Status"
                        className={
                          (product.stock_status || product.status) ===
                            "instock" ||
                          (product.stock_status || product.status) ===
                            "In Stock"
                            ? "status-in"
                            : "status-out"
                        }
                      >
                        {product.stock_status || product.status || "Unknown"}
                      </td>
                      <td className="action-icons" data-label="Action">
                        <div className="back-action d-flex g-4">
                          <RiDeleteBinLine
                            className="delete-icon"
                            onClick={() => handleDelete(product.id)}
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
    </div>
  );
}

export default MarketInventory;
