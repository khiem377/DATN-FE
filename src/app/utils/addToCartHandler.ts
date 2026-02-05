// app/bookstore/utils/addToCartHandler.ts
import { message } from 'antd';

interface AddToCartHelperParams {
    user: any;
    bookId: number;
    quantity: number;
    addToCart: (token: string, bookId: number, quantity: number) => Promise<any>;
    setIsAddingToCart: (loading: boolean) => void;
    router: any;
}

export const handleAddToCartHelper = async ({
    user,
    bookId,
    quantity,
    addToCart,
    setIsAddingToCart,
    router,
}: AddToCartHelperParams) => {
    const token = localStorage.getItem('token');

    if (!token) {
        message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        if (router) {
            router.push('/login');
        }
        return;
    }

    try {
        setIsAddingToCart(true);
        const response = await addToCart(token, bookId, quantity);

        if (response?.status === true) {
            message.success('Đã thêm sản phẩm vào giỏ hàng');
        } else {
            message.error(response?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        message.error('Lỗi khi thêm sản phẩm vào giỏ hàng');
    } finally {
        setIsAddingToCart(false);
    }
};

// app/bookstore/utils/wishlist.ts

interface ToggleWishlistParams {
    bookId: number;
    token: string;
    wishlist: number[];
    setWishlist: (wishlist: number[]) => void;
}

export const toggleWishlist = async ({ bookId, token, wishlist, setWishlist }: ToggleWishlistParams) => {
    try {
        const isCurrentlyFavorited = wishlist.includes(bookId);
        const endpoint = isCurrentlyFavorited ? 'unfollow' : 'follow';

        const response = await fetch(`http://localhost:8000/api/books/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ book_id: bookId }),
        });

        const data = await response.json();

        if (data?.status === true) {
            if (isCurrentlyFavorited) {
                setWishlist(wishlist.filter((id) => id !== bookId));
                message.success('Đã xóa khỏi danh sách yêu thích');
            } else {
                setWishlist([...wishlist, bookId]);
                message.success('Đã thêm vào danh sách yêu thích');
            }
        } else {
            message.error(data?.message || 'Không thể thực hiện thao tác');
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        message.error('Lỗi khi thực hiện thao tác');
    }
};
