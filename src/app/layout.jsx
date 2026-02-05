'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // dùng cho navigate
import { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { CartProvider } from '../app/contexts/CartContext';
import ConditionalHeader from './components/ConditionalHeader';
import ConditionalFooter from './components/footer/ConditionalFooter';
import MessageContainer from './components/Message/Message';
import './globals.css';

export default function RootLayout({ children }) {
    const router = useRouter(); // Next.js router

    useEffect(() => {
        const appTransId = JSON.parse(localStorage.getItem('pending_zaloPay_payment'))?.cartState?.zaloPayResult
            ?.app_trans_id;

        if (!appTransId) return;

        const intervalRef = setInterval(async () => {
            try {
                const statusResponse = await axios.post('http://localhost:8000/api/orders/zalopay/check-status', {
                    app_trans_id: appTransId,
                });

                const data = statusResponse.data;
                console.log('🔁 [ZALOPAY] Auto check status:', data);

                if (data.return_code === 1) {
                    toast.success('ZaloPay: Thanh toán thành công!');
                    clearInterval(intervalRef);
                    localStorage.removeItem('pending_zaloPay_payment');
                    router.push('/order-success');
                } else if (data.return_code === 2) {
                    toast.error('ZaloPay: Thanh toán thất bại.');
                    clearInterval(intervalRef);
                    localStorage.removeItem('pending_zaloPay_payment');
                    router.push('/order-status');
                }
                // return_code === 3 => vẫn pending, không làm gì
            } catch (err) {
                console.error('🔁 [ZALOPAY] Auto check error:', err);
                toast.error('Lỗi khi kiểm tra trạng thái ZaloPay');
                clearInterval(intervalRef);
                localStorage.removeItem('pending_zaloPay_payment');
                router.push('/order-status');
            }
        }, 2000); // ✅ gọi mỗi 2 giây

        return () => clearInterval(intervalRef); // cleanup khi component unmount
    }, []); // ✅ thêm dependency array

    return (
        <html lang="vi">
            <body>
                <CartProvider>
                    <ToastContainer position="top-right" autoClose={2000} />
                    <ConditionalHeader />
                    <main className="main-content">
                        <MessageContainer />
                        {children}
                    </main>
                    <ConditionalFooter />
                </CartProvider>
            </body>
        </html>
    );
}
