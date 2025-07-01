import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      
      const response = await fetch("https://final.agrovision.ltd/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setSuccess("Reset link sent to your email. Please check your inbox.");
      
      
      
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
            Smart Farms, <br /> Healthy Crops: Empowering Agriculture with AI and IoT.
          </p>
        </div>
        <div className="login-right">
          <h2>Reset Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          
          <div className="back-to-login">
            <a href="/login" onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}>
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;