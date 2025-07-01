import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { useState, useEffect, useRef } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import "./orderDetails.css";
import { FaCheck, FaClock } from "react-icons/fa";
import { PiPrinterFill } from "react-icons/pi";
import { MdDoneAll } from "react-icons/md";
import { PiDownloadSimpleBold } from "react-icons/pi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { TbEdit } from "react-icons/tb";



function OrderDetails() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const contentRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1120);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ تحميل PDF
  const handleDownloadPDF = () => {
    const input = contentRef.current;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Order_${product.id}.pdf`);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleEdit = (order) => {
    navigate("/newOrder", { state: { order } });
};


  if (!product) return <h2>Order not found!</h2>;

  return (
    <div className="app">
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </div>
        <div className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}>
          <div className="order-details" ref={contentRef}>
            <div className="f-d">
              <div className="f-left">
                <button onClick={() => navigate(-1)}>
                  <IoMdArrowRoundBack />
                </button>
                <h2>ORDER</h2>
                <p>{product.id}</p>
              </div>
              <div className="f-right">
                <p className={`status-label ${product.status.toLowerCase().replace(" ", "-")}`}>
                  {product.status === "Completed" && <FaCheck className="status-icon" />}
                  {product.status === "Invoice Sent" && <MdDoneAll className="status-icon" />}
                  {product.status === "Pending" && <FaClock className="status-icon" />}
                  <span>{product.status}</span>
                </p>
                <button className="download-btn" onClick={handleDownloadPDF}>
                  <PiDownloadSimpleBold /> Download
                </button>

                <PiPrinterFill className="print-btn" onClick={handlePrint} /> 
                <div ref={menuRef} className="position-relative">
      {/* أيقونة التلات نقط بدون أي ستايل إضافي */}
      <button className="border-0 bg-transparent p-0" onClick={() => setOpen(!open)}>
        <HiOutlineDotsVertical className="text-dark" />
      </button>

      {/* القائمة المنسدلة بتنسيق Bootstrap + إغلاق تلقائي */}
      {open && (
        <div className="dropdown-menu show position-absolute end-0 mt-2 shadow rounded-lg border-0 p-2">
          <button
            className="dropdown-item px-3 py-2 rounded text-dark fw-medium hover:bg-light"
         onClick={() => {
  console.log("Edit clicked", product); // تأكد إن الداتا بتوصل
  setOpen(false);
  handleEdit(product);
}}

          >
            <TbEdit />
             Edit
          </button>
        </div>
      )}
                </div>
              </div>
            </div>
            <div className="s-d">
              <p className="title">CLIENT</p>
              <div className="s-total">
              <div className="s-left">
                <img src="/client.png" alt="user" />
              </div>
              <div className="s-right">
                <p className="c-name">{product.client_name}</p>
                <p className="st mb-0" >18  Guild Street London, EC2V 5PX</p>
                <p className="st fw-bold mb-2">United kingdom</p>
                <div className="s-contact">
                  <p>{product.client_contact}</p>
                  <p>tel:(012) 3456 789</p>
                </div>
              </div>
              </div>
              <div className="border-green"></div>
              <div className="order-det">
                    <div className="order-left">
                        <div className="sub-left">
                            <p className="name">PRODUCT ITEMS</p>
                            <p className="des">Fresh Potato 2025</p>
                            <p className="des">Fresh Tomato 2025</p>
                        </div>
                        <div className="sub-right">
                        <p className="name">ITEM DESCRIPTION</p>
                            <p className="des">Fresh Tomato 2025 * 100K</p>
                            <p className="des">Fresh Tomato 2025 * 95K</p>
                        </div>
                    </div>
                    <div className="order-left">
                        <div className="sub-left">
                        <p className="name">RATE</p>
                            <p className="des">15.00</p>
                            <p className="des">10.00</p>
                        </div>
                        <div className="sub-right">
                        <p className="name ">AMOUNT</p>
                            <p className="des fw-bold">1500.00 EGP</p>
                            <p className="des fw-bold">5435.00 EGP</p>
                        </div>
                    </div>
                </div>

                <div className="date">
                    <p className="mb-1">DUE DATE</p>
                    <p className="product-date"> {product.due_date}</p>
                </div>
                <div className="dott"></div>

                <div className="calc-amount">
                    <div className="cal-right">
                    <div className="row2">
                        <p className="up-txt">SUBTOTAL</p>
                        <p className="down-txt">17,883.00 EGP</p>
                    </div>
                    <div className="row2">
                        <p className="up-txt">TAX</p>
                        <p className="down-txt">2%</p>
                    </div>
                    <div className="row2 total">
                        <p className="up-txt">TOTAL</p>
                        <p className="down-txt">{product.amount}</p>
                    </div>

                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
