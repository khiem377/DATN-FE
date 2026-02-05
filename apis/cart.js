import { toast } from 'react-toastify';

export const apiAddToCart = async (bookId, quantity) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                book_id: bookId,
                quantity: quantity,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            toast.error(data.message || `HTTP error! status: ${response.status}`);
            return {
                success: false,
                error: data.message || `HTTP error! status: ${response.status}`,
            };
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        toast.error(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
        return {
            success: false,
            error: error.message,
        };
    }
};
