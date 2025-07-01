import "./newOrder.css";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { FaCalendar, FaPlus } from "react-icons/fa";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { useLocation } from "react-router-dom";
import { BiSolidSave } from "react-icons/bi";

function NewOrder() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");  // 🟢 جلب userId من التخزين
    const token = localStorage.getItem("authToken");  // 🟢 جلب التوكين
    const [orders, setOrders] = useState([]); // ✅ تعريف setOrders

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedDate, setSelectedDate] = useState("");
    const [tableData, setTableData] = useState([]);
    const dateInputRef = useRef(null);
    const [totalAmount, setTotalAmount] = useState(0);

    const location = useLocation();
    const orderToEdit = location.state?.order || null; 
    const order = location.state?.order; 
    console.log(order);  

    const [formData, setFormData] = useState({
        client_name: "",
        client_contact: "",
    });

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    useEffect(() => {
        fetchOrders(); // ✅ تحميل الطلبات عند فتح الصفحة
    }, []);

    useEffect(() => {
        const total = tableData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotalAmount(total);
    }, [tableData]);

    useEffect(() => {
        const handleResize = () => {
        setIsSidebarOpen(window.innerWidth > 1120);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Select a date";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        }).format(date);
    };

    const handleOpenCalendar = () => {
        dateInputRef.current.showPicker();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleAddData = () => {
        if (formData.product && formData.description && formData.rate && formData.amount) {
            setTableData([...tableData, {
                product: formData.product,
                description: formData.description,
                rate: parseFloat(formData.rate),
                amount: parseFloat(formData.amount),
            }]);
            setFormData((prev) => ({ ...prev, product: "", description: "", rate: "", amount: "" }));
        }
    };
    
    useEffect(() => {
        if (orderToEdit) {
            setFormData({
                client_name: orderToEdit.client_name || "",
                client_contact: orderToEdit.client_contact || "",
                company_name: orderToEdit.company_name || "",
                client_phone: orderToEdit.client_phone || "",
                client_Address: orderToEdit.client_Address || "",
            });
            
            setSelectedDate(orderToEdit.due_date || "");
            setTableData(Array.isArray(orderToEdit.items) ? orderToEdit.items : []);
        }
    }, [orderToEdit]);
    
    
    
    useEffect(() => {
        const total = tableData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        setTotalAmount(total);
    }, [tableData]);
    

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // ✅ تأكيد إدخال البيانات المطلوبة
        if (!formData.client_name || !formData.client_contact || tableData.length === 0) {
            alert("Please fill all required fields and add at least one item!");
            return;
        }
    
        // ✅ تجهيز بيانات الطلب الجديد
        const newOrder = {
            due_date: selectedDate,
            client_name: formData.client_name,
            client_contact: formData.client_contact,
            company_name: formData.company_name,
            client_phone: formData.client_phone,
            client_Address: formData.client_Address,
            amount: totalAmount,
            status: "Pending",
            items: tableData,
        };
    
        const url = "https://final.agrovision.ltd/api/orders"; // 🟢 إضافة طلب جديد فقط
    
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newOrder),
            });
    
            if (!response.ok) throw new Error("Failed to create order");
    
            alert("Order created successfully!");
            navigate("/orderManage");
        } catch (error) {
            console.error("API Error:", error);
            alert("Failed to connect to server!");
        }
    };
    

const handleEditOrder = async (e) => {
        e.preventDefault();

        if (!formData.client_name || !formData.client_contact || tableData.length === 0) {
            alert("Please fill all required fields and add at least one item!");
            return;
        }

        const updatedOrder = {
            due_date: selectedDate,
            client_name: formData.client_name,
            client_contact: formData.client_contact,
            amount: totalAmount,
            status: "Pending",
        };
        

        const url = `https://final.agrovision.ltd/api/orders/${orderToEdit.id}`;

        try {
            console.log("🔄 Sending Update Request:", updatedOrder);
            
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedOrder),
            });

            if (!response.ok) {
                const responseData = await response.json();
                console.error("❌ API Response Error:", responseData);
                alert(`Failed to update order: ${responseData.message || "Unknown error"}`);
                return;
            }

            console.log("✅ Order updated successfully!");

            await fetchOrders(); // ✅ جلب الطلبات بعد التحديث مباشرةً
            alert("Order updated successfully!");
            navigate("/orderManage");
        } catch (error) {
            console.error("🚨 API Error:", error);
            alert("Failed to connect to server!");
        }
    };

    // ✅ جلب الطلبات بعد التحديث
    const fetchOrders = async () => {
        try {
            const response = await fetch(`https://final.agrovision.ltd/api/users/${userId}/orders`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch orders");
            }

            const orders = await response.json();
            setOrders(orders);  // ✅ تحديث البيانات في الواجهة مباشرةً
            console.log("🔍 Updated Orders List:", orders);
        } catch (error) {
            console.error("🚨 Error fetching orders:", error);
        }
    };


