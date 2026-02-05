'use client';

import { ClockCircleOutlined, DownloadOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    message,
    Radio,
    Row,
    Select,
    Spin,
    Tag,
    Typography,
} from 'antd';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apiGetDistricts, apiGetProvinces, apiGetShippingFee, apiGetWardsByDistrict } from '../../../apis/ghtk';
import { apiSendOtp } from '../../../apis/user';
import './CheckoutPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

export default function GroupCheckoutPageContent({ urlToken }) {
    const [form] = Form.useForm();
    const router = useRouter();
    const searchParams = useSearchParams();

    // === chọn chế độ checkout + cổng chia tiền
    const [checkoutMode, setCheckoutMode] = useState('full'); // 'full' | 'split'
    const [splitGateway, setSplitGateway] = useState('momo'); // 'momo' | 'vnpay'
    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'credit_card' (ZaloPay)

    // Group order
    const [groupOrderData, setGroupOrderData] = useState(null);
    const [groupToken, setGroupToken] = useState('');

    // Address
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingService, setShippingService] = useState('Chưa xác định');

    // Loading
    const [isLoadingShippingFee, setIsLoadingShippingFee] = useState(false);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Token
    useEffect(() => {
        try {
            const fromQuery = searchParams?.get('token');
            const token = urlToken || fromQuery || localStorage.getItem('group_cart_token');
            if (token) {
                setGroupToken(token);
                localStorage.setItem('group_cart_token', token);
                fetchGroupOrderData(token);
            } else {
                message.error('Không tìm thấy thông tin giỏ hàng nhóm');
                router.push('/');
            }
        } catch (e) {
            console.error('get token error', e);
            router.push('/');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlToken]);

    // Fetch group
    const fetchGroupOrderData = async (token) => {
        try {
            const res = await axios.get(`http://localhost:8000/api/group-orders/${token}`);
            setGroupOrderData(res.data);
        } catch (err) {
            console.error('fetch group error:', err);
            message.error('Không thể tải thông tin giỏ hàng nhóm');
        }
    };

    // Totals
    const calculateGroupTotal = () => {
        if (!groupOrderData?.by_member) return 0;
        return Object.values(groupOrderData.by_member).reduce((t, m) => t + (m.subtotal || 0), 0);
    };
    const subtotal = calculateGroupTotal();
    const totalWithShipping = subtotal + (shippingFee || 0);

    // Load address data
    useEffect(() => {
        loadProvinces();
    }, []);
    const loadProvinces = async () => {
        setIsLoadingProvinces(true);
        try {
            const data = await apiGetProvinces();
            setProvinces(data || []);
        } catch {
            message.error('Không thể tải danh sách tỉnh/thành phố');
        } finally {
            setIsLoadingProvinces(false);
        }
    };

    useEffect(() => {
        if (selectedProvince) {
            (async () => {
                setIsLoadingDistricts(true);
                try {
                    const data = await apiGetDistricts();
                    setDistricts((data || []).filter((d) => d.ProvinceID === selectedProvince.ProvinceID));
                    setSelectedDistrict(null);
                    setSelectedWard(null);
                    setWards([]);
                    setShippingFee(0);
                    form.setFieldsValue({ district: undefined, ward: undefined });
                } catch {
                    message.error('Không thể tải danh sách quận/huyện');
                } finally {
                    setIsLoadingDistricts(false);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProvince]);

    useEffect(() => {
        if (selectedDistrict) {
            (async () => {
                setIsLoadingWards(true);
                try {
                    const data = await apiGetWardsByDistrict(selectedDistrict.DistrictID);
                    setWards(data || []);
                    setSelectedWard(null);
                    setShippingFee(0);
                    form.setFieldsValue({ ward: undefined });
                } catch {
                    message.error('Không thể tải danh sách phường/xã');
                } finally {
                    setIsLoadingWards(false);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDistrict]);

    useEffect(() => {
        if (selectedProvince && selectedDistrict && selectedWard) {
            calculateShippingFee();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedWard]);

    const calculateShippingFee = async () => {
        setIsLoadingShippingFee(true);
        try {
            const shippingData = await apiGetShippingFee({
                fromDistrictId: 1542,
                toDistrictId: selectedDistrict.DistrictID,
                toWardCode: selectedWard.WardCode,
                serviceTypeId: 2,
                weight: 500,
                length: 20,
                width: 15,
                height: 10,
            });
            if (shippingData?.data) {
                setShippingFee(shippingData.data.total || 0);
                setShippingService(shippingData.data.service_type_name || 'Giao hàng tiêu chuẩn');
                message.success('Đã tính phí vận chuyển thành công');
            } else {
                setShippingFee(0);
                setShippingService('Không thể tính phí');
                message.warning('Không thể tính phí vận chuyển cho địa chỉ này');
            }
        } catch {
            message.error('Lỗi khi tính phí vận chuyển');
            setShippingFee(0);
            setShippingService('Lỗi tính phí');
        } finally {
            setIsLoadingShippingFee(false);
        }
    };

    const handleProvinceChange = (val) => setSelectedProvince(provinces.find((p) => p.ProvinceID === val) || null);
    const handleDistrictChange = (val) => setSelectedDistrict(districts.find((d) => d.DistrictID === val) || null);
    const handleWardChange = (val) => setSelectedWard(wards.find((w) => w.WardCode === val) || null);
    const handlePaymentMethodChange = (e) => setPaymentMethod(e.target.value);

    // FULL PAY submit
    const handleSubmit = async (values) => {
        if (checkoutMode === 'split') return; // không submit khi chia tiền

        const token = localStorage.getItem('token');
        if (!groupOrderData || !groupToken) return message.error('Không có thông tin giỏ hàng nhóm');
        if (!selectedProvince || !selectedDistrict || !selectedWard) return message.error('Vui lòng chọn đủ địa chỉ');

        setIsSubmitting(true);
        const orderData = {
            sonha: values.houseNumber || '',
            street: values.street || '',
            district_id: selectedDistrict.DistrictID,
            ward_id: selectedWard.WardCode,
            ward_name: selectedWard.WardName,
            district_name: selectedDistrict.DistrictName,
            payment: paymentMethod, // 'cod' | 'credit_card'
            shipping_fee: shippingFee,
            note: values.note,
            customer_name: values.fullName,
            customer_phone: values.phone,
        };

        try {
            if (paymentMethod === 'cod') {
                const response = await fetch(`http://localhost:8000/api/group-orders/${groupToken}/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(orderData),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);

                if (result.success) {
                    await apiSendOtp(values.email, 'group_order_success', {
                        name: values.fullName,
                        phone: values.phone,
                        order_id: result.data?.order_id,
                        order_code: result.data?.order_code,
                        total_amount: result.data?.total_price,
                        group_order_id: result.data?.group_order_id,
                        items_count: result.data?.items_count,
                        total_quantity: result.data?.total_quantity,
                        address: `${selectedWard?.WardName || ''}, ${selectedDistrict?.DistrictName || ''}, ${
                            selectedProvince?.ProvinceName || ''
                        }`,
                        payment_method: 'Thanh toán khi nhận hàng (COD)',
                    });
                    message.success('Đặt hàng thành công! Đã gửi email xác nhận.');
                    window.updateCartCount?.();
                    window.dispatchEvent(new CustomEvent('cartUpdated'));
                    form.resetFields();
                    toast.success('Checkout thành công!');
                    router.push(`/`);
                } else throw new Error(result.message || 'Checkout thất bại');
            } else {
                // ZaloPay flow (tuỳ bạn implement)
                message.info('Demo giữ nguyên flow ZaloPay của bạn ở đây.');
            }
        } catch (e) {
            console.error(e);
            message.error(e.message || 'Checkout thất bại');
            toast.error(e.message || 'Checkout thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    // gom items
    const getAllGroupItems = () => {
        if (!groupOrderData?.by_member) return [];
        const all = [];
        Object.values(groupOrderData.by_member).forEach((m) => (m.items || []).forEach((i) => all.push(i)));
        return all;
    };
    const groupItems = getAllGroupItems();

    // Sang trang chia tiền (mang theo shipping_fee + checkoutInfo)
    const handleProceedSplit = () => {
        if (!groupOrderData || !groupToken) return message.error('Không có thông tin giỏ hàng nhóm');

        // bắt buộc chọn đủ địa chỉ trước khi chia tiền
        if (!selectedProvince || !selectedDistrict || !selectedWard) {
            return message.error('Vui lòng chọn đầy đủ Tỉnh/Quận/Phường để tính phí ship trước khi chia tiền');
        }

        const items = getAllGroupItems();
        if (!items.length) return message.error('Nhóm chưa có sản phẩm');

        // đảm bảo đã có shippingFee hợp lệ
        if (!shippingFee || shippingFee <= 0) {
            message.warning('Đang tính phí ship, vui lòng đợi hoặc chọn lại phường/xã.');
            return;
        }

        // Lưu token + shipping
        localStorage.setItem('group_cart_token', groupToken);
        localStorage.setItem('group_shipping_fee', String(shippingFee || 0));

        // Lấy giá trị form (nếu có nhập)
        const v = form.getFieldsValue([
            'fullName',
            'phone',
            'email',
            'houseNumber',
            'street',
            'province',
            'district',
            'ward',
            'note',
        ]);

        // Địa chỉ hiển thị đẹp
        const niceAddress = [
            v.houseNumber,
            v.street,
            selectedWard?.WardName,
            selectedDistrict?.DistrictName,
            selectedProvince?.ProvinceName,
        ]
            .filter(Boolean)
            .join(', ');

        // Lưu object để trang split tạo đơn khi all_paid
        const checkoutInfo = {
            payment: 'cod',
            address: niceAddress,
            phone: v.phone || '',
            sonha: v.houseNumber || '',
            street: v.street || '',
            ward_id: selectedWard?.WardCode ?? null,
            ward_name: selectedWard?.WardName ?? '',
            district_id: selectedDistrict?.DistrictID ?? null,
            district_name: selectedDistrict?.DistrictName ?? '',
            note: v.note || '',
        };
        localStorage.setItem('group_checkout_info', JSON.stringify(checkoutInfo));

        // Điều hướng sang trang chia tiền
        router.push(
            `/checkout-split?token=${encodeURIComponent(groupToken)}&gateway=${splitGateway}&ship=${Number(
                shippingFee || 0,
            )}`,
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!groupOrderData) {
        return (
            <div className="checkout-container">
                <div style={{ textAlign: 'center', padding: 50, minHeight: 400 }}>
                    <Title level={3}>Không tìm thấy giỏ hàng nhóm</Title>
                    <Text>Vui lòng kiểm tra link hoặc liên hệ chủ nhóm.</Text>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <div className="checkout-content">
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <div className="checkout-form-section">
                            <Title level={3} className="section-title">
                                <UsergroupAddOutlined /> Checkout Giỏ Hàng Nhóm
                            </Title>

                            {/* Group info */}
                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    <UsergroupAddOutlined /> Thông tin nhóm
                                </Title>
                                <Alert
                                    message="Đơn hàng nhóm"
                                    description={`Bạn đang checkout cho nhóm có ${
                                        groupOrderData.members?.length || 0
                                    } thành viên. Tất cả sản phẩm sẽ giao đến 1 địa chỉ.`}
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Text strong>Thành viên: </Text>
                                        <Tag color="blue">
                                            <UserOutlined /> {groupOrderData.members?.length || 0} người
                                        </Tag>
                                    </Col>
                                    <Col span={12}>
                                        <Text strong>Trạng thái: </Text>
                                        <Tag color={groupOrderData.status === 'open' ? 'green' : 'orange'}>
                                            {groupOrderData.status === 'open' ? 'Đang mở' : groupOrderData.status}
                                        </Tag>
                                    </Col>
                                </Row>
                                {groupOrderData.expires_at && (
                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary">
                                            <ClockCircleOutlined /> Hết hạn:{' '}
                                            {new Date(groupOrderData.expires_at).toLocaleString('vi-VN')}
                                        </Text>
                                    </div>
                                )}
                            </Card>

                            {/* Hình thức thanh toán */}
                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    Hình thức thanh toán
                                </Title>
                                <Radio.Group
                                    value={checkoutMode}
                                    onChange={(e) => setCheckoutMode(e.target.value)}
                                    style={{ display: 'flex', gap: 16, marginBottom: 12 }}
                                >
                                    <Radio value="full">Một người trả hết</Radio>
                                    <Radio value="split">Chia tiền (mỗi người tự thanh toán)</Radio>
                                </Radio.Group>

                                {checkoutMode === 'split' ? (
                                    <div style={{ marginTop: 12 }}>
                                        <Text strong>Chọn cổng thanh toán chia tiền:</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Radio.Group
                                                value={splitGateway}
                                                onChange={(e) => setSplitGateway(e.target.value)}
                                                style={{ display: 'flex', gap: 16 }}
                                            >
                                                <Radio value="momo">MoMo</Radio>
                                                <Radio value="vnpay">VNPAY</Radio>
                                            </Radio.Group>
                                        </div>
                                        <Alert
                                            style={{ marginTop: 12 }}
                                            message="Chế độ chia tiền"
                                            description="Mỗi thành viên sẽ thanh toán phần của mình qua cổng đã chọn. Bạn sẽ được chuyển sang trang chia tiền."
                                            type="success"
                                            showIcon
                                        />
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 12 }}>
                                        <Text strong>Phương thức thanh toán (người trả hết):</Text>
                                        <div style={{ marginTop: 8 }}>
                                            <Radio.Group value={paymentMethod} onChange={handlePaymentMethodChange}>
                                                <Radio value="cod">COD (Thanh toán khi nhận hàng)</Radio>
                                                <Radio value="credit_card">ZaloPay (QR/Online)</Radio>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Địa chỉ nhận hàng */}
                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    Địa chỉ nhận hàng
                                </Title>
                                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                                    <Row gutter={16}>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Họ và tên"
                                                name="fullName"
                                                rules={[
                                                    {
                                                        required: checkoutMode === 'full',
                                                        message: 'Vui lòng nhập họ và tên',
                                                    },
                                                ]}
                                            >
                                                <Input placeholder="Nhập họ và tên" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Số điện thoại"
                                                name="phone"
                                                rules={[
                                                    {
                                                        required: checkoutMode === 'full',
                                                        message: 'Vui lòng nhập số điện thoại',
                                                    },
                                                ]}
                                            >
                                                <Input placeholder="Nhập số điện thoại" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Email"
                                                name="email"
                                                rules={
                                                    checkoutMode === 'full'
                                                        ? [
                                                              { required: true, message: 'Vui lòng nhập email' },
                                                              { type: 'email', message: 'Email không hợp lệ' },
                                                          ]
                                                        : []
                                                }
                                            >
                                                <Input placeholder="Nhập email để nhận thông báo đơn hàng" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Số nhà" name="houseNumber">
                                                <Input placeholder="Nhập số nhà" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item label="Tên đường" name="street">
                                                <Input placeholder="Nhập tên đường" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Tỉnh/Thành Phố"
                                                name="province"
                                                rules={[
                                                    {
                                                        required: checkoutMode === 'full',
                                                        message: 'Vui lòng chọn tỉnh/thành phố',
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    placeholder="Chọn tỉnh/thành phố"
                                                    loading={isLoadingProvinces}
                                                    onChange={handleProvinceChange}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {provinces.map((p) => (
                                                        <Option key={p.ProvinceID} value={p.ProvinceID}>
                                                            {p.ProvinceName}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Quận/Huyện"
                                                name="district"
                                                rules={[
                                                    {
                                                        required: checkoutMode === 'full',
                                                        message: 'Vui lòng chọn quận/huyện',
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    placeholder="Chọn quận/huyện"
                                                    loading={isLoadingDistricts}
                                                    onChange={handleDistrictChange}
                                                    disabled={!selectedProvince}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {districts.map((d) => (
                                                        <Option key={d.DistrictID} value={d.DistrictID}>
                                                            {d.DistrictName}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Phường/Xã/Thị Trấn"
                                                name="ward"
                                                rules={[
                                                    {
                                                        required: checkoutMode === 'full',
                                                        message: 'Vui lòng chọn phường/xã',
                                                    },
                                                ]}
                                            >
                                                <Select
                                                    placeholder="Chọn phường/xã"
                                                    loading={isLoadingWards}
                                                    onChange={handleWardChange}
                                                    disabled={!selectedDistrict}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {wards.map((w) => (
                                                        <Option key={w.WardCode} value={w.WardCode}>
                                                            {w.WardName}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label="Ghi chú" name="note">
                                        <Input.TextArea rows={3} placeholder="Nhập ghi chú (không bắt buộc)" />
                                    </Form.Item>
                                </Form>
                            </Card>

                            {/* Sản phẩm nhóm */}
                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    <DownloadOutlined /> Sản phẩm nhóm ({groupItems.length} sản phẩm)
                                </Title>
                                {groupOrderData.members &&
                                    groupOrderData.members.map((member) => {
                                        const memberItems = groupOrderData.by_member[member.id]?.items || [];
                                        const memberSubtotal = groupOrderData.by_member[member.id]?.subtotal || 0;
                                        return (
                                            <div
                                                key={member.id}
                                                style={{
                                                    marginBottom: 20,
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: 8,
                                                    padding: 16,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    <div>
                                                        <Text strong>{member.name}</Text>
                                                        {member.role === 'owner' && (
                                                            <Tag color="gold" style={{ marginLeft: 8 }}>
                                                                Chủ nhóm
                                                            </Tag>
                                                        )}
                                                    </div>
                                                    <Text strong style={{ color: '#52c41a' }}>
                                                        {memberSubtotal.toLocaleString('vi-VN')}đ
                                                    </Text>
                                                </div>
                                                {memberItems.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="product-item"
                                                        style={{ marginBottom: 8 }}
                                                    >
                                                        <div className="product-details">
                                                            <Text strong className="product-name">
                                                                {item.title}
                                                            </Text>
                                                            <Text className="product-quantity">
                                                                Số lượng: {item.qty}
                                                            </Text>
                                                        </div>
                                                        <div className="product-price">
                                                            <Text strong>
                                                                {parseFloat(item.price).toLocaleString('vi-VN')}đ
                                                            </Text>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                            </Card>
                        </div>
                    </Col>

                    {/* Summary */}
                    <Col xs={24} lg={8}>
                        <div className="order-summary-section">
                            <Card className="summary-card">
                                <Title level={4} className="card-title">
                                    <UsergroupAddOutlined /> Thông tin thanh toán nhóm
                                </Title>
                                <div className="summary-row">
                                    <Text>Số thành viên</Text>
                                    <Text>{groupOrderData.members?.length || 0} người</Text>
                                </div>
                                <div className="summary-row">
                                    <Text>Tổng sản phẩm</Text>
                                    <Text>{groupItems.reduce((s, i) => s + (i.qty || 1), 0)} sản phẩm</Text>
                                </div>
                                <div className="summary-row">
                                    <Text>Tổng tiền hàng</Text>
                                    <Text>{subtotal.toLocaleString('vi-VN')}đ</Text>
                                </div>
                                <div className="summary-row">
                                    <Text>Phí vận chuyển</Text>
                                    <Text className="highlight">
                                        {checkoutMode === 'split' ? (
                                            shippingFee ? (
                                                `${shippingFee.toLocaleString()}đ (sẽ dùng để chia)`
                                            ) : (
                                                'Chưa có (bấm chọn địa chỉ để tính)'
                                            )
                                        ) : isLoadingShippingFee ? (
                                            <Spin size="small" />
                                        ) : shippingFee > 0 ? (
                                            `${shippingFee.toLocaleString()}đ`
                                        ) : (
                                            'Chưa xác định'
                                        )}
                                    </Text>
                                </div>
                                <Divider />
                                <div className="summary-row total-row">
                                    <Text strong>Tổng cộng</Text>
                                    <Text strong className="total-price">
                                        {checkoutMode === 'split'
                                            ? `${subtotal.toLocaleString('vi-VN')}đ`
                                            : `${totalWithShipping.toLocaleString('vi-VN')}đ`}
                                    </Text>
                                </div>

                                {checkoutMode === 'split' ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="checkout-btn"
                                        block
                                        onClick={handleProceedSplit}
                                        disabled={!groupOrderData || groupItems.length === 0}
                                    >
                                        Tiếp tục chia tiền ({splitGateway === 'momo' ? 'MoMo' : 'VNPAY'})
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="checkout-btn"
                                        block
                                        loading={isSubmitting}
                                        onClick={() => form.submit()}
                                        disabled={!groupOrderData || groupItems.length === 0}
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Thanh toán (1 người trả hết)'}
                                    </Button>
                                )}
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
