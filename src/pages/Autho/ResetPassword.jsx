import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // استخراج token و email من query parameters
  const queryParams = new URLSearchParams(location.search);
  const authToken = queryParams.get('token');
  const email = queryParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من مطابقة كلمات المرور
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    
    // التحقق من قوة كلمة المرور
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        'https://final.agrovision.ltd/api/reset-password',
        {
          token: authToken, // بعض الخوادم تتوقع "token" بدلاً من "authToken"
          email,
          password,
          password_confirmation: passwordConfirmation
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      setSuccess(response.data.message || 'Password has been reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      // تحسين رسائل الخطأ
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to reset password. Please try again.';
      setError(errorMessage);
      
      // تسجيل الخطأ الكامل للتصحيح
      console.error('Password reset error:', err.response?.data || err.message);
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
          <h2>Reset Your Password</h2>
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="8"
                placeholder="At least 8 characters"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength="8"
                placeholder="Confirm your password"
              />
            </div>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;