return (
    <div className="app">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <div className="main-content main-order">
            <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
            <Sidebar />
            </div>
            <div className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}>
                <div className="order-details">
                    <div className="f-d f-order">
                        <div className="f-left">
                            <button onClick={() => navigate(-1)}>
                                <IoMdArrowRoundBack />
                            </button>
                            <h2>{orderToEdit ? "Edit Order" : "New Order"}</h2>
                        </div>
                        <div className="f-right">
                            <HiOutlineDotsVertical />
                        </div>
                    </div>
                    <div className="s-order">
                        <h3>CLIENT INFO</h3>
                        <form className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">Client Name</label>
                            <input
                                type="text"
                                name="client_name"
                                className="form-control"
                                placeholder="Enter Client Name"
                                value={formData.client_name}
                                onChange={handleChange}
                            />
                            </div>
                        <div className="col-md-3">
                            <label className="form-label">Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                className="form-control"
                                placeholder="Enter Company Name"
                                value={formData.company_name} 
                                onChange={handleChange}
                            />

                            </div>
                        <div className="col-md-3">
                            <label className="form-label">Client Email</label>
                            <input
                                type="email"
                                name="client_contact"
                                className="form-control"
                                placeholder="Enter Client Email"
                                value={formData.client_contact}
                                onChange={handleChange}
                            />
                            </div>
                        <div className="col-md-3">
                            <label className="form-label">Client Phone</label>
                            <input
                                type="text"
                                name="client_phone"
                                className="form-control"
                                placeholder="Enter Client Phone"
                                value={formData.client_phone}
                                onChange={handleChange}
                            />
                            </div>
                        <div className="col-md-3">
                            <label className="form-label">Client Address</label>
                            <textarea
                                name="client_Address"
                                value={formData.client_Address}
                                className="form-control Special-inp"
                                placeholder="Enter Client Address"
                                style={{ height: "85px", resize: "none" }}
                                onChange={handleChange}
                            />

                            </div>       
                            <div className="col-md-6 duDate" onClick={handleOpenCalendar}>
                            <div className="coll-left">
                                <FaCalendar className="calender-left" />
                            </div>
                            <div className="coll-middle">
                                <p>DUE DATE</p>
                                <p className="formatted-date">{formatDate(selectedDate)}</p>
                                <input
                                type="date"
                                ref={dateInputRef}
                                className="date-picker"
                                style={{ appearance: "none", opacity: 0, position: "absolute", width: 0, height: 0 }}
                                onChange={handleDateChange}
                                />
                            </div>
                            <div className="coll-right">
                                <MdOutlineKeyboardArrowDown />
                            </div>
                            </div>
                        </form>
                        <div className="order-det">
                            <h2>Item Desription</h2>
                            <div className="order-header">
                            {["PRODUCT ITEMS", "ITEM DESCRIPTION", "RATE", "AMOUNT"].map((header, index) => (
                                <p key={index} className="order-header-item">{header}</p>
                            ))}
                            </div>
                            <div className="order-data">
                            {tableData.map((item, index) => (
                                <div key={index} className="order-data-row">
                                <p className="order-data-item ">{item.product}</p>
                                <p className="order-data-item">{item.description}</p>
                                <p className="order-data-item">{item.rate}</p>
                                <p className="order-data-item order-data-spe">{`${item.amount} EGP`}</p>
                                </div>
                            ))}
                            </div>
                            <div className="order-input-container">
                                <input type="text" name="product" className="order-input first-input" value={formData.product} onChange={handleChange} placeholder="Product Item" />
                                <input type="text" name="description" className="order-input" value={formData.description} onChange={handleChange} placeholder="Item Description" />
                                <input type="number" name="rate" className="order-input" value={formData.rate} onChange={handleChange} placeholder="Rate" />
                                <input
                                    type="number"
                                    name="amount"
                                    className="order-input last-input"
                                    value={formData.amount}
                                    onChange={(e) => {
                                        setFormData({ ...formData, amount: e.target.value });
                                    }}
                                    placeholder="Amount"
                                />              
                                <button className="add-btn" onClick={handleAddData}><FaPlus /></button>
                            </div>
                        </div>
                        <form className="row g-3 invoice-form">
                            <div className="col-md-6">
                                <label className="form-label">INVOICE NO</label>
                                <input
                                type="text"
                                className="form-control"
                                placeholder="invoice no"
                                />
            </div>

            <div className="col-md-6">
            <label className="form-label">AMOUNT (EGP)</label>
            <input
                    type="text"
                    className="form-control"
                    value={totalAmount ? `${totalAmount} EGP` : ""}
                    readOnly
                    />

            </div>
                        </form>
                        <button className="save-btn" onClick={orderToEdit ? handleEditOrder : handleSubmit}>
    <BiSolidSave className="save-icon" /> {orderToEdit ? "Update Order" : "SEND INVOICE"}
</button>

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

export default NewOrder;

