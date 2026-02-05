'use client';
import { CreditCardOutlined, DownloadOutlined, QrcodeOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Image, Input, message, Radio, Row, Select, Spin, Typography } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { apiGetDistricts, apiGetProvinces, apiGetShippingFee, apiGetWardsByDistrict } from '../../../apis/ghtk';
import { apiSendOtp } from '../../../apis/user'; // Thêm import này
import { CartContext } from '../../app/contexts/CartContext';
import './CheckoutPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Component con chứa logic chính
const CheckoutPageContent = () => {
    const [form] = Form.useForm();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const { cartData, selectedItems, calculateTotal, clearCart } = useContext(CartContext);
    const [checkoutData, setCheckoutData] = useState(null);

    // Import useSearchParams bên trong Suspense
    const { useSearchParams } = require('next/navigation');
    const searchParams = useSearchParams();
    const router = useRouter();

    // States for address data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedWard, setSelectedWard] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingService, setShippingService] = useState('Chưa xác định');

    // Loading states
    const [isLoadingShippingFee, setIsLoadingShippingFee] = useState(false);
    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingWards, setIsLoadingWards] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const getSelectedCartItems = () => {
        if (!cartData || !selectedItems || selectedItems.length === 0) {
            return [];
        }
        return cartData.items.filter((item) => selectedItems.includes(item.id));
    };

    const selectedCartItems = getSelectedCartItems();
    const subtotal = calculateTotal ? calculateTotal() : 0;
    const total = subtotal + shippingFee;

    useEffect(() => {
        try {
            const dataParam = searchParams.get('data');

            if (dataParam) {
                const data = JSON.parse(decodeURIComponent(dataParam));
                console.log('Received checkout data:', data);
                setCheckoutData(data);
            } else {
                message.warning('Không có thông tin đơn hàng. Vui lòng thử lại.');
                return;
            }
        } catch (error) {
            return;
        } finally {
            setLoading(false);
        }
    }, [searchParams, router]);

    // Load provinces on component mount
    useEffect(() => {
        loadProvinces();
    }, []);

    // Load districts when province changes
    useEffect(() => {
        if (selectedProvince) {
            loadDistricts();
            setSelectedDistrict(null);
            setSelectedWard(null);
            setWards([]);
            setShippingFee(0);
            form.setFieldsValue({ district: undefined, ward: undefined });
        }
    }, [selectedProvince]);

    // Load wards when district changes
    useEffect(() => {
        if (selectedDistrict) {
            loadWards(selectedDistrict.DistrictID);
            setSelectedWard(null);
            setShippingFee(0);
            form.setFieldsValue({ ward: undefined });
        }
    }, [selectedDistrict]);

    // Calculate shipping fee when ward changes
    useEffect(() => {
        if (selectedProvince && selectedDistrict && selectedWard) {
            calculateShippingFee();
        }
    }, [selectedWard]);

    const loadProvinces = async () => {
        setIsLoadingProvinces(true);
        try {
            const provincesData = await apiGetProvinces();
            setProvinces(provincesData || []);
        } catch (error) {
            message.error('Không thể tải danh sách tỉnh/thành phố');
        } finally {
            setIsLoadingProvinces(false);
        }
    };

    const loadDistricts = async () => {
        setIsLoadingDistricts(true);
        try {
            const districtsData = await apiGetDistricts();
            const filteredDistricts = districtsData.filter(
                (district) => district.ProvinceID === selectedProvince.ProvinceID,
            );
            setDistricts(filteredDistricts || []);
        } catch (error) {
            message.error('Không thể tải danh sách quận/huyện');
        } finally {
            setIsLoadingDistricts(false);
        }
    };

    const loadWards = async (districtId) => {
        setIsLoadingWards(true);
        try {
            const wardsData = await apiGetWardsByDistrict(districtId);
            setWards(wardsData || []);
        } catch (error) {
            message.error('Không thể tải danh sách phường/xã');
        } finally {
            setIsLoadingWards(false);
        }
    };

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

            if (shippingData && shippingData.data) {
                setShippingFee(shippingData.data.total || 0);
                setShippingService(shippingData.data.service_type_name || 'Giao hàng tiêu chuẩn');
                message.success('Đã tính phí vận chuyển thành công');
            } else {
                setShippingFee(0);
                setShippingService('Không thể tính phí');
                message.warning('Không thể tính phí vận chuyển cho địa chỉ này');
            }
        } catch (error) {
            message.error('Lỗi khi tính phí vận chuyển');
            setShippingFee(0);
            setShippingService('Lỗi tính phí');
        } finally {
            setIsLoadingShippingFee(false);
        }
    };

    const handleProvinceChange = (value) => {
        const province = provinces.find((p) => p.ProvinceID === value);
        setSelectedProvince(province);
    };

    const handleDistrictChange = (value) => {
        const district = districts.find((d) => d.DistrictID === value);
        setSelectedDistrict(district);
    };

    const handleWardChange = (value) => {
        const ward = wards.find((w) => w.WardCode === value);
        setSelectedWard(ward);
    };

    const createZaloPayOrder = async (amount) => {
        try {
            const response = await axios.post('http://localhost:8000/api/orders/zalopay/create-order', {
                amount: amount,
                description: 'Thanh toán đơn hàng',
            });

            if (response.data.success) {
                window.open(response.data.order_url, '_blank');
                localStorage.setItem('zp_trans_token', response.data.zp_trans_token);
                localStorage.setItem('app_trans_id', response.data.app_trans_id);
                message.success('Đã tạo đơn hàng ZaloPay thành công!');
                return response.data;
            } else {
                throw new Error(response.data.return_message || 'Tạo đơn hàng thất bại');
            }
        } catch (error) {
            console.error('ZaloPay Error:', error);
            message.error('Không thể tạo đơn hàng ZaloPay: ' + error.message);
            throw error;
        }
    };

    // Function gửi email đặt hàng thành công
    const sendOrderSuccessEmail = async (orderResult, customerInfo) => {
        try {
            console.log('📧 [EMAIL] Sending order success email...');

            const orderData = {
                name: customerInfo.fullName,
                phone: customerInfo.phone,
                order_id: orderResult.order?.id || orderResult.data?.id,
                total_amount: checkoutData?.totalAmount + shippingFee,
                items: selectedCartItems,
                address: `${selectedWard?.WardName || ''}, ${selectedDistrict?.DistrictName || ''}, ${
                    selectedProvince?.ProvinceName || ''
                }`,
                payment_method:
                    paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online qua ZaloPay',
            };

            await apiSendOtp(customerInfo.email, 'order_success', orderData);
            console.log('📧 [EMAIL] Order success email sent successfully');
        } catch (error) {
            console.error('📧 [EMAIL] Error sending order success email:', error);
        }
    };

    const handlePaymentMethodChange = (e) => {
        const selectedMethod = e.target.value;
        setPaymentMethod(selectedMethod);
        console.log('Payment method changed to:', selectedMethod);
    };

    const handleSubmit = async (values) => {
        const token = localStorage.getItem('token');

        if (selectedCartItems.length === 0) {
            message.error('Không có sản phẩm nào được chọn');
            return;
        }

        if (!selectedProvince || !selectedDistrict || !selectedWard) {
            message.error('Vui lòng chọn đầy đủ địa chỉ giao hàng');
            return;
        }

        setIsSubmitting(true);
        const priceOrder = checkoutData?.totalAmount + shippingFee;

        try {
            const orderData = {
                address: `${values.houseNumber || ''}, ${values.street || ''}, ${selectedWard.WardName}, ${
                    selectedDistrict.DistrictName
                }, ${selectedProvince.ProvinceName}`.replace(/^,\s*/, ''),
                sonha: values.houseNumber || '',
                phone: values.phone,
                street: values.street || '',
                district_id: selectedDistrict.DistrictID,
                ward_id: selectedWard.WardCode,
                district_name: selectedDistrict.DistrictName,
                ward_name: selectedWard.WardName,
                card_id: 1,
                payment: paymentMethod,
                cart_item_ids: selectedItems || [],
                shipping_fee: shippingFee,
                total_price: priceOrder,
                note: values.note,
                price: checkoutData?.totalAmount,
            };

            if (paymentMethod === 'cod') {
                console.log('🛒 [COD] Processing COD order');

                const response = await fetch('http://localhost:8000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(orderData),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                if (result.success === true) {
                    console.log('🛒 [COD] Order created successfully - Sending email');

                    // Gửi email đặt hàng thành công
                    await sendOrderSuccessEmail(result, {
                        fullName: values.fullName,
                        email: values.email,
                        phone: values.phone,
                    });

                    message.success('Đặt hàng thành công! Email xác nhận đã được gửi.');

                    if (clearCart) {
                        clearCart();
                    }

                    window.updateCartCount?.();
                    window.dispatchEvent(new CustomEvent('cartUpdated'));
                    form.resetFields();
                    toast.success('Đặt hàng thành công!');
                    router.push('/');
                } else {
                    throw new Error(result.message || 'Đặt hàng thất bại');
                }
            } else if (paymentMethod === 'credit_card') {
                console.log('🛒 [ZALOPAY] Starting ZaloPay payment flow');

                const cartStateBeforePayment = {
                    selectedCartItems: [...selectedCartItems],
                    checkoutData: { ...checkoutData },
                    selectedItems: [...selectedItems],
                    orderData: { ...orderData },
                    customerInfo: {
                        // Thêm customerInfo vào cartState
                        fullName: values.fullName,
                        email: values.email,
                        phone: values.phone,
                    },
                };

                try {
                    const zaloPayResult = await createZaloPayOrder(priceOrder);
                    console.log('🛒 [ZALOPAY] ZaloPay order created:', zaloPayResult);

                    if (!zaloPayResult || !zaloPayResult.success) {
                        throw new Error('Không thể tạo thanh toán ZaloPay');
                    }

                    toast.success('Thanh toán ZaloPay đã được tạo! Vui lòng quét mã QR để thanh toán.');

                    const paymentInfo = {
                        cartState: cartStateBeforePayment,
                        timestamp: Date.now(),
                        priceOrder: priceOrder,
                        app_trans_id: zaloPayResult?.app_trans_id,
                    };
                    localStorage.setItem('pending_zaloPay_payment', JSON.stringify(paymentInfo));

                    let checkAttempts = 0;
                    const maxAttempts = 60;
                    const checkInterval = 5000;
                    let statusCheckInterval;

                    const checkPaymentStatus = async () => {
                        try {
                            checkAttempts++;
                            const appTransId = zaloPayResult?.app_trans_id;

                            console.log('🛒 [ZALOPAY] Checking payment status, attempt:', checkAttempts);

                            if (!appTransId) {
                                console.error('🛒 [ZALOPAY] No app_trans_id found');
                                toast.error('Không tìm thấy thông tin giao dịch. Vui lòng thử lại.');
                                return;
                            }

                            const statusResponse = await axios.post(
                                'http://localhost:8000/api/orders/zalopay/check-status',
                                {
                                    app_trans_id: appTransId,
                                },
                            );

                            const data = statusResponse.data;
                            console.log(`🛒 [ZALOPAY] Status check (attempt ${checkAttempts}):`, data);

                            if (data.return_code === 1) {
                                console.log('🛒 [ZALOPAY] Payment successful - Creating order and sending email');

                                if (statusCheckInterval) {
                                    clearInterval(statusCheckInterval);
                                }

                                try {
                                    const storedPaymentInfo = JSON.parse(
                                        localStorage.getItem('pending_zaloPay_payment') || '{}',
                                    );
                                    const storedOrderData = storedPaymentInfo.cartState?.orderData || orderData;
                                    const storedCustomerInfo = storedPaymentInfo.cartState?.customerInfo;

                                    const orderResponse = await fetch('http://localhost:8000/api/orders', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify(storedOrderData),
                                    });

                                    const orderResult = await orderResponse.json();

                                    if (!orderResponse.ok || !orderResult.success) {
                                        throw new Error(
                                            orderResult.message ||
                                                'Không thể tạo đơn hàng sau khi thanh toán thành công',
                                        );
                                    }

                                    console.log('🛒 [ZALOPAY] Order created successfully - Sending email');

                                    // Gửi email đặt hàng thành công cho ZaloPay
                                    if (storedCustomerInfo) {
                                        await sendOrderSuccessEmail(orderResult, storedCustomerInfo);
                                    }

                                    if (clearCart) {
                                        await clearCart();
                                    }

                                    localStorage.removeItem('pending_zaloPay_payment');
                                    localStorage.removeItem('app_trans_id');

                                    toast.success(
                                        'ZaloPay: Thanh toán thành công! Đơn hàng đã được tạo và email đã được gửi.',
                                    );
                                    window.updateCartCount?.();
                                    window.dispatchEvent(new CustomEvent('cartUpdated'));
                                    form.resetFields();

                                    router.push('/order-success');
                                } catch (orderError) {
                                    console.error(
                                        '🛒 [ZALOPAY] Error creating order after successful payment:',
                                        orderError,
                                    );
                                    toast.error(
                                        'Thanh toán thành công nhưng không thể tạo đơn hàng. Vui lòng liên hệ hỗ trợ.',
                                    );
                                    localStorage.removeItem('pending_zaloPay_payment');
                                    localStorage.removeItem('app_trans_id');
                                }
                            } else if (data.return_code === 2) {
                                console.log('🛒 [ZALOPAY] Payment failed - Cart preserved');

                                if (statusCheckInterval) {
                                    clearInterval(statusCheckInterval);
                                }

                                toast.error('ZaloPay: Thanh toán thất bại. Vui lòng thử lại.');
                                localStorage.removeItem('pending_zaloPay_payment');
                                localStorage.removeItem('app_trans_id');
                            } else if (data.return_code === 3) {
                                console.log('🛒 [ZALOPAY] Payment pending - Cart preserved');

                                if (checkAttempts >= maxAttempts) {
                                    if (statusCheckInterval) {
                                        clearInterval(statusCheckInterval);
                                    }
                                    toast.info('ZaloPay: Giao dịch chưa hoàn thành. Vui lòng kiểm tra lại sau.');
                                    router.push('/order-status');
                                }
                            }
                        } catch (checkErr) {
                            console.error('🛒 [ZALOPAY] Error checking payment status:', checkErr);

                            if (checkAttempts >= maxAttempts) {
                                if (statusCheckInterval) {
                                    clearInterval(statusCheckInterval);
                                }
                                toast.error('Không thể kiểm tra trạng thái thanh toán. Vui lòng liên hệ hỗ trợ.');
                                router.push('/order-status');
                            }
                        }
                    };

                    await checkPaymentStatus();
                    statusCheckInterval = setInterval(checkPaymentStatus, checkInterval);

                    setTimeout(() => {
                        // Clear progress toast after max time
                    }, maxAttempts * checkInterval);
                } catch (zaloPayError) {
                    console.error('🛒 [ZALOPAY] Error creating ZaloPay order:', zaloPayError);
                    message.error('Lỗi khi tạo thanh toán ZaloPay. Vui lòng thử lại.');
                    localStorage.removeItem('pending_zaloPay_payment');
                    return;
                }
            }
        } catch (error) {
            console.error('🛒 [ERROR] General error:', error);
            message.error(error.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
            toast.error(error.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            const intervals = window.paymentStatusIntervals || [];
            intervals.forEach((interval) => clearInterval(interval));
            window.paymentStatusIntervals = [];
        };
    }, []);

    useEffect(() => {
        const handleWindowFocus = async () => {
            const pendingPayment = localStorage.getItem('pending_zaloPay_payment');

            if (pendingPayment) {
                console.log('🛒 [ZALOPAY] Window focused - Checking payment status');
                const paymentInfo = JSON.parse(pendingPayment);
                const appTransId = paymentInfo.app_trans_id;

                if (appTransId) {
                    try {
                        const statusResponse = await axios.post(
                            'http://localhost:8000/api/orders/zalopay/check-status',
                            {
                                app_trans_id: appTransId,
                            },
                        );

                        const data = statusResponse.data;

                        if (data.return_code === 1) {
                            console.log(
                                '🛒 [ZALOPAY] Payment completed while away - Processing order and sending email',
                            );

                            // Xử lý đơn hàng và gửi email
                            try {
                                const storedOrderData = paymentInfo.cartState?.orderData;
                                const storedCustomerInfo = paymentInfo.cartState?.customerInfo;

                                if (storedOrderData && storedCustomerInfo) {
                                    const token = localStorage.getItem('token');
                                    const orderResponse = await fetch('http://localhost:8000/api/orders', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`,
                                        },
                                        body: JSON.stringify(storedOrderData),
                                    });

                                    const orderResult = await orderResponse.json();

                                    if (orderResponse.ok && orderResult.success) {
                                        // Gửi email đặt hàng thành công
                                        await sendOrderSuccessEmail(orderResult, storedCustomerInfo);

                                        toast.success(
                                            'Thanh toán đã hoàn thành! Đơn hàng đã được tạo và email đã được gửi.',
                                        );

                                        // Clear cart and redirect
                                        if (clearCart) {
                                            await clearCart();
                                        }
                                        localStorage.removeItem('pending_zaloPay_payment');
                                        localStorage.removeItem('app_trans_id');
                                        router.push('/order-success');
                                    }
                                }
                            } catch (error) {
                                console.error('🛒 [ZALOPAY] Error processing order on focus:', error);
                            }
                        }
                    } catch (error) {
                        console.error('🛒 [ZALOPAY] Error checking status on focus:', error);
                    }
                }
            }
        };

        window.addEventListener('focus', handleWindowFocus);

        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);

    if (!selectedCartItems || selectedCartItems.length === 0) {
        return (
            <div className="checkout-container">
                <div style={{ textAlign: 'center', padding: '50px', minHeight: '400px' }}>
                    <Title level={3}>Giỏ hàng trống</Title>
                    <Text>Vui lòng thêm sản phẩm vào giỏ hàng để thanh toán.</Text>
                </div>
            </div>
        );
    }

    const totalAmount = Number(checkoutData?.totalAmount || 0);
    const fee = Number(shippingFee || 0);
    const totalWithShipping = totalAmount + fee;

    return (
        <div className="checkout-container">
            <div className="checkout-content">
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <div className="checkout-form-section">
                            <Title level={3} className="section-title">
                                Xác nhận thanh toán
                            </Title>

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
                                                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                                            >
                                                <Input placeholder="Nhập họ và tên" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Số điện thoại"
                                                name="phone"
                                                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                                            >
                                                <Input placeholder="Nhập số điện thoại" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Email"
                                                name="email"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập email' },
                                                    { type: 'email', message: 'Email không hợp lệ' },
                                                ]}
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
                                                rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn tỉnh/thành phố"
                                                    loading={isLoadingProvinces}
                                                    onChange={handleProvinceChange}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {provinces.map((province) => (
                                                        <Option key={province.ProvinceID} value={province.ProvinceID}>
                                                            {province.ProvinceName}
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
                                                rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn quận/huyện"
                                                    loading={isLoadingDistricts}
                                                    onChange={handleDistrictChange}
                                                    disabled={!selectedProvince}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {districts.map((district) => (
                                                        <Option key={district.DistrictID} value={district.DistrictID}>
                                                            {district.DistrictName}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Phường/Xã/Thị Trấn"
                                                name="ward"
                                                rules={[{ required: true, message: 'Vui lòng chọn phường/xã' }]}
                                            >
                                                <Select
                                                    placeholder="Chọn phường/xã"
                                                    loading={isLoadingWards}
                                                    onChange={handleWardChange}
                                                    disabled={!selectedDistrict}
                                                    showSearch
                                                    filterOption={(input, option) =>
                                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                    }
                                                >
                                                    {wards.map((ward) => (
                                                        <Option key={ward.WardCode} value={ward.WardCode}>
                                                            {ward.WardName}
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

                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    <DownloadOutlined /> Sản phẩm ({selectedCartItems.length} sản phẩm)
                                </Title>
                                <div className="product-section">
                                    {selectedCartItems.map((item) => (
                                        <div key={item.id} className="product-item">
                                            <Image
                                                src={item.book.cover_image || '/api/placeholder/80/100'}
                                                alt={item.book.title}
                                                width={60}
                                                height={80}
                                                className="product-image"
                                                fallback="/api/placeholder/80/100"
                                            />
                                            <div className="product-details">
                                                <Text strong className="product-name">
                                                    {item.book.title}
                                                </Text>
                                                <Text className="product-author">{item.book.author.name}</Text>
                                                <Text className="product-quantity">Số lượng: {item.quantity}</Text>
                                            </div>
                                            <div className="product-price">
                                                <Text strong>
                                                    {parseFloat(item.book.price).toLocaleString('vi-VN')}đ
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="shipping-info">
                                    <Row>
                                        <Col span={12}>
                                            <Text>Đơn vị vận chuyển</Text>
                                            <br />
                                            <Text>Phí vận chuyển</Text>
                                        </Col>
                                        <Col span={12} className="text-right">
                                            <Text>Giao Hàng Nhanh</Text>
                                            <br />
                                            <Text>
                                                {isLoadingShippingFee ? (
                                                    <Spin size="small" />
                                                ) : shippingFee > 0 ? (
                                                    `${shippingFee.toLocaleString()}đ`
                                                ) : (
                                                    'Chưa xác định'
                                                )}
                                            </Text>
                                        </Col>
                                    </Row>
                                    <div className="voucher-info">
                                        <Text>
                                            Vận chuyển từ <Text className="highlight">Hà Nội</Text> đến{' '}
                                            <Text className="highlight">
                                                {selectedProvince && selectedDistrict && selectedWard
                                                    ? `${selectedWard.WardName}, ${selectedDistrict.DistrictName}, ${selectedProvince.ProvinceName}`
                                                    : 'Địa điểm chưa xác định'}
                                            </Text>
                                        </Text>
                                        {shippingService !== 'Chưa xác định' && (
                                            <div style={{ marginTop: 8 }}>
                                                <Text>
                                                    Dịch vụ: <Text className="highlight">{shippingService}</Text>
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="total-section">
                                    <Row justify="space-between" align="middle">
                                        <Col>
                                            <Text strong className="total-label">
                                                Tổng số tiền
                                            </Text>
                                        </Col>
                                        <Col>
                                            <Text strong className="total-amount">
                                                {total.toLocaleString()}đ
                                            </Text>
                                        </Col>
                                    </Row>
                                </div>
                            </Card>

                            <Card className="form-card">
                                <Title level={4} className="card-title">
                                    Chọn phương thức thanh toán
                                </Title>
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={handlePaymentMethodChange}
                                    className="payment-methods"
                                >
                                    <div className="payment-option">
                                        <Radio value="cod" className="payment-radio">
                                            <div className="payment-content">
                                                <CreditCardOutlined className="payment-icon" />
                                                <div>
                                                    <Text strong>Thanh toán khi nhận hàng</Text>
                                                    <br />
                                                    <Text className="payment-desc">Thanh toán khi nhận hàng</Text>
                                                </div>
                                            </div>
                                        </Radio>
                                    </div>
                                    <div className="payment-option">
                                        <Radio value="credit_card" className="payment-radio">
                                            <div className="payment-content">
                                                <QrcodeOutlined className="payment-icon" />
                                                <div>
                                                    <Text strong>Quét QR CODE</Text>
                                                    <br />
                                                    <Text className="payment-desc">Thanh toán qua ZaloPay</Text>
                                                </div>
                                            </div>
                                        </Radio>
                                    </div>
                                </Radio.Group>
                            </Card>
                        </div>
                    </Col>

                    <Col xs={24} lg={8}>
                        <div className="order-summary-section">
                            <Card className="summary-card">
                                <Title level={4} className="card-title">
                                    Thông tin thanh toán
                                </Title>

                                <div className="summary-row">
                                    <Text>Số sản phẩm</Text>
                                    <Text>
                                        {selectedCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} sản
                                        phẩm
                                    </Text>
                                </div>

                                <div className="summary-row">
                                    <Text>Tổng tiền hàng</Text>
                                    <Text>{subtotal.toLocaleString()}đ</Text>
                                </div>

                                <div className="summary-row">
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <Text>Tạm tính:</Text>
                                        <Text>{checkoutData?.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                                    </div>
                                    <Text>Voucher </Text>
                                    <Text>{checkoutData?.totalDiscount?.toLocaleString('vi-VN')}đ</Text>
                                </div>

                                <div className="summary-row">
                                    <Text>Giảm giá vận chuyển</Text>
                                    <Text>0đ</Text>
                                </div>

                                <div className="summary-row">
                                    <Text>Phí vận chuyển</Text>
                                    <Text className="highlight">
                                        {isLoadingShippingFee ? (
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
                                        {totalWithShipping.toLocaleString('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        })}
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    size="large"
                                    className="checkout-btn"
                                    block
                                    loading={isSubmitting}
                                    onClick={() => form.submit()}
                                    disabled={selectedCartItems.length === 0}
                                >
                                    {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                                </Button>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default CheckoutPageContent;
