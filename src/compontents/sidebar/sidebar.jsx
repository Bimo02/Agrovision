import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./sidebar.css";
import { RiDashboard3Line } from "react-icons/ri";
import { MdOutlineWindow, MdOutlineInventory2 } from "react-icons/md";
import { PiChats } from "react-icons/pi";
import { BsListCheck } from "react-icons/bs";
import { SlPresent } from "react-icons/sl";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { IoSettingsOutline } from "react-icons/io5";
import { LuUser2 } from "react-icons/lu";
import { MdProductionQuantityLimits } from "react-icons/md";
import { FaRegClipboard } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { BiBarChartSquare } from "react-icons/bi";


function Sidebar() {
      const { t, i18n } = useTranslation();

  const location = useLocation(); // الحصول على المسار الحالي
  const navigate = useNavigate(); // التنقل بين الصفحات
  const [activeLink, setActiveLink] = useState(location.pathname); // تعيين الحالة بناءً على المسار الحالي

  const role = localStorage.getItem("role"); // قراءة الدور من localStorage

  const links = [
    { icon: <RiDashboard3Line />, label: t("Dashboard"), href: "/" },
    { icon: <MdOutlineWindow />, label: t("Order Analytics"), href: "/analysis" },
    { icon: <BiBarChartSquare />, label: t("Sensor Analytics"), href: "/sensors" },
    { icon: <MdOutlineInventory2 />, label: t("CropsManagement"),  href: "/Inventory" },
    { icon: <MdProductionQuantityLimits />
      , label: t("Market products"),  href: "/market_product" },
    { icon:  <BsListCheck />, label: t("Order Management"), href: "/orderManage" },
    { icon: <HiOutlineChatBubbleLeftRight />, label: t("Chatting"), href: "/new_chat" },
    { icon: <LuUser2 />, label: t("Team"), href: "/teamMember" },
    { icon: <IoSettingsOutline />, label: t("Settings"), href: "/setting" },
  ];

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  const handleNavigation = (href) => {
    if (role === "user" || href === "/Inventory") {
      setActiveLink(href);
      navigate(href); // الانتقال للصفحة المطلوبة
    }
  };

  return (
    <aside className="sidebar" dir={i18n.dir()}>
      <h2 className="sidebar-brand">AgroVision</h2>
      <nav className="sidebar-nav">
        {links.map(({ icon, label, href }) => (
          <div
            key={label}
            className={`link ${activeLink === href ? "active" : ""} ${
              role !== "user" && href !== "/Inventory" ? "disabled" : ""
            }`} // إضافة CSS لتعطيل الروابط
            onClick={() => handleNavigation(href)} // التنقل عند النقر
          >
            {icon}
            <span>{label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
