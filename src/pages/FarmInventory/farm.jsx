const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true); // حالة التحميل

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
    if (location.state && location.state.updatedProduct) {
      const updatedProduct = location.state.updatedProduct;
  
      setProducts((prevProducts) => {
        const updatedProducts = prevProducts.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        );
        return updatedProducts;
      });
    }
  
    if (location.state && location.state.newProduct) {
      const newProduct = location.state.newProduct;
      setProducts((prevProducts) => [...prevProducts, newProduct]);
    }
  }, [location.state]);

  const filteredProducts = products.filter((product) => {
    const productName = product?.productName || "";
    const productCategory = product?.productCategory || "";
    const search = (searchTerm || "").toLowerCase();

    return (
      productName.toLowerCase().includes(search) ||
      productCategory.toLowerCase().includes(search)
    );
  });

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

  // عرض شاشة التحميل إذا كانت البيانات قيد التحميل
  if (isLoading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-icon"></div>
      </div>
    );
  }

  return (
    <div className="app">
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
                <h1>Farm Inventory</h1>
                <button
                  className="add-new-button"
                  onClick={() =>
                    navigate("/add-new-crop", {
                      state: { action: "add" },
                    })
                  }
                >
                  <p>Add Now</p>
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
                  placeholder="Search for a product..."
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                      <img
                        src={`https://final.agrovision.ltd/storage/app/public/photos/${product.photo}`}
                        alt={product.productName || "Product"}
                        className="product-image"
                      />
                      </td>
                      <td>{product.productName || "No Name"}</td>
                      <td>{product.productCategory || "No Category"}</td>
                      <td>{product.pricePerKilo || "No Price"}</td>
                      <td>{product.quantity || "No Quantity"}</td>
                      <td
                        className={
                          product.status === "In Stock"
                            ? "status-in"
                            : "status-out"
                        }
                      >
                        {product.status}
                      </td>
                      <td className="action-icons">
                        <FiEdit
                          className="edit-icon"
                          onClick={() => handleEdit(product.id)}
                        />
                        <RiDeleteBinLine
                          className="delete-icon"
                          onClick={() => handleDelete(product.id)}
                        />
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