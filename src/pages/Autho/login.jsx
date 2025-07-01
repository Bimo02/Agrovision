import { useState } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import "./Login.css";



function Login({ setIsLoggedIn }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const navigate = useNavigate();
const location = useLocation();
const [email, setEmail] = useState(location.state?.prefilledEmail || "");
const [password, setPassword] = useState(location.state?.prefilledPassword || "");



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://final.agrovision.ltd/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Error: ${response.statusText} (Status Code: ${response.status})`
        );
      }

      const text = await response.text();
      console.log("Response text: ", text);

      if (text) {
        try {
          const data = JSON.parse(text);
          console.log("Response data: ", data);

          if (data?.token && data?.role) {
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("role", data.role);

            // حفظ جميع بيانات المستخدم
            const userData = {
              id: data.id || "",
              name: data.name || "",
              email: data.email || email,
              phone: data.phone || "",
              birthday: data.birthday || "",
              img: data.img || "download.png",
            };

            localStorage.setItem("userData", JSON.stringify(userData));
            localStorage.setItem("userId", String(data.id));
            localStorage.setItem(
              "username",
              data.name || data.email.split("@")[0]
            );

            setIsLoggedIn(true);

            // توجيه المستخدم حسب الدور
            switch (data.role.toLowerCase()) {
              case "admin":
              case "seller":
                navigate("/Inventory");
                break;
              case "buyer":
                window.location.href = "https://market.agrovision.ltd/";
                break;
              case "user":
                navigate("/");
                break;
              default:
                navigate("/");
            }
          } else {
            setError("Invalid response from server. Please try again.");
          }
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          setError("Something went wrong. Please try again.");
        }
      } else {
        throw new Error("Empty response from server. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contain">
      <div className="login-container">
        <div className="login-left">
          <h1>AgroVision</h1>
          <p>
            Smart Farms, <br /> Healthy Crops: Empowering Agriculture with AI
            and IoT.
          </p>
          <br />
          <br />
          <br />
          <br />
          <p className="over">
            Don’t have an account? <br />
            <a href="/register">Get started!</a>
          </p>
          <p className="special">
            Read our{" "}
            <span style={{ cursor: "pointer" }}>terms and conditions.</span>
          </p>
        </div>
        <div className="login-right">
          <h2>Account Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-options">
              <label>
                <input type="checkbox" />
                Keep me signed in
              </label>
           <a 
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
                style={{ cursor: "pointer" }}
              >
                Forgot Password?
              </a>
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
      {/* <Modal
        show={showForgotPassword}
        onHide={() => setShowForgotPassword(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Enter your email to receive a password reset link</p>
          
          {forgotPasswordError && (
            <div className="alert alert-danger">{forgotPasswordError}</div>
          )}
          {forgotPasswordSuccess && (
            <div className="alert alert-success">{forgotPasswordSuccess}</div>
          )}

          <Form onSubmit={handleForgotPassword}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="your@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Send Reset Link
            </Button>
          </Form>
        </Modal.Body>
      </Modal> */}
    </div>
  );
}

export default Login;
