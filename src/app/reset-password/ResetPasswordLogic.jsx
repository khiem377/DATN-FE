'use client';

import { CheckCircleOutlined, EyeInvisibleOutlined, EyeTwoTone, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, Form, Input, Progress, Typography } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiResetPassword } from '../../../apis/user';

const { Title, Text } = Typography;

export default function ResetPasswordLogic() {
    const [notify, setNotify] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [form] = Form.useForm();

    const searchParams = useSearchParams();
    const router = useRouter();

    const email = searchParams.get('email');
    const token = searchParams.get('token');

    useEffect(() => {
        setMounted(true);
        if (notify) {
            const timer = setTimeout(() => setNotify(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notify]);

    const calculatePasswordStrength = (password) => {
        if (!password) return 0;

        let strength = 0;
        const checks = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
        ];

        strength = (checks.filter((check) => check).length / checks.length) * 100;
        return Math.round(strength);
    };

    const getPasswordStrengthColor = (strength) => {
        if (strength < 30) return '#ff4d4f';
        if (strength < 60) return '#faad14';
        if (strength < 80) return '#1890ff';
        return '#52c41a';
    };

    const getPasswordStrengthText = (strength) => {
        if (strength < 30) return 'Yếu';
        if (strength < 60) return 'Trung bình';
        if (strength < 80) return 'Khá';
        return 'Mạnh';
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const res = await apiResetPassword({
                email,
                token,
                password: values.password,
                password_confirmation: values.password_confirmation,
            });

            setNotify({ type: 'success', message: res.message || 'Đặt lại mật khẩu thành công!' });

            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (err) {
            setNotify({ type: 'error', message: err.message || 'Có lỗi xảy ra, vui lòng thử lại!' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        const strength = calculatePasswordStrength(password);
        setPasswordStrength(strength);
    };

    return (
        <>
            <style jsx>{`
                .reset-container {
                    width: 100%;
                    height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                    box-sizing: border-box;
                }

                .reset-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.4) 0%, transparent 50%);
                    animation: backgroundPulse 15s ease-in-out infinite;
                }

                @keyframes backgroundPulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scale(1.05);
                        opacity: 1;
                    }
                }

                .floating-elements {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    pointer-events: none;
                }

                .floating-element {
                    position: absolute;
                    opacity: 0.1;
                    animation: float 8s ease-in-out infinite;
                }

                .floating-element:nth-child(1) {
                    top: 15%;
                    left: 15%;
                    width: 60px;
                    height: 60px;
                    background: white;
                    border-radius: 50%;
                    animation-delay: 0s;
                }

                .floating-element:nth-child(2) {
                    top: 70%;
                    right: 20%;
                    width: 80px;
                    height: 80px;
                    background: white;
                    border-radius: 20%;
                    animation-delay: 3s;
                }

                .floating-element:nth-child(3) {
                    bottom: 20%;
                    left: 10%;
                    width: 40px;
                    height: 40px;
                    background: white;
                    border-radius: 50%;
                    animation-delay: 6s;
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-15px) rotate(180deg);
                    }
                }

                .reset-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    width: 100%;
                    max-width: 450px;
                    padding: 40px;
                    position: relative;
                    z-index: 1;
                    animation: ${mounted ? 'slideInUp' : 'none'} 0.8s ease-out;
                    box-sizing: border-box;
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

                .reset-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .reset-icon {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    animation: ${mounted ? 'iconPulse' : 'none'} 2s ease-in-out infinite;
                }

                @keyframes iconPulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                .reset-title {
                    color: #1a1a1a;
                    margin-bottom: 8px;
                    position: relative;
                }

                .reset-title::after {
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

                .reset-subtitle {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .form-container {
                    animation: ${mounted ? 'fadeIn' : 'none'} 1s ease-out 0.3s both;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .ant-form-item {
                    margin-bottom: 24px;
                }

                .ant-input-affix-wrapper,
                .ant-input {
                    border-radius: 12px;
                    border: 2px solid #f0f0f0;
                    padding: 14px 16px;
                    font-size: 16px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: rgba(255, 255, 255, 0.8);
                }

                .ant-input-affix-wrapper:hover,
                .ant-input:hover {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    background: rgba(255, 255, 255, 0.95);
                }

                .ant-input-affix-wrapper:focus,
                .ant-input:focus,
                .ant-input-affix-wrapper-focused,
                .ant-input-focused {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
                    background: white;
                }

                .password-strength {
                    margin-top: 8px;
                    padding: 12px;
                    background: rgba(248, 250, 252, 0.8);
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }

                .strength-meter {
                    margin-bottom: 8px;
                }

                .strength-text {
                    font-size: 12px;
                    font-weight: 600;
                    text-align: center;
                }

                .password-requirements {
                    margin-top: 12px;
                }

                .requirement-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 4px;
                    font-size: 12px;
                    color: #64748b;
                }

                .requirement-icon {
                    margin-right: 6px;
                    font-size: 10px;
                }

                .requirement-met {
                    color: #059669;
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
                    margin-top: 24px;
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
                    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
                }

                .submit-btn:active {
                    transform: translateY(0);
                }

                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .submit-btn:disabled:hover {
                    transform: none;
                    box-shadow: none;
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
                    max-width: 400px;
                }

                .notification.success {
                    background: linear-gradient(135deg, #48bb78, #38a169);
                }

                .notification.error {
                    background: linear-gradient(135deg, #f56565, #e53e3e);
                }

                .notification.info {
                    background: linear-gradient(135deg, #4299e1, #3182ce);
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

                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
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
                    margin-bottom: 16px;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .security-tips {
                    margin-top: 24px;
                    padding: 16px;
                    background: rgba(239, 246, 255, 0.8);
                    border-radius: 12px;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }

                .security-tip {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 8px;
                    font-size: 13px;
                    color: #1e40af;
                }

                .security-tip:last-child {
                    margin-bottom: 0;
                }

                .tip-icon {
                    margin-right: 8px;
                    margin-top: 2px;
                    color: #3b82f6;
                }

                @media (max-width: 768px) {
                    .reset-container {
                        padding: 10px;
                    }

                    .reset-card {
                        padding: 30px 20px;
                        max-width: 100%;
                        margin: 0 10px;
                    }
                }
            `}</style>

            <div className="reset-container">
                <div className="floating-elements">
                    <div className="floating-element"></div>
                    <div className="floating-element"></div>
                    <div className="floating-element"></div>
                </div>

                {notify && <div className={`notification ${notify.type}`}>{notify.message}</div>}

                <div className="reset-card">
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <Text style={{ color: '#667eea', fontWeight: 500 }}>Đang đặt lại mật khẩu...</Text>
                        </div>
                    )}

                    <div className="reset-header">
                        <div className="reset-icon">
                            <SafetyOutlined style={{ fontSize: '36px', color: 'white' }} />
                        </div>
                        <Title level={2} className="reset-title">
                            Đặt lại mật khẩu
                        </Title>
                        <Text className="reset-subtitle">Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản của bạn</Text>
                    </div>

                    <div className="form-container">
                        <Form form={form} layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
                            <Form.Item
                                name="password"
                                label="Mật khẩu mới"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: '#667eea' }} />}
                                    placeholder="Nhập mật khẩu mới"
                                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                    onChange={handlePasswordChange}
                                    autoComplete="new-password"
                                />
                            </Form.Item>

                            {passwordStrength > 0 && (
                                <div className="password-strength">
                                    <div className="strength-meter">
                                        <Progress
                                            percent={passwordStrength}
                                            strokeColor={getPasswordStrengthColor(passwordStrength)}
                                            showInfo={false}
                                            size="small"
                                        />
                                    </div>
                                    <div
                                        className="strength-text"
                                        style={{ color: getPasswordStrengthColor(passwordStrength) }}
                                    >
                                        Độ mạnh: {getPasswordStrengthText(passwordStrength)}
                                    </div>
                                </div>
                            )}

                            <Form.Item
                                name="password_confirmation"
                                label="Xác nhận mật khẩu"
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
                                    placeholder="Xác nhận lại mật khẩu"
                                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                    autoComplete="new-password"
                                />
                            </Form.Item>

                            <div className="password-requirements">
                                <Text strong style={{ fontSize: '14px', color: '#374151' }}>
                                    Yêu cầu mật khẩu:
                                </Text>
                                <div className="requirement-item">
                                    <CheckCircleOutlined className="requirement-icon" />
                                    <span>Ít nhất 8 ký tự</span>
                                </div>
                                <div className="requirement-item">
                                    <CheckCircleOutlined className="requirement-icon" />
                                    <span>Bao gồm chữ hoa và chữ thường</span>
                                </div>
                                <div className="requirement-item">
                                    <CheckCircleOutlined className="requirement-icon" />
                                    <span>Chứa ít nhất 1 số</span>
                                </div>
                                <div className="requirement-item">
                                    <CheckCircleOutlined className="requirement-icon" />
                                    <span>Có ký tự đặc biệt (!@#$%^&*)</span>
                                </div>
                            </div>

                            <Button
                                type="primary"
                                htmlType="submit"
                                className="submit-btn"
                                loading={loading}
                                disabled={loading}
                            >
                                🔐 Đặt lại mật khẩu
                            </Button>
                        </Form>

                        <div className="security-tips">
                            <div className="security-tip">
                                <SafetyOutlined className="tip-icon" />
                                <span>Sử dụng mật khẩu độc đáo, không dùng lại ở tài khoản khác</span>
                            </div>
                            <div className="security-tip">
                                <SafetyOutlined className="tip-icon" />
                                <span>Kết hợp chữ cái, số và ký tự đặc biệt</span>
                            </div>
                            <div className="security-tip">
                                <SafetyOutlined className="tip-icon" />
                                <span>Tránh sử dụng thông tin cá nhân dễ đoán</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}