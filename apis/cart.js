import { toast } from 'react-toastify';

export const apiAddToCart = async (bookId, quantity, price = null) => {
    const token = localStorage?.getItem('token');
    try {
        const body = {
            book_id: bookId,
            quantity: quantity,
        };

        // Chỉ thêm price vào body nếu có giá trị
        if (price !== null && price > 0) {
            body.price = price;
        }

        const response = await fetch('https://smartbook.io.vn/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (data.success === true) {
            toast.success('Thêm vào giỏ hàng thành công');
        } else {
            toast.error(data?.message);
        }

        return {
            status: data.success,
            message: data.message,
            data: data.data,
        };
    } catch (error) {
        console.error('Error adding to cart:', error);
        return {
            status: false,
            message: 'Lỗi kết nối mạng',
        };
    }
};
