import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/Autho/login";
import SignUp from "./pages/register/signUp";
import AddNewCrop from "./pages/AddNewCrop/AddNewCrop";
import FarmInventory from "./pages/FarmInventory/farminventory";
import MarketInventory from "./pages/market/market_product";
import Members from "./pages/teamMember/team";
import AddNewTeam from "./pages/AddNewMemb/AddNewTeam";
import Order from "./pages/OrderManage/orderManage";
import OrderDetails from "./pages/OrderManage/orderDetails";
import NewOrder from "./pages/OrderManage/newOrder";
import Analysis_sensor from "./pages/Analysis_sensor/analysis";
import Setting_page from "./pages/Settings/setting";
import Chat from "./pages/chatting/new_chat";
import SensorPage from "./pages/sensors/sensor";
import ForgotPassword from "./pages/Autho/ForgotPassword";
import ResetPasswordPage from "./pages/Autho/ResetPassword";
import "./App.css"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // حالة تسجيل الدخول
  const [isInitialized, setIsInitialized] = useState(false); // حالة التهيئة
  const [products, setProducts] = useState([
    {
      image: "potato-image-url",
      name: "Potato | EG",
      category: "vegetable",
      price: "8 EGP",
      quantity: "45 Kilo",
      status: "in Stock",
    },
    {
      image: "tomato-image-url",
      name: "Tomato | EG",
      category: "vegetable",
      price: "12 EGP",
      quantity: "72 Kilo",
      status: "Out of Stock",
    },
  ]);

  const [members, setMembers] = useState([
    {
      name: "Mohamed El-Gohry",
      Gender: "Male",
      Email: "MohamedEl-Gohry@gmail.com",
      PhoneNumber: "01098971853",
      Position: "Ceo",
      image: "team1.png",
    },
    {
      name: "Mai El-Mohamedy",
      Gender: "Female",
      Email: "MaiEl-Mohamedy@gmail.com",
      PhoneNumber: "01158673193",
      Position: "Digital Manger",
      image: "team2.png",
    },
  ]);

  const addNewCrop = (newCrop) => {
    setProducts([...products, newCrop]);
  };

  const addNewMemb = (newMemb) => {
    setMembers([...members, newMemb]);
  };

  // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true); // إذا كان الرمز موجوداً، قم بتسجيل الدخول
    }
    setIsInitialized(true); // إتمام التهيئة
  }, []);

  // إذا لم يتم التهيئة، اعرض رسالة انتظار أو قم بمنع الريندر
  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div>
        <Routes>
          {/* Login and Register Pages */}
          <Route
            path="/register"
            element={<SignUp setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {isLoggedIn ? (
            <>
              <Route path="/" element={<Home />} />
              <Route
                path="/inventory"
                element={<FarmInventory products={products} />}
              />
              <Route
                path="/market_product"
                element={<MarketInventory products={products} />}
              />
              <Route path="/sensors" element={<SensorPage />} />
              <Route
                path="/add-new-crop"
                element={<AddNewCrop addNewCrop={addNewCrop} />}
              />
              <Route
                path="/teamMember"
                element={<Members members={members} />}
              />
              <Route
                path="/add-new-memb"
                element={<AddNewTeam addNewMemb={addNewMemb} />}
              />
              <Route path="/newOrder" element={<NewOrder />} />

              <Route path="/orderManage" element={<Order />} />
              <Route path="/order-details" element={<OrderDetails />} />

              <Route path="/analysis" element={<Analysis_sensor />} />

              <Route path="/setting" element={<Setting_page />} />

              <Route path="/new_chat" element={<Chat />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
