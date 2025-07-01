import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { useState, useEffect,useRef  } from "react";
import { useNavigate } from "react-router-dom";
import { FaReceipt } from "react-icons/fa6";
import { LiaSearchSolid } from "react-icons/lia";
import { MdEmail } from "react-icons/md";
import { FaCheck, FaClock } from "react-icons/fa";
import { TbTruckDelivery } from "react-icons/tb";
import { MdDoneAll } from "react-icons/md";
import { MdOutlineCancel } from "react-icons/md";
import { FaUpRightAndDownLeftFromCenter } from "react-icons/fa6";
import "./orderManage.css";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FaEllipsisV } from "react-icons/fa";
import { useTranslation } from "react-i18next";



const colors = [
  "rgba(243, 203, 126, 1)",
  "rgba(132, 218, 145, 1)",
  "rgba(171, 113, 148, 1)",
  "rgba(76, 91, 168, 1)",
  "rgba(196, 190, 244, 1)",
  "rgba(75, 49, 120, 1)"
];

function Order() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { t, i18n } = useTranslation();

  const [checkedOrders, setCheckedOrders] = useState(() => {
    return JSON.parse(localStorage.getItem("checkedOrders")) || [];
  });

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // تحقق من أن الحالة الجديدة مسموح بها
    const allowedStatuses = ["pending", "delivered", "cancelled"];
    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const response = await fetch(
      `https://final.agrovision.ltd/api/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update order status: ${response.status}`);
    }

    const updatedOrder = await response.json();
    
    // تحديث الحالة المحلية مع التأكد من أن الخادم قد استجاب بالبيانات المحدثة
    setProducts(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: updatedOrder.status || newStatus } : order
    ));

    return updatedOrder;
  } catch (error) {
    console.error("Error updating order status:", error);
    setError(error.message);
    return null;
  }
};

const DropdownMenu = ({ orderId, currentStatus, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // جعل خيارات الحالة متسقة مع الخادم
  const statusOptions = [
    { value: "pending", label: "Pending", icon: <FaClock /> },
    { value: "delivered", label: "Delivered", icon: <TbTruckDelivery /> },
    { value: "cancelled", label: "Cancelled", icon: <MdOutlineCancel /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    const success = await onStatusChange(orderId, newStatus);
    if (success) {
      setIsOpen(false);
    }
  };

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <button 
        className="dropdown-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <HiOutlineDotsHorizontal />
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`dropdown-item ${
                currentStatus === option.value ? "active" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(orderId, option.value);
              }}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
const [error, setError] = useState(null); // بدلاً من [ setError ]  

  useEffect(() => {
    localStorage.setItem("checkedOrders", JSON.stringify(checkedOrders));
  }, [checkedOrders]);

  useEffect(() => {
   const fetchOrders = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch(`https://final.agrovision.ltd/api/farmers/orders`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // تعديل هنا لمعالجة الهيكل المختلف للبيانات
    const orders = data.orders || data.data || [];
    
    setProducts(Array.isArray(orders) ? orders : []);
    
  } catch (err) {
    console.error("Fetch error:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
    
    fetchOrders();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCheck = (id) => {
    setCheckedOrders((prev) =>
      prev.includes(id) ? prev.filter((orderId) => orderId !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    return Object.values(product).some(value => String(value).toLowerCase().includes(search));
  });

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1120);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  
  return (
    <div className="app"  dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </div>
        <div className={`content order flex-column ${isSidebarOpen ? "shifted" : ""}`}>
          <div className="inventory-container">
            <header className="inventory-header">
              <div className="farm-left new-farm">
                <h1>{t("Order List")}</h1>
                <div className="le2">
                  <div className="left-in">
                    <LiaSearchSolid className="ser-inp"/>
                    <input 
                      className="search-in"
                      type="text" 
                      placeholder={t("Search here")}
                      value={searchTerm} 
                      onChange={handleSearchChange} 
                    />
                  </div>
                  {/* <button
                    className="add-my-button"
                    // onClick={() => navigate("/newOrder", { state: { action: "add" } })}
                    >
                    <p><FaReceipt /> + New Order</p>
                  </button> */}
                </div>
              </div>
            </header>
          </div>

          {loading ? (
  <div className="full-screen-loader">
    <div className="loader-icon"></div>
  </div>
)  : (
  <>
    <div className="inventory-table new-tab">
      <table>
        <thead>
          <tr>
            <th></th>
         <th>{t("Order ID")}</th>
          <th>{t("Due Date")}</th>
          <th>{t("Client")}</th>
          <th>{t("Phone")}</th>
          <th>{t("Amount")}</th>
          <th>{t("Status")}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map((order, index) => {
            const color = colors[index % colors.length];
            const firstItem = order.order_items?.[0]?.product || {};

            return (
              <tr
              key={order.id}
              className={checkedOrders.includes(order.id) ? "checked-row" : ""}
              onClick={() => toggleCheck(order.id)}
            >
            
                <td className="bnt">
                  <button
                    className={`check-button ${
                      checkedOrders.includes(order.id) ? "checked" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCheck(order.id);
                    }}
                  >
                    {checkedOrders.includes(order.id) && (
                      <div className="inner-square"></div>
                    )}
                  </button>
                </td>
                <td data-label="id" className="idd">{order.id}</td>
                <td data-label="Due-Date" className="datenew">
  {order.delivered_date && order.delivered_date !== "Anul1" 
    ? new Date(order.delivered_date).toLocaleDateString() 
    : "N/A"}
</td>
                <td>
                  <div data-label="Client" className="client-cell">
                    <div  className="client-avatar" style={{ backgroundColor: color }}>
                    {order.name?.split(" ").map(word => word[0]).join("").toUpperCase()}

                    </div>
                    <div className="client-info">
                      <span  className="client-name">{order.name}</span>
                                    <span className="client-email">{firstItem.name || 'No product'}</span>

                    </div>
                  </div>
                </td>
                <td>
                  <div className="email-container">
                      <div data-label="Phone" className="email-text">{order.phone}</div>
                  </div>
                </td>
                <td data-label="Amount" className="amount-text">{order.total} {t("EGP")}</td>
         <td className="d-flex justify-content-between align-items-center">
  <div data-label="Status" className={`status-container ${order.status?.toLowerCase().replace(" ", "-") || ""}`}>
    {order.status === "Completed" && <FaCheck className="status-icon" />}
    {order.status === "ordered" && <MdDoneAll className="status-icon" />}
    {order.status === "Pending" && <FaClock className="status-icon" />}
    {order.status === "delivered" && <TbTruckDelivery className="status-icon" />}
    {order.status === "cancelled" && <MdOutlineCancel className="status-icon" />}
    <span>{order.status}</span>
  </div>
  
  <DropdownMenu
    orderId={order.id}
    currentStatus={order.status?.toLowerCase()}
    onStatusChange={updateOrderStatus}
  />
</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    <div className="pagination-container">
      <span>
        Showing {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, filteredProducts.length)} from{" "}
        {filteredProducts.length} data
      </span>
      <div className="pagination-controls">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    </div>
  </>
)}


        </div>
      </div>
    </div>
  );
}

export default Order;
