'use client';

import { HeartFilled, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, InputNumber, Modal, Typography, message } from 'antd';
import { apiAddToCart } from '../../../../../apis/cart';
import { handleAddToCartHelper } from '../../../utils/addToCartHandler';
import { toggleWishlist } from '../../../utils/wishlist';

const { Title, Text, Paragraph } = Typography;

export function QuickViewModal({
    visible,
    onClose,
    book,
    quantity,
    setQuantity,
    user,
    wishlist,
    setWishlist,
    isAddingToCart,
    setIsAddingToCart,
}) {
    if (!book) return null;

    const formatPrice = (price) => {
        if (!price) return '';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const calculateDiscount = (originalPrice, discountPrice) => {
        if (!originalPrice || !discountPrice) return 0;
        return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
    };

    const handleToggleWishlist = async (bookId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            message.warning('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
            return;
        }

        await toggleWishlist({
            bookId,
            token,
            wishlist,
            setWishlist,
        });
    };

    const handleAddToCart = async (book, qty) => {
        await handleAddToCartHelper({
            user,
            bookId: book.id,
            quantity: qty,
            addToCart: apiAddToCart,
            setIsAddingToCart,
            router: null,
        });
        console.log('hihi', handleAddToCart);
    };

    const discount = calculateDiscount(book.price, book.discount_price);
    const isFavorite = wishlist.includes(book.id);

    return (
        <Modal
            title="Xem nhanh sản phẩm"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            className="quick-view-modal"
        >
            <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: '0 0 300px' }}>
                    <div style={{ position: 'relative' }}>
                        {book.discount_price > 0 && book.discount_price < book.price && (
                            <div className="discount-badge">-{discount}%</div>
                        )}
                        <img
                            src={book.cover_image || 'https://via.placeholder.com/300x400?text=No+Image'}
                            alt={book.title}
                            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <Title level={3}>{book.title}</Title>

                    {book.author && (
                        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
                            Tác giả:{' '}
                            {typeof book.author === 'string' ? book.author : book.author?.name || 'Unknown Author'}
                        </Text>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        {book.discount_price > 0 && book.discount_price < book.price ? (
                            <>
                                <Text delete style={{ fontSize: '16px', marginRight: '12px' }}>
                                    {formatPrice(book.price)}
                                </Text>
                                <Text strong style={{ fontSize: '24px', color: '#ff4d4f' }}>
                                    {formatPrice(book.discount_price)}
                                </Text>
                            </>
                        ) : book.price ? (
                            <Text strong style={{ fontSize: '24px' }}>
                                {formatPrice(book.price)}
                            </Text>
                        ) : (
                            <Text style={{ fontSize: '24px', color: '#52c41a' }}>Miễn phí</Text>
                        )}
                    </div>

                    {book.description && (
                        <div style={{ marginBottom: '24px' }}>
                            <Title level={5}>Mô tả:</Title>
                            <Paragraph ellipsis={{ rows: 4, expandable: true }}>{book.description}</Paragraph>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <Text>Số lượng:</Text>
                        <InputNumber
                            min={1}
                            max={99}
                            value={quantity}
                            onChange={(value) => setQuantity(value || 1)}
                            style={{ width: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            type="primary"
                            icon={<ShoppingCartOutlined />}
                            size="large"
                            loading={isAddingToCart}
                            onClick={() => handleAddToCart(book, quantity)}
                        >
                            Thêm vào giỏ hàng
                        </Button>

                        <Button
                            type={isFavorite ? 'primary' : 'default'}
                            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                            size="large"
                            onClick={() => handleToggleWishlist(book.id)}
                            danger={isFavorite}
                        >
                            {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
