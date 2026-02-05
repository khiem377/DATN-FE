export const useCart = () => {
    const token = localStorage.getItem('token');

    const addToCart = async (bookId, quantity) => {
        try {
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Trigger cart update events
            window.updateCartCount?.();
            window.dispatchEvent(new CustomEvent('cartUpdated'));

            return {
                success: true,
                data: data,
            };
        } catch (error) {
            console.error('Lỗi khi thêm vào giỏ hàng:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    };

    return {
        addToCart,
    };
};
