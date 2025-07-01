
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signUp.css";
import Modal from 'react-modal';

Modal.setAppElement('#root');

function SignUp({ setIsLoggedIn }) {
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); 
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [userData, setUserData] = useState(null); // Store complete user data
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate("/login"); 
  };



  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("one special character");
    return errors;
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
  };

const handleSubmit = async (e) => {
  e.preventDefault(); 
  setLoading(true); 
  setErrors({});
  
  // Client-side validation
  const newErrors = {};
  
  if (!name.trim()) newErrors.name = "Name is required";
  if (!email.trim()) {
    newErrors.email = "Email is required";
  } else if (!validateEmail(email)) {
    newErrors.email = "Invalid email format";
  }
  
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    newErrors.password = `Password must contain: ${passwordErrors.join(", ")}`;
  }
  
  if (password !== confirmPassword) {
    newErrors.confirmPassword = "Passwords don't match";
  }
  
  if (!phone.trim()) {
    newErrors.phone = "Phone number is required";
  } else if (!validatePhone(phone)) {
    newErrors.phone = "Invalid phone number (10-15 digits)";
  }
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setLoading(false);
    return;
  }

  try {
    // 1. Register the user
    const registerResponse = await fetch("https://final.agrovision.ltd/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        password_confirmation: confirmPassword.trim(),
        role: role 
      }),
    });

    const responseData = await registerResponse.json();
    
    if (!registerResponse.ok) {
      if (responseData.errors) {
        const serverErrors = {};
        if (responseData.errors.email) {
          serverErrors.email = responseData.errors.email[0];
        }
        if (responseData.errors.phone) {
          serverErrors.phone = responseData.errors.phone[0];
        }
        if (responseData.errors.password) {
          serverErrors.password = responseData.errors.password[0];
        }
        setErrors(serverErrors);
      } else {
        setErrors({ general: responseData.message || "Registration failed. Please try again." });
      }
      setLoading(false);
      return;
    }

    // 2. Redirect to login page with email and password prefilled
    navigate("/login", {
      state: {
        prefilledEmail: email.trim(),
        prefilledPassword: password.trim()
      }
    });

  } catch (err) {
    setErrors({ general: "Something went wrong. Please try again." });
    console.error("Registration error:", err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="contain">
      {/* Success Modal */}
      {/* <Modal
        isOpen={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
        contentLabel="Registration Success"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '500px',
            width: '90%',
            borderRadius: '10px',
            padding: '30px',
            textAlign: 'center'
          },
        }}
      >
        <h2>Welcome to AgroVision, {name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>We recommend completing your profile settings now to get the best experience.</p>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={completeProfile}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Complete Profile
          </button>
          <button 
            onClick={() => navigate("/")}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </Modal> */}
      <div className="login-container">
        <div className="login-left">
          <h1>AgroVision</h1>
          <p>
            Smart Farms, <br /> Healthy Crops: Empowering Agriculture with AI and IoT.
          </p>
          <br /><br /><br /><br />
          <p className="over">
            You have an account? <br />
            <a onClick={goToLogin} href="/Autho">Log in</a>
          </p>
          <p className="special">
            Read our <a href="/">terms</a> and <a href="/">conditions</a>.
          </p>
        </div>
        <div className="login-right">
          <h2>Create Account</h2>
          {errors.general && (
            <div className="error-message" style={{ color: "red", marginBottom: "15px" }}>
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group flex-row gap-4">
              <div className="group-left">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ borderColor: errors.name ? "red" : "" }}
                />
                {errors.name && (
                  <p className="error-message" style={{ color: "red", fontSize: "0.8rem" }}>
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="group-right">
                <label>Phone</label>
                <input
                  type="text"
                  placeholder="Your Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ borderColor: errors.phone ? "red" : "" }}
                />
                {errors.phone && (
                  <p className="error-message" style={{ color: "red", fontSize: "0.8rem" }}>
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderColor: errors.email ? "red" : "" }}
              />
              {errors.email && (
                <p className="error-message" style={{ color: "red", fontSize: "0.8rem" }}>
                  {errors.email}
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderColor: errors.password ? "red" : "" }}
              />
              {errors.password && (
                <p className="error-message" style={{ color: "red", fontSize: "0.8rem" }}>
                  {errors.password}
                </p>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ borderColor: errors.confirmPassword ? "red" : "" }}
              />
              {errors.confirmPassword && (
                <p className="error-message" style={{ color: "red", fontSize: "0.8rem" }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;