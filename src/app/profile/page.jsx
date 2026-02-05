// pages/ProfilePage.js - Updated với mutate từ useAuth
'use client';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, Row, Typography } from 'antd';
import { useState } from 'react';

// Import Hooks
import { useAuth } from '../hooks/useAuth';

// Import Components
import FavoriteBooks from './FavoriteBooks/FavoriteBooks';
import ProfileSidebar from './Layout/ProfileSidebar';
import OrderHistory from './OrderHistory/OrderHistory';
import PersonalInfo from './PersonalInfo';

// Import Styles
import { toast } from 'react-toastify';
import './style.css';

const { Title, Text, Paragraph } = Typography;

// Change Password Component - Giao diện đơn giản tone trắng đen
const ChangePassword = ({ token }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');

    // Kiểm tra độ mạnh mật khẩu
    const checkPasswordStrength = (password) => {
        if (!password) return '';

        let score = 0;
        let feedback = [];

        if (password.length >= 8) score++;
        else feedback.push('Ít nhất 8 ký tự');

        if (/[a-z]/.test(password)) score++;
        else feedback.push('Có chữ thường');

        if (/[A-Z]/.test(password)) score++;
        else feedback.push('Có chữ hoa');

        if (/[0-9]/.test(password)) score++;
        else feedback.push('Có số');

        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback.push('Có ký tự đặc biệt');

        if (score <= 2) return { level: 'weak', text: 'Yếu', color: '#999', feedback };
        if (score <= 3) return { level: 'medium', text: 'Trung bình', color: '#666', feedback };
        if (score <= 4) return { level: 'good', text: 'Tốt', color: '#333', feedback };
        return { level: 'strong', text: 'Rất mạnh', color: '#000', feedback: [] };
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;
        setPasswordStrength(checkPasswordStrength(password));
    };

    const onFinish = async (values) => {
        setLoading(true);
        const token = localStorage?.getItem('token');

        try {
            const response = await fetch('http://localhost:8000/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    current_password: values.currentPassword,
                    new_password: values.newPassword,
                    new_password_confirmation: values.newPassword,
                }),
            });

            const data = await response.json();
            console.log('data', data);

            if (data.success) {
                toast.success('Đổi mật khẩu thành công!');
                form.resetFields();
                setPasswordStrength('');
            } else {
                toast.error(data.message || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    const validateConfirmPassword = ({ getFieldValue }) => ({
        validator(_, value) {
            if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
            }
            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
        },
    });

    return (
        <div
            style={{
                padding: '0',
                background: '#fff',
                minHeight: 'calc(100vh - 64px)',
            }}
        >
            {/* Header đơn giản */}
            <div
                style={{
                    borderBottom: '1px solid #e5e5e5',
                    padding: '24px 32px',
                    background: '#fff',
                }}
            >
                <Title
                    level={3}
                    style={{
                        margin: 0,
                        color: '#000',
                        fontWeight: '600',
                    }}
                >
                    Đổi mật khẩu
                </Title>
                <Text
                    style={{
                        fontSize: '14px',
                        color: '#666',
                        marginTop: '4px',
                        display: 'block',
                    }}
                >
                    Thay đổi mật khẩu để bảo vệ tài khoản của bạn
                </Text>
            </div>

            {/* Content */}
            <div style={{ padding: '32px' }}>
                <Row gutter={[32, 32]}>
                    {/* Form đổi mật khẩu */}
                    <Col xs={24} lg={16}>
                        <Card
                            style={{
                                border: '1px solid #e5e5e5',
                                borderRadius: '8px',
                                boxShadow: 'none',
                            }}
                            bodyStyle={{ padding: '32px' }}
                        >
                            <div style={{ marginBottom: '32px' }}>
                                <Title
                                    level={4}
                                    style={{
                                        margin: 0,
                                        color: '#000',
                                        fontWeight: '500',
                                    }}
                                >
                                    Thông tin mật khẩu
                                </Title>
                                <Text
                                    style={{
                                        color: '#666',
                                        fontSize: '14px',
                                        marginTop: '8px',
                                        display: 'block',
                                    }}
                                >
                                    Nhập mật khẩu hiện tại và mật khẩu mới
                                </Text>
                            </div>

                            <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
                                {/* Mật khẩu hiện tại */}
                                <Form.Item
                                    name="currentPassword"
                                    label={<span style={{ color: '#000', fontWeight: '500' }}>Mật khẩu hiện tại</span>}
                                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                                    style={{ marginBottom: '24px' }}
                                >
                                    <Input.Password
                                        placeholder="Nhập mật khẩu hiện tại"
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        style={{
                                            borderRadius: '6px',
                                            border: '1px solid #d9d9d9',
                                        }}
                                    />
                                </Form.Item>

                                <Divider style={{ margin: '32px 0', borderColor: '#f0f0f0' }} />

                                {/* Mật khẩu mới */}
                                <Form.Item
                                    name="newPassword"
                                    label={<span style={{ color: '#000', fontWeight: '500' }}>Mật khẩu mới</span>}
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                        { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                                    ]}
                                    style={{ marginBottom: '16px' }}
                                >
                                    <Input.Password
                                        placeholder="Nhập mật khẩu mới"
                                        onChange={handlePasswordChange}
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        style={{
                                            borderRadius: '6px',
                                            border: '1px solid #d9d9d9',
                                        }}
                                    />
                                </Form.Item>

                                {/* Độ mạnh mật khẩu */}
                                {passwordStrength && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    marginRight: '8px',
                                                    fontSize: '14px',
                                                    color: '#666',
                                                }}
                                            >
                                                Độ mạnh:
                                            </Text>
                                            <Text
                                                style={{
                                                    color: passwordStrength.color,
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {passwordStrength.text}
                                            </Text>
                                        </div>

                                        <div
                                            style={{
                                                height: '6px',
                                                background: '#f5f5f5',
                                                borderRadius: '3px',
                                                overflow: 'hidden',
                                                border: '1px solid #e8e8e8',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    background: passwordStrength.color,
                                                    width:
                                                        passwordStrength.level === 'weak'
                                                            ? '25%'
                                                            : passwordStrength.level === 'medium'
                                                            ? '50%'
                                                            : passwordStrength.level === 'good'
                                                            ? '75%'
                                                            : '100%',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            />
                                        </div>

                                        {passwordStrength.feedback.length > 0 && (
                                            <Text
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    marginTop: '6px',
                                                    display: 'block',
                                                }}
                                            >
                                                Cần: {passwordStrength.feedback.join(', ')}
                                            </Text>
                                        )}
                                    </div>
                                )}

                                {/* Xác nhận mật khẩu */}
                                <Form.Item
                                    name="confirmPassword"
                                    label={
                                        <span style={{ color: '#000', fontWeight: '500' }}>Xác nhận mật khẩu mới</span>
                                    }
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                                        validateConfirmPassword,
                                    ]}
                                    style={{ marginBottom: '32px' }}
                                >
                                    <Input.Password
                                        placeholder="Nhập lại mật khẩu mới"
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        style={{
                                            borderRadius: '6px',
                                            border: '1px solid #d9d9d9',
                                        }}
                                    />
                                </Form.Item>

                                {/* Submit Button */}
                                <Form.Item style={{ marginBottom: 0 }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        size="large"
                                        style={{
                                            background: '#000',
                                            borderColor: '#000',
                                            borderRadius: '6px',
                                            height: '44px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            minWidth: '140px',
                                        }}
                                    >
                                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>

                    {/* Security Tips - đơn giản hóa */}
                    <Col xs={24} lg={8}>
                        <Card
                            style={{
                                border: '1px solid #e5e5e5',
                                borderRadius: '8px',
                                boxShadow: 'none',
                                background: '#fafafa',
                            }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <Title
                                level={5}
                                style={{
                                    color: '#000',
                                    marginBottom: '16px',
                                    fontWeight: '500',
                                }}
                            >
                                Lời khuyên bảo mật
                            </Title>

                            <div style={{ marginBottom: '20px' }}>
                                <Text
                                    style={{
                                        color: '#000',
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Mật khẩu mạnh cần có:
                                </Text>
                                <ul
                                    style={{
                                        margin: '0',
                                        paddingLeft: '16px',
                                        color: '#666',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    <li>Ít nhất 8 ký tự</li>
                                    <li>Chữ hoa và chữ thường</li>
                                    <li>Số và ký tự đặc biệt</li>
                                    <li>Không sử dụng thông tin cá nhân</li>
                                </ul>
                            </div>

                            <div>
                                <Text
                                    style={{
                                        color: '#000',
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        display: 'block',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Để bảo mật tối đa:
                                </Text>
                                <ul
                                    style={{
                                        margin: '0',
                                        paddingLeft: '16px',
                                        color: '#666',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                    }}
                                >
                                    <li>Thay đổi mật khẩu định kỳ</li>
                                    <li>Không chia sẻ mật khẩu</li>
                                    <li>Sử dụng mật khẩu khác nhau</li>
                                    <li>Kích hoạt xác thực 2 bước</li>
                                </ul>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

// Profile Page Component
const ProfilePage = () => {
    const [selectedKey, setSelectedKey] = useState('personal');
    const { user, loading: userLoading, token, mutate } = useAuth();

    const handleMenuSelect = (key) => {
        setSelectedKey(key);
    };

    const renderContent = () => {
        switch (selectedKey) {
            case 'personal':
                return <PersonalInfo user={user} token={token} mutateUser={mutate} />;
            case 'favorites':
                return <FavoriteBooks token={token} enabled={selectedKey === 'favorites'} />;
            case 'history1':
                return <OrderHistory token={token} enabled={selectedKey === 'history1'} />;
            case 'change-password':
                return <ChangePassword token={token} />;
            default:
                return <PersonalInfo user={user} token={token} mutateUser={mutate} />;
        }
    };

    if (userLoading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#fff',
                }}
            >
                <div
                    style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #000',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }}
                />
                <div style={{ fontSize: '14px', color: '#666' }}>Đang tải...</div>
                <style jsx>{`
                    @keyframes spin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        );
    }

    const userData = {
        name: user?.name || 'Người dùng',
        avatar: user?.avatar_url || user?.avatar,
    };

    return (
        <ProfileSidebar user={userData} selectedKey={selectedKey} onMenuSelect={handleMenuSelect}>
            {renderContent()}
        </ProfileSidebar>
    );
};

export default ProfilePage;
