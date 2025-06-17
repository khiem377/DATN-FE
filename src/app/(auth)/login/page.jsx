'use client';
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Modal, Card, Typography, Space, Divider, Progress, Tooltip } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [notify, setNotify] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [showPasswordSuggestion, setShowPasswordSuggestion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hàm kiểm tra độ mạnh mật khẩu
  const checkPasswordStrength = (password) => {
    if (!password) {
      return { score: 0, feedback: [] };
    }

    let score = 0;
    const feedback = [];
    const checks = {
      length: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Kiểm tra từng tiêu chí
    if (checks.length) {
      score += 20;
      feedback.push({ type: 'success', text: 'Có ít nhất 8 ký tự' });
    } else {
      feedback.push({ type: 'error', text: 'Cần ít nhất 8 ký tự' });
    }

    if (checks.hasUpper) {
      score += 20;
      feedback.push({ type: 'success', text: 'Có chữ cái viết hoa' });
    } else {
      feedback.push({ type: 'error', text: 'Cần có chữ cái viết hoa' });
    }

    if (checks.hasLower) {
      score += 20;
      feedback.push({ type: 'success', text: 'Có chữ cái viết thường' });
    } else {
      feedback.push({ type: 'error', text: 'Cần có chữ cài viết thường' });
    }

    if (checks.hasNumber) {
      score += 20;
      feedback.push({ type: 'success', text: 'Có số' });
    } else {
      feedback.push({ type: 'error', text: 'Cần có số' });
    }

    if (checks.hasSpecial) {
      score += 20;
      feedback.push({ type: 'success', text: 'Có ký tự đặc biệt' });
    } else {
      feedback.push({ type: 'error', text: 'Cần có ký tự đặc biệt (!@#$%^&*)' });
    }

    return { score, feedback };
  };

  // Hàm tạo mật khẩu gợi ý
  const generatePasswordSuggestion = () => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*';
    
    let password = '';
    
    // Đảm bảo có ít nhất 1 ký tự từ mỗi loại
    password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    password += numberChars[Math.floor(Math.random() * numberChars.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Thêm 4 ký tự ngẫu nhiên nữa để đủ 8 ký tự
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Trộn lại các ký tự
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = (score) => {
    if (score < 40) return '#ff4d4f';
    if (score < 60) return '#faad14';
    if (score < 80) return '#1890ff';
    return '#52c41a';
  };

  const getPasswordStrengthText = (score) => {
    if (score < 40) return 'Yếu';
    if (score < 60) return 'Trung bình';
    if (score < 80) return 'Mạnh';
    return 'Rất mạnh';
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isLogin) {
        // Simulate login API call
        console.log('Login:', values);
        setNotify({ type: 'success', message: 'Đăng nhập thành công!' });
        
        setTimeout(() => {
         window.location.href = '/';
          console.log('Redirect to home');
        }, 1500);
      } else {
        // Simulate register API call
        console.log('Register:', values);
        setNotify({ type: 'success', message: 'Đăng ký thành công, hãy đăng nhập!' });
        setIsLogin(true);
      }
    } catch (error) {
      setNotify({ type: 'error', message: error.message || 'Có lỗi xảy ra!' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setForgotLoading(true);
    try {
      // Simulate forgot password API call
      console.log('Forgot password:', values);
      setNotify({ type: 'success', message: 'Hãy kiểm tra email để đặt lại mật khẩu!' });
      setShowForgot(false);
    } catch (err) {
      setNotify({ type: 'error', message: err.message || 'Có lỗi xảy ra!' });
    } finally {
      setForgotLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setPasswordStrength({ score: 0, feedback: [] });
  };

  const handleSuggestionClick = (suggestedPassword) => {
    // Set the suggested password to the form
    const form = document.querySelector('input[placeholder="Mật khẩu"]');
    if (form) {
      form.value = suggestedPassword;
      // Trigger change event
      const event = new Event('input', { bubbles: true });
      form.dispatchEvent(event);
      handlePasswordChange({ target: { value: suggestedPassword } });
    }
    setShowPasswordSuggestion(false);
  };

  return (
    <>
      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        
        .auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
          animation: backgroundFloat 20s ease-in-out infinite;
          width: 100%;
        }
        
        @keyframes backgroundFloat {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }
        
        .floating-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        .shape {
          position: absolute;
          opacity: 0.1;
          animation: float 6s ease-in-out infinite;
        }
        
        .shape:nth-child(1) {
          top: 10%;
          left: 10%;
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          animation-delay: 0s;
        }
        
        .shape:nth-child(2) {
          top: 20%;
          right: 10%;
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 30%;
          animation-delay: 2s;
        }
        
        .shape:nth-child(3) {
          bottom: 10%;
          left: 20%;
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          animation-delay: 4s;
        }
        
        .shape:nth-child(4) {
          bottom: 30%;
          right: 20%;
          width: 100px;
          height: 100px;
          background: white;
          border-radius: 20%;
          animation-delay: 1s;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 450px;
          padding: 40px;
          position: relative;
          z-index: 1;
          animation: ${mounted ? 'slideInUp' : 'none'} 0.8s ease-out;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .auth-title {
          text-align: center;
          margin-bottom: 32px;
          color: #1a1a1a;
          position: relative;
        }
        
        .auth-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }
        
        .form-container {
          animation: ${mounted ? 'fadeIn' : 'none'} 1s ease-out 0.3s both;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .ant-form-item {
          margin-bottom: 20px;
        }
        
        .ant-input-affix-wrapper, .ant-input {
          border-radius: 12px;
          border: 2px solid #f0f0f0;
          padding: 12px 16px;
          font-size: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ant-input-affix-wrapper:hover, .ant-input:hover {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .ant-input-affix-wrapper:focus, .ant-input:focus,
        .ant-input-affix-wrapper-focused, .ant-input-focused {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
        }
        
        .password-strength-container {
          margin-top: 8px;
          padding: 12px;
          background: #f8f9ff;
          border-radius: 8px;
          border: 1px solid #e6f0ff;
        }
        
        .password-strength-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .password-feedback {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          font-size: 12px;
        }
        
        .feedback-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .feedback-item.success {
          color: #52c41a;
        }
        
        .feedback-item.error {
          color: #ff4d4f;
        }
        
        .password-suggestion-btn {
          margin-top: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .password-suggestion-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .suggested-password {
          margin-top: 8px;
          padding: 8px 12px;
          background: #f0f8ff;
          border: 1px solid #d6e9ff;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .suggested-password:hover {
          background: #e6f4ff;
          border-color: #91d5ff;
        }
        
        .submit-btn {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }
        
        .submit-btn:hover::before {
          left: 100%;
        }
        
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .submit-btn:active {
          transform: translateY(0);
        }
        
        .switch-mode {
          text-align: center;
          margin-top: 24px;
          color: #666;
        }
        
        .switch-link {
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        
        .switch-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .forgot-link {
          color: #667eea;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        
        .forgot-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 12px;
          color: white;
          font-weight: 500;
          z-index: 1000;
          animation: slideInRight 0.5s ease-out;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .notification.success {
          background: linear-gradient(135deg, #48bb78, #38a169);
        }
        
        .notification.error {
          background: linear-gradient(135deg, #f56565, #e53e3e);
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .modal-content {
          border-radius: 16px;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          z-index: 10;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .form-transition {
          animation: slideInLeft 0.5s ease-out;
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      
      <div className="auth-container">
        <div className="floating-shapes">
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        
        {notify && (
          <div className={`notification ${notify.type}`}>
            {notify.message}
          </div>
        )}
        
        <div className="auth-card">
          {(loading || forgotLoading) && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          <Title level={2} className="auth-title">
            {isLogin ? '🌟 Chào mừng trở lại' : '🚀 Tạo tài khoản mới'}
          </Title>
          
          <div className="form-container">
            <div className="form-transition">
              <Form 
                name="auth_form" 
                onFinish={onFinish} 
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                {!isLogin && (
                  <Form.Item 
                    name="name" 
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#667eea' }} />}
                      placeholder="Họ và tên"
                      autoComplete="name"
                    />
                  </Form.Item>
                )}
                
                <Form.Item 
                  name="email" 
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined style={{ color: '#667eea' }} />}
                    placeholder="Email"
                    autoComplete="email"
                  />
                </Form.Item>
                
                <Form.Item 
                  name="password" 
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    !isLogin ? { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' } : { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: '#667eea' }} />}
                    placeholder="Mật khẩu"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    onChange={!isLogin ? handlePasswordChange : undefined}
                  />
                </Form.Item>
                
                {!isLogin && passwordStrength.score > 0 && (
                  <div className="password-strength-container">
                    <div className="password-strength-header">
                      <Text strong style={{ fontSize: '12px' }}>Độ mạnh mật khẩu:</Text>
                      <Text style={{ 
                        color: getPasswordStrengthColor(passwordStrength.score),
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getPasswordStrengthText(passwordStrength.score)}
                      </Text>
                    </div>
                    <Progress 
                      percent={passwordStrength.score} 
                      strokeColor={getPasswordStrengthColor(passwordStrength.score)}
                      showInfo={false}
                      size="small"
                    />
                    <div className="password-feedback">
                      {passwordStrength.feedback.map((item, index) => (
                        <div key={index} className={`feedback-item ${item.type}`}>
                          {item.type === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!isLogin && (
                  <>
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<BulbOutlined />}
                        onClick={() => setShowPasswordSuggestion(!showPasswordSuggestion)}
                      >
                        Gợi ý mật khẩu mạnh
                      </Button>
                    </div>
                    
                    {showPasswordSuggestion && (
                      <div 
                        className="suggested-password"
                        onClick={() => handleSuggestionClick(generatePasswordSuggestion())}
                        title="Click để sử dụng mật khẩu này"
                      >
                        <strong>Mật khẩu gợi ý:</strong> {generatePasswordSuggestion()}
                        <br />
                        <small style={{ color: '#666' }}>Click để sử dụng</small>
                      </div>
                    )}
                  </>
                )}
                
                {!isLogin && (
                  <Form.Item
                    name="password_confirmation"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#667eea' }} />}
                      placeholder="Xác nhận mật khẩu"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      autoComplete="new-password"
                    />
                  </Form.Item>
                )}
                
                {isLogin && (
                  <div style={{ textAlign: 'right', marginBottom: 16 }}>
                    <span className="forgot-link" onClick={() => setShowForgot(true)}>
                      Quên mật khẩu?
                    </span>
                  </div>
                )}
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    className="submit-btn"
                    loading={loading}
                  >
                    {isLogin ? '🔑 Đăng nhập' : '📝 Đăng ký'}
                  </Button>
                </Form.Item>
              </Form>
            </div>
            
            <Divider style={{ margin: '24px 0', borderColor: '#e8e8e8' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>hoặc</Text>
            </Divider>
            
            <div className="switch-mode">
              {isLogin ? (
                <Text>
                  Bạn chưa có tài khoản?{' '}
                  <span className="switch-link" onClick={switchMode}>
                    Đăng ký ngay
                  </span>
                </Text>
              ) : (
                <Text>
                  Đã có tài khoản?{' '}
                  <span className="switch-link" onClick={switchMode}>
                    Đăng nhập
                  </span>
                </Text>
              )}
            </div>
          </div>
        </div>
        
        <Modal
          title="🔐 Khôi phục mật khẩu"
          open={showForgot}
          onCancel={() => setShowForgot(false)}
          footer={null}
          centered
          className="modal-content"
        >
          <Form layout="vertical" onFinish={handleForgotPassword} size="large">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#667eea' }} />}
                placeholder="Nhập email của bạn"
                autoComplete="email"
              />
            </Form.Item>
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                className="submit-btn"
                loading={forgotLoading}
              >
                📧 Gửi yêu cầu đặt lại
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}