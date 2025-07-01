import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { LiaSearchSolid } from "react-icons/lia";
import { FaCalendar } from "react-icons/fa";
import { IoMdArrowDropdown } from "react-icons/io";
import { useState, useEffect, useRef } from "react";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { FaReceipt } from "react-icons/fa6";
import { LiaCoinsSolid } from "react-icons/lia";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";
import { TbMailFilled } from "react-icons/tb";
import { Button } from "react-bootstrap";
import CustomTooltip from "./toolist";
import "./analysis.css";

function Analysis_sensor() {
    const { t, i18n } = useTranslation();
  const [hoveredBar, setHoveredBar] = useState(null);
  const [timeframe, setTimeframe] = useState("Monthly");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRangeText, setDateRangeText] = useState("Select a date range");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate(); // استيراد useNavigate من react-router-dom

  const handleOpenChat = async (client) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // 1. جلب جميع المحادثات لفحص وجود محادثة مع هذا العميل
      const response = await fetch(
        "https://final.agrovision.ltd/api/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      const conversations = Array.isArray(data)
        ? data
        : data.conversations || [];

      // 2. البحث عن محادثة موجودة مع هذا العميل
      const existingConversation = conversations.find(
        (conv) => conv.user2_id == client.user_id || conv.user2_id == client.id
      );

      if (existingConversation) {
        // إذا وجدت محادثة، فتحها
        navigate("/new_chat", {
          state: {
            conversationData: existingConversation,
            clientData: {
              id: client.user_id || client.id,
              name: client.name,
              phone: client.phone,
              orders_count: client.orders_count,
            },
          },
        });
      } else {
        // إذا لم توجد محادثة، إنشاء محادثة جديدة
        navigate("/new_chat", {
          state: {
            clientData: {
              id: client.user_id || client.id,
              name: client.name,
              phone: client.phone,
              orders_count: client.orders_count,
            },
            activateChat: true, // إشارة لإنشاء محادثة جديدة
          },
        });
      }
    } catch (error) {
      console.error("Error opening chat:", error);
      // Fallback في حالة الخطأ
      navigate("/new_chat", {
        state: {
          clientData: {
            id: client.user_id || client.id,
            name: client.name,
            phone: client.phone,
            orders_count: client.orders_count,
          },
          activateChat: true,
        },
      });
    }
  };

  useEffect(() => {
    // جلب بيانات التحليل عند تحميل المكون
    fetchAnalysisData();

    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1120);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [analyticsData, setAnalyticsData] = useState({
    total_balance: 0,
    invoice_sent: {
      count: 0,
      change: 0,
      direction: "up",
    },
    invoice_completed: {
      count: 0,
      change: 0,
      direction: "up",
    },
    status_counts: {
      sent: 0,
      completed: 0,
      unpaid: 0,
    },
    latest_payments: [],
    clients_count: 0,
    clients: [],
    monthly_sales: [],
  });
  const fetchAnalysisData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      setLoading(true);

      const response = await fetch(
        "https://final.agrovision.ltd/api/order-analytics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      console.log("Analytics Data:", data);

      const transformedData = {
        total_balance: data.total_sales || 0,
        invoice_sent: data.invoice_sent || {
          count: 0,
          change: 0,
          direction: "up",
        },
        invoice_completed: data.invoice_completed || {
          count: 0,
          change: 0,
          direction: "up",
        },
        status_counts: {
          completed: data.status_counts?.delivered || 0,
          unpaid: data.status_counts?.pending || 0,
          sent: data.status_counts?.ordered || 0,
        },
        latest_payments: data.latest_orders || [],
        clients_count: data.clients?.length || 0,
        clients: data.clients || [],
        monthly_sales: data.monthly_sales || [],
      };

      setAnalyticsData(transformedData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  const handleOpenCalendar = () => {
    startDateRef.current.showPicker();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  useEffect(() => {
    if (startDate && endDate) {
      setDateRangeText(`${formatDate(startDate)} - ${formatDate(endDate)}`);
    }
  }, [startDate, endDate]);

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
    endDateRef.current.showPicker();
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  // بيانات الرسم البياني (يمكن استبدالها ببيانات ديناميكية من API)
  const chartData = (analyticsData.monthly_sales || []).map((monthData) => ({
    month: monthData.month,
    paid: Math.round(monthData.total), // تقريب القيمة إلى أقرب عدد صحيح
    unpaid: 0,
  }));

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-icon"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="full-screen-loader">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app" dir={i18n.dir()}>
      <Navbar
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="main-content">
        <div
          className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}
        >
          <Sidebar />
        </div>
        <div
          className={`content order flex-column ${
            isSidebarOpen ? "shifted" : ""
          }`}
        >
          <div className="inventory-container">
            <header className="inventory-header">
              <div className="farm-left new-farm analysis">
                <h1>{t("Order Analytics")}</h1>
              </div>
            </header>
          </div>
          <div className="main-sider d-flex">
            <div className="main-left-side">
              <div className="left-top">
                <div className="left-left">
                  <div className="bord-icon">
                    <div className="left-icon">
                      <LiaCoinsSolid className="coin-ic" />
                    </div>
                  </div>
                  <div className="mid-txt">
      <h2>{t("Total Sales")}</h2>
                    <h3>{t("EGP")} {analyticsData.total_balance.toLocaleString()}</h3>
                  </div>
                </div>
                <div className="right-desc">
                  <p>{t("Total orders")}: {analyticsData.invoice_sent.count}</p>{" "}
                  <div className="info-right">
                    <FaArrowTrendUp className="increase-icon" />
                    <p>
                      <span>{t("Delivered")}</span>{" "}
                      {analyticsData.status_counts.completed}
                    </p>
                  </div>
                </div>
              </div>
              <div className="left-mid">
                <div className="mid-right">
                  <h3>{t("Invoice Sent")}</h3>
                  <div className="decribe-right">
                    <p>{analyticsData.invoice_sent?.count || 0}</p>
                    <div className="details-right">
                      {analyticsData.invoice_sent?.direction === "up" ? (
                        <FaArrowTrendUp className="increase-icon" />
                      ) : (
                        <FaArrowTrendDown className="decrease-icon" />
                      )}
                      <p>{analyticsData.invoice_sent?.change || 0}%</p>
                    </div>
                  </div>
                </div>
                <div className="mid-right">
                  <h3>{t("Invoice Completed")}</h3>
                  <div className="decribe-right">
                    <p>{analyticsData.invoice_completed?.count || 0}</p>
                    <div className="details-right det-left">
                      {analyticsData.invoice_completed?.direction === "up" ? (
                        <FaArrowTrendUp className="increase-icon" />
                      ) : (
                        <FaArrowTrendDown className="decrease-icon" />
                      )}
                      <p>{analyticsData.invoice_completed?.change || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="left-bottom">
                <h3>{t("Latest Invoice Payment")}</h3>
                <div className="bot-payment">
                  {analyticsData.latest_payments
                    .slice(0)
                    .map((payment, index) => (
                      <div className="paymentt" key={index}>
                        <div className="pay-left">
                          <div
                            className="back-pay"
                            style={{
                              background:
                                index === 0
                                  ? "rgba(75, 49, 120, 1)"
                                  : index === 1
                                  ? "rgba(196, 190, 244, 1)"
                                  : "rgba(202, 159, 139, 1)",
                            }}
                          ></div>
                          <div className="info-pay">
                            <p className="id">{t("Order")} #{payment.order_id}</p>
                            <p className="name">{payment.customer}</p>
                          </div>
                        </div>

                        <div className="pay-mid">
                          <div className="info-pay d-flex">
                           < FaReceipt />
                            <p className="numb_pay">
                              {t("EGP")} {payment.amount.toFixed(2)}
                            </p>
                          </div>
                          <p className="date">{payment.created_at}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="main-right-side">
              <div className="right-top ">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fs-5 fw-bold">{t("Invoices Statistic")}</h3>
                  <div className="rightSide-mid d-flex justify-content-between mb-3">
                    <div className="right-number d-flex align-items-center gap-2">
                      <div className="status-indicator prim"></div>
                      <p className="mb-0 small ">
                       {t("Total Paid")}:{" "}
                        <span>{analyticsData.status_counts.completed}</span>
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="status-indicator danger"></div>
                      <p className="mb-0 small ">
                       {t("Total Unpaid")}:{" "}
                        <span>{analyticsData.status_counts.unpaid}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ height: "300px", marginTop: "45px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ right: 30 }}
                      barSize={32}
                    >
                      <defs>
                        <linearGradient
                          id="paidGradient"
                          x1="0"
                          y1="1"
                          x2="0"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(119, 255, 116, 1)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(56, 226, 93, 1)"
                          />
                        </linearGradient>
                        <linearGradient
                          id="unpaidGradient"
                          x1="0"
                          y1="1"
                          x2="0"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(128, 205, 106, 1)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(56, 109, 47, 1)"
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, "dataMax + 10"]}
                        tickCount={6}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => Math.round(value)}
                      />
                      <Tooltip
                        content={<CustomTooltip hoveredBar={hoveredBar} />}
                        cursor={{ fill: "transparent" }}
                        formatter={(value) => Math.round(value)} // هذه السطر يضمن تقريب القيم في التولتيب
                      />
                      <Bar
                        dataKey="unpaid"
                        fill="url(#unpaidGradient)"
                        name="Unpaid"
                        radius={[7.4, 7.4, 0, 0]}
                        barSize={32}
                        onMouseEnter={() => setHoveredBar("unpaid")}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                      <Bar
                        dataKey="paid"
                        fill="url(#paidGradient)"
                        name="Paid"
                        radius={[7.4, 7.4, 0, 0]}
                        barSize={32}
                        onMouseEnter={() => setHoveredBar("paid")}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="left-bottom right-bottom">
                <h3>{t("Clients")}</h3>
                <div className="View-All">
                  <p>
                   {t("You have")}{" "}
                    <span className="sec">{analyticsData.clients_count}</span>{" "}
                    {t("clients")}
                  </p>
                  <p className="view">{t("View All")}</p>
                </div>
                <div className="bot-payment">
                  {analyticsData.clients.slice(0, 3).map((client, index) => (
                    <div
                      className="paymentt"
                      key={index}
                      onClick={() => handleOpenChat(client)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="pay-left">
                        <div
                          className="back-pay"
                          style={{
                            background:
                              index === 0
                                ? "rgba(75, 49, 120, 1)"
                                : index === 1
                                ? "rgba(196, 190, 244, 1)"
                                : "rgba(202, 159, 139, 1)",
                          }}
                        ></div>
                        <div className="info-pay">
                          <p className="id">{client.name || "N/A"}</p>
                          <p className="name">{client.phone || "N/A"}</p>
                        </div>
                      </div>
                      <div className="pay-mid">
                        <div className="info-pay">
                          <p className="numb_pay">
                            {client.orders_count || 0} {t("orders")}
                          </p>
                        </div>
                      </div>
                      <div className="message-icon">
                        <TbMailFilled />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analysis_sensor;
