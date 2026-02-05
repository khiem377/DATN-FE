import { Clock, Headphones, RotateCcw, Zap } from 'lucide-react';
import CouponSliderClient from './CouponSliderClient';

// Server Component - fetch data on server
const CouponSlider = async () => {
    let coupons = [];
    let error = null;

    // Màu sắc theme cho các coupon
    const colorThemes = [
        { bg: '#FFF4E6', text: '#D46B08', code: '#FF8C00' }, // Orange
        { bg: '#FFEBEE', text: '#C62828', code: '#F44336' }, // Red
        { bg: '#EFEBE9', text: '#5D4037', code: '#8D6E63' }, // Brown
        { bg: '#E3F2FD', text: '#1565C0', code: '#2196F3' }, // Blue
        { bg: '#E8F5E8', text: '#2E7D32', code: '#4CAF50' }, // Green
    ];

    try {
        const res = await fetch('http://localhost:8000/api/coupons/get', {
            cache: 'no-store',
        });

        const raw = await res.text(); // BE 500 đôi khi trả HTML

        if (!res.ok) {
            console.error('Coupon API failed:', res.status, raw?.slice(0, 300));
            error = `Server đang lỗi (${res.status})`;
        } else {
            let data = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch (e) {
                console.error('Coupon JSON parse error:', e, raw?.slice(0, 300));
                error = 'Dữ liệu coupon không hợp lệ';
            }

            if (!error) {
                if (data.success && Array.isArray(data.coupons)) {
                    coupons = data.coupons.map((coupon, index) => ({
                        id: coupon.id,
                        name: coupon.name,
                        description: coupon.description || `Giảm ${coupon.discount_value}% cho đơn hàng`,
                        discount_value: parseFloat(coupon.discount_value),
                        discount_type: coupon.discount_type,
                        min_order_value: parseFloat(coupon.min_order_value),
                        usage_limit: coupon.usage_limit,
                        start_date: coupon.start_date,
                        end_date: coupon.end_date,
                        is_active: coupon.is_active,
                        colorTheme: colorThemes[index % colorThemes.length],
                    }));
                } else {
                    error = 'Không thể tải dữ liệu mã giảm giá';
                }
            }
        }
    } catch (err) {
        console.error('Coupon fetch crashed:', err);
        error = 'Lỗi kết nối API';
    }

    return (
        <div style={{ width: '80%', margin: '0 auto', padding: '20px 0' }}>
            {/* Services Grid - Static content */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px',
                    padding: '0 20px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                        }}
                    >
                        <Clock size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>Giao hàng tốc độ</h3>
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>Nội thành TP. HCM trong 4h</p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                        }}
                    >
                        <RotateCcw size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>Đổi trả miễn phí</h3>
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>Trong vòng 30 ngày miễn phí</p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#f97316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                        }}
                    >
                        <Headphones size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>Hỗ trợ 24/7</h3>
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>Hỗ trợ khách hàng 24/7</p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px',
                        }}
                    >
                        <Zap size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>Deal hot bùng nổ</h3>
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>Flash sale giảm giá cực sốc</p>
                    </div>
                </div>
            </div>

            {/* Client Component for interactive slider */}
            <CouponSliderClient coupons={coupons} error={error} />
        </div>
    );
};

export default CouponSlider;
