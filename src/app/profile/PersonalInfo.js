'use client';

import {
    CalendarOutlined,
    CheckCircleFilled,
    EditOutlined,
    ExclamationCircleFilled,
    UserOutlined,
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Card,
    Col,
    DatePicker,
    Divider,
    Form,
    Input,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    message,
} from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

const PHONE_REGEX = /^(0?)(3[2-9]|5[689]|7[06-9]|8[1-5]|9[0-9])[0-9]{7}$/;

export default function PersonalInfo({ user, token, mutateUser }) {
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);

    const fileRef = useRef(null);
    const handlePickFile = () => fileRef.current?.click();

    const initialDOB = useMemo(() => {
        if (!user?.date_of_birth) return null;
        const parsed = dayjs(user.date_of_birth, ['YYYY-MM-DD', 'DD/MM/YYYY'], true).isValid()
            ? dayjs(user.date_of_birth)
            : null;
        return parsed;
    }, [user?.date_of_birth]);

    // Check verify status
    const isEmailVerified = useMemo(() => {
        return user?.email_verified_at != null;
    }, [user?.email_verified_at]);

    const genderOptions = [
        { value: 'male', label: 'Nam' },
        { value: 'female', label: 'Nữ' },
        { value: 'other', label: 'Khác' },
        { value: 'unknown', label: 'Không rõ' },
    ];

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.error('File phải là ảnh.');
            e.target.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            message.error('Ảnh tối đa 10MB.');
            e.target.value = '';
            return;
        }
        setAvatarFile(file);
        message.success('Đã chọn ảnh. Nhấn "Cập nhật" để lưu.');
        e.target.value = '';
    };

    const normalizeDOB = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            const parsed = dayjs(val, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
            return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
        }
        return dayjs(val).format('YYYY-MM-DD');
    };

    const handleFinish = async (values) => {
        const payload = {
            name: values.name?.trim(),
            phone: values.phone?.trim() || null,
            date_of_birth: normalizeDOB(values.date_of_birth) || null,
            gender: values.gender || null,
        };

        if (!payload.name) {
            form.setFields([{ name: 'name', errors: ['Vui lòng nhập tên.'] }]);
            return;
        }
        if (payload.phone && !PHONE_REGEX.test(payload.phone)) {
            form.setFields([{ name: 'phone', errors: ['Số điện thoại không hợp lệ.'] }]);
            return;
        }
        if (values.date_of_birth && !payload.date_of_birth) {
            form.setFields([
                { name: 'date_of_birth', errors: ['Ngày sinh không hợp lệ. Dùng DD/MM/YYYY hoặc YYYY-MM-DD.'] },
            ]);
            return;
        }

        setSubmitting(true);
        try {
            let res;
            if (avatarFile) {
                const fd = new FormData();
                Object.entries(payload).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') fd.append(k, v);
                });
                fd.append('avatar', avatarFile);

                res = await fetch('http://localhost:8000/api/user/profile', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                    body: fd,
                });
            } else {
                res = await fetch('http://localhost:8000/api/user/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 422 && data?.errors) {
                    const fields = Object.entries(data.errors).map(([name, msgs]) => ({
                        name,
                        errors: Array.isArray(msgs) ? msgs : [String(msgs)],
                    }));
                    form.setFields(fields);
                }
                throw new Error(data?.message || 'Cập nhật thất bại.');
            }

            message.success('Cập nhật thông tin thành công.');
            toast.success('Cập nhật thông tin thành công.');
            setEditing(false);
            setAvatarFile(null);

            // ✅ QUAN TRỌNG: Refresh dữ liệu user để cập nhật header và sidebar
            if (mutateUser) {
                try {
                    await mutateUser(); // Refresh user data
                    console.log('✅ User data refreshed successfully');
                } catch (mutateError) {
                    console.error('❌ Error refreshing user data:', mutateError);
                }
            }

            // Update form với dữ liệu mới trả về từ API
            if (data?.user) {
                form.setFieldsValue({
                    name: data.user.name ?? undefined,
                    phone: data.user.phone ?? undefined,
                    date_of_birth: data.user.date_of_birth ? dayjs(data.user.date_of_birth) : null,
                    gender: data.user.gender ?? undefined,
                });
            }

            // ✅ THÊM: Trigger event để Header component cũng refresh cart count và user info
            if (typeof window !== 'undefined') {
                // Dispatch custom event để thông báo user data đã thay đổi
                window.dispatchEvent(
                    new CustomEvent('userDataUpdated', {
                        detail: { user: data?.user || user },
                    }),
                );

                // Nếu có function updateCartCount global, gọi nó
                if (window.updateCartCount) {
                    window.updateCartCount();
                }
            }
        } catch (err) {
            console.error('Update profile error:', err);
            message.error(err.message || 'Có lỗi xảy ra.');
            toast.error(err.message || 'Có lỗi xảy ra.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Header top: title + avatar (chỉ hiển thị khi editing) */}
            <div className="top-header">
                <Title level={2} className="page-title">
                    Quản lý thông tin
                </Title>
                {/* Chỉ hiển thị phần avatar khi đang editing */}
                {editing && (
                    <div className="avatar-top">
                        <Avatar
                            size={72}
                            src={
                                avatarFile
                                    ? URL.createObjectURL(avatarFile)
                                    : user?.avatar_url || user?.avatar || undefined
                            }
                            icon={<UserOutlined />}
                            className="avatar"
                        />
                        <div className="avatar-edit-section">
                            <button
                                type="button"
                                className="avatar-edit"
                                title="Thay ảnh"
                                aria-label="Thay ảnh"
                                onClick={handlePickFile}
                            >
                                <EditOutlined />
                            </button>
                            <span className="avatar-edit-text">Thêm ảnh avatar</span>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
                        </div>
                    </div>
                )}
            </div>

            <div className="tabs">
                <button className="tab active">Thông tin cá nhân</button>
            </div>

            <Card className="panel">
                <div className="meta">
                    <Space size={8}>
                        <CalendarOutlined />
                        <Text type="secondary">
                            Thành viên từ{' '}
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}
                        </Text>
                    </Space>
                </div>

                <Divider className="divider" />
                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{
                        name: user?.name ?? '',
                        phone: user?.phone ?? '',
                        gender: user?.gender ?? 'unknown',
                        date_of_birth: initialDOB,
                    }}
                    onFinish={handleFinish}
                >
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Email đăng nhập">
                                <Input
                                    className="field"
                                    value={user?.email || ''}
                                    readOnly
                                    disabled
                                    suffix={
                                        <Tag
                                            icon={isEmailVerified ? <CheckCircleFilled /> : <ExclamationCircleFilled />}
                                            color={isEmailVerified ? 'success' : 'warning'}
                                            style={{ margin: 0, borderRadius: '6px', fontSize: '11px' }}
                                        >
                                            {isEmailVerified ? 'Verified' : 'Verify'}
                                        </Tag>
                                    }
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="name"
                                label="Họ và tên"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên.' },
                                    { max: 100, message: 'Tên không vượt quá 100 ký tự.' },
                                ]}
                            >
                                <Input className="field" placeholder="Nhập họ và tên" disabled={!editing} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[
                                    {
                                        validator: (_, v) => {
                                            if (!v) return Promise.resolve();
                                            return PHONE_REGEX.test(v)
                                                ? Promise.resolve()
                                                : Promise.reject(new Error('Số điện thoại không hợp lệ.'));
                                        },
                                    },
                                ]}
                            >
                                <Input
                                    className="field"
                                    placeholder="Nhập số điện thoại"
                                    disabled={!editing}
                                    maxLength={11}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="date_of_birth"
                                label="Ngày sinh"
                                tooltip="Có thể chọn lịch hoặc gõ DD/MM/YYYY hoặc YYYY-MM-DD"
                                rules={[
                                    {
                                        validator: (_, v) => {
                                            if (!v) return Promise.resolve();
                                            if (dayjs.isDayjs(v)) return Promise.resolve();
                                            const ok = dayjs(String(v), ['DD/MM/YYYY', 'YYYY-MM-DD'], true).isValid();
                                            return ok
                                                ? Promise.resolve()
                                                : Promise.reject(new Error('Ngày sinh không hợp lệ.'));
                                        },
                                    },
                                ]}
                            >
                                <DatePicker
                                    className="field"
                                    style={{ width: '100%' }}
                                    disabled={!editing}
                                    format="DD/MM/YYYY"
                                    inputReadOnly={false}
                                    allowClear
                                    onChange={(date, dateString) => {
                                        if (!date && dateString) {
                                            const parsed = dayjs(dateString, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
                                            form.setFieldsValue({
                                                date_of_birth: parsed.isValid() ? parsed : null,
                                            });
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item name="gender" label="Giới tính">
                                <Select
                                    className="field"
                                    disabled={!editing}
                                    options={genderOptions}
                                    showSearch
                                    optionFilterProp="label"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="actions">
                        {editing ? (
                            <>
                                <Button
                                    size="large"
                                    onClick={() => {
                                        setEditing(false);
                                        setAvatarFile(null);
                                        form.resetFields();
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    style={{ backgroundColor: 'hsl(0, 0%, 0%)', color: 'hsl(0, 0%, 100%)' }}
                                    size="large"
                                    icon={<EditOutlined />}
                                    loading={submitting}
                                    htmlType="submit"
                                >
                                    Cập nhật
                                </Button>
                            </>
                        ) : (
                            <Button
                                style={{ backgroundColor: 'hsl(0, 0%, 0%)', color: 'hsl(0, 0%, 100%)' }}
                                size="large"
                                icon={<EditOutlined />}
                                onClick={() => setEditing(true)}
                            >
                                Chỉnh sửa thông tin
                            </Button>
                        )}
                    </div>
                </Form>
            </Card>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />

            <style jsx>{`
                :root {
                    --ink: #111;
                    --muted: #6f6f6f;
                    --line: #e9e9e9;
                    --card: #fff;
                    --radius: 14px;
                    --primary: #1890ff;
                    --success: #52c41a;
                    --warning: #faad14;
                }

                .top-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin: 40px 24px 14px 24px;
                    min-height: 72px;
                }
                .page-title {
                    margin: 0;
                    font-weight: 800;
                }

                .avatar-top {
                    position: relative;
                    width: 150px;
                    height: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .avatar-edit-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 8px;
                }

                .avatar-edit {
                    position: absolute;
                    right: -6px;
                    bottom: -6px;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: #111;
                    color: #fff;
                    border: 1px solid #fff;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    transition: transform 0.12s ease, opacity 0.12s ease;
                }
                .avatar-edit:hover {
                    transform: translateY(-1px);
                    opacity: 0.95;
                }

                .avatar-edit-text {
                    font-size: 12px;
                    color: var(--muted);
                    margin-top: 4px;
                    text-align: center;
                    white-space: nowrap;
                }

                .tabs {
                    display: flex;
                    gap: 8px;
                    border-bottom: 1px solid var(--line);
                    margin: 0 24px 18px 24px;
                }
                .tab {
                    background: transparent;
                    border: 0;
                    color: var(--muted);
                    padding: 10px 14px;
                    font-weight: 600;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                }
                .tab.active {
                    color: var(--ink);
                    border-bottom: 2px solid var(--ink);
                }
                .tab:hover {
                    color: var(--primary);
                }

                .panel {
                    background: var(--card);
                    border: 1px solid var(--line);
                    border-radius: var(--radius);
                    padding-top: 12px;
                    margin: 0 24px;
                    max-width: 980px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }
                .divider {
                    margin: 12px 0;
                }

                /* Enhanced input styling */
                :global(.field.ant-input),
                :global(.field.ant-picker),
                :global(.field.ant-select .ant-select-selector) {
                    background: #fafafa !important;
                    border: 1.5px solid #e8e8e8 !important;
                    border-radius: 10px !important;
                    height: 48px !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
                }

                :global(.field.ant-input:hover),
                :global(.field.ant-picker:hover),
                :global(.field.ant-select:hover .ant-select-selector) {
                    border-color: var(--primary) !important;
                    background: white !important;
                    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1) !important;
                }

                :global(.field.ant-input:focus),
                :global(.field.ant-picker:focus),
                :global(.field.ant-select-focused .ant-select-selector) {
                    background: white !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12) !important;
                    outline: none !important;
                }

                :global(.field.ant-input:disabled),
                :global(.field.ant-picker.ant-picker-disabled),
                :global(.field.ant-select-disabled .ant-select-selector) {
                    background: #f0f0f0 !important;
                    color: #999 !important;
                    border-color: #e0e0e0 !important;
                    cursor: not-allowed !important;
                    box-shadow: none !important;
                }

                /* Select dropdown styling */
                :global(.field.ant-select .ant-select-arrow) {
                    color: var(--muted) !important;
                    transition: color 0.2s ease !important;
                }

                :global(.field.ant-select:hover .ant-select-arrow) {
                    color: var(--primary) !important;
                }

                /* DatePicker specific styling */
                :global(.field.ant-picker-suffix) {
                    color: var(--muted) !important;
                    transition: color 0.2s ease !important;
                }

                :global(.field.ant-picker:hover .ant-picker-suffix) {
                    color: var(--primary) !important;
                }

                /* Input placeholder styling */
                :global(.field.ant-input::placeholder) {
                    color: #bbb !important;
                    font-weight: 400 !important;
                }

                /* Form label styling */
                :global(.ant-form-item-label > label) {
                    font-weight: 600 !important;
                    color: var(--ink) !important;
                    font-size: 14px !important;
                }

                /* Verify tag in input */
                :global(.ant-tag) {
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .actions {
                    margin-top: 18px;
                    display: flex;
                    gap: 10px;
                }

                /* Button styling */
                :global(.ant-btn) {
                    border-radius: 8px !important;
                    font-weight: 600 !important;
                    transition: all 0.2s ease !important;
                }

                :global(.ant-btn-primary) {
                    background: var(--primary) !important;
                    border-color: var(--primary) !important;
                    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3) !important;
                }

                :global(.ant-btn-primary:hover) {
                    background: #40a9ff !important;
                    border-color: #40a9ff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4) !important;
                }

                :global(.ant-btn-default:hover) {
                    border-color: var(--primary) !important;
                    color: var(--primary) !important;
                }

                /* Error message styling */
                :global(.ant-form-item-explain-error) {
                    font-size: 12px !important;
                    color: #ff4d4f !important;
                    font-weight: 500 !important;
                }

                /* Success state for verified items */
                :global(.ant-tag-success) {
                    background: rgba(82, 196, 26, 0.1) !important;
                    border-color: var(--success) !important;
                    color: var(--success) !important;
                }

                /* Warning state for unverified items */
                :global(.ant-tag-warning) {
                    background: rgba(250, 173, 20, 0.1) !important;
                    border-color: var(--warning) !important;
                    color: var(--warning) !important;
                }
            `}</style>
        </>
    );
}
