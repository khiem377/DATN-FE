'use client';
import {
    BookOutlined,
    CaretRightOutlined,
    DollarOutlined,
    DownOutlined,
    EditOutlined,
    EyeOutlined,
    HeartFilled,
    HeartOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MessageOutlined,
    MinusOutlined,
    NumberOutlined,
    PlusOutlined,
    ReadOutlined,
    ShareAltOutlined,
    ShoppingCartOutlined,
    UpOutlined,
    UserOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Breadcrumb,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Form,
    Input,
    List,
    message,
    Modal,
    Progress,
    Rate,
    Row,
    Space,
    Spin,
    Tabs,
    Tag,
    Typography,
} from 'antd';
import { marked } from 'marked';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import ReactImageMagnify from 'react-image-magnify';
import { toast } from 'react-toastify';

// Import custom hooks
import { useBookDetail } from '../../hooks/useBookDetail';
import { useBookImages } from '../../hooks/useBookImages';
import { useCart } from '../../hooks/useCart';
import { useReviewActions } from '../../hooks/useReviewActions';
import { useReviews } from '../../hooks/useReviews';
import { useReviewStats } from '../../hooks/useReviewStats';
import { useSameAuthorBooks } from '../../hooks/useSameAuthorBooks';
import { useSameCategoryBooks } from '../../hooks/useSameCategoryBooks';
import { useUser } from '../../hooks/useUser';
import { useWishlist } from '../../hooks/useWishlist';

import './BookDetail.css';

// ===== New constants for consistent sizing =====
const COVER_RATIO = 150; // paddingTop percentage for 2:3 ratio (150%)
const CARD_COVER_INSET = 8; // inner frame inset in px
const THUMB_W = 60;
const THUMB_H = 90; // keep 2:3 thumbnails

// Custom hook để fetch chapters data từ API
const useBookChapters = (bookId) => {
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!bookId) return;

        const fetchChapters = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://smartbook.io.vn/api/admin/books/${bookId}/chapters`);
                const data = await response.json();

                if (data.success) {
                    setChapters(data.chapters || []);
                } else {
                    setError('Không thể tải danh sách chương');
                }
            } catch (err) {
                console.error('Error fetching chapters:', err);
                setError('Lỗi khi tải danh sách chương');
            } finally {
                setIsLoading(false);
            }
        };

        fetchChapters();
    }, [bookId]);

    return { chapters, isLoading, error };
};

// Modern BookList component with Swiper slider
const BookList = ({ books }) => {
    const router = useRouter();
    const [showNavigation, setShowNavigation] = useState(false);
    const { user, isLoading, mutate: mutateUser } = useUser();

    const getNames = (field) => {
        if (!field) return 'Không rõ';
        if (Array.isArray(field)) {
            return field.map((item) => (typeof item === 'string' ? item : item.name)).join(', ');
        }
        if (typeof field === 'object' && field.name) return field.name;
        if (typeof field === 'string') return field;
        return 'Không rõ';
    };

    if (!books || !Array.isArray(books) || books.length === 0) {
        return <Empty description="Không có sách nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    // Desktop: Hiển thị grid 5 cột nếu <= 5 sách, slider nếu > 5
    // Mobile: Luôn là scroll horizontal
    const shouldUseSlider = books.length > 5;

    if (!shouldUseSlider) {
        // Grid layout cho <= 5 sách
        return (
            <Row gutter={[16, 24]}>
                {books.map((book, index) => (
                    <Col xs={12} sm={8} md={6} lg={4} xl={4} key={book.id || index}>
                        <BookCard book={book} router={router} getNames={getNames} />
                    </Col>
                ))}
            </Row>
        );
    }

    // Slider layout cho > 5 sách
    return (
        <div
            className="book-slider-container"
            onMouseEnter={() => setShowNavigation(true)}
            onMouseLeave={() => setShowNavigation(false)}
            style={{ position: 'relative' }}
        >
            {/* Desktop Slider */}
            <div className="desktop-slider" style={{ display: 'block' }}>
                <div style={{ position: 'relative' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            overflowX: 'hidden',
                            scrollBehavior: 'smooth',
                            paddingBottom: '10px',
                        }}
                        id="books-slider"
                    >
                        {books.map((book, index) => (
                            <div
                                key={book.id || index}
                                style={{
                                    minWidth: '200px',
                                    maxWidth: '200px',
                                    flex: '0 0 auto',
                                }}
                            >
                                <BookCard book={book} router={router} getNames={getNames} />
                            </div>
                        ))}
                    </div>

                    {/* Navigation arrows - chỉ hiện khi hover */}
                    {showNavigation && (
                        <>
                            <Button
                                className="slider-nav-btn slider-prev"
                                shape="circle"
                                icon={<CaretRightOutlined style={{ transform: 'rotate(180deg)' }} />}
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    backgroundColor: 'white',
                                    border: '1px solid #d9d9d9',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}
                                onClick={() => {
                                    const slider = document.getElementById('books-slider');
                                    slider.scrollLeft -= 220;
                                }}
                            />
                            <Button
                                className="slider-nav-btn slider-next"
                                shape="circle"
                                icon={<CaretRightOutlined />}
                                style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 10,
                                    backgroundColor: 'white',
                                    border: '1px solid #d9d9d9',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}
                                onClick={() => {
                                    const slider = document.getElementById('books-slider');
                                    slider.scrollLeft += 220;
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Scroll - hiển thị khi < 768px */}
            <style jsx>{`
                @media (max-width: 767px) {
                    .desktop-slider {
                        display: none !important;
                    }
                    .mobile-scroll {
                        display: block !important;
                    }
                }
                @media (min-width: 768px) {
                    .mobile-scroll {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="mobile-scroll" style={{ display: 'none' }}>
                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        scrollBehavior: 'smooth',
                        paddingBottom: '10px',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {books.map((book, index) => (
                        <div
                            key={book.id || index}
                            style={{
                                minWidth: '140px',
                                maxWidth: '140px',
                                flex: '0 0 auto',
                            }}
                        >
                            <BookCard book={book} router={router} getNames={getNames} isMobile />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Separate BookCard component
const BookCard = ({ book, router, getNames, isMobile = false }) => {
    return (
        <Card
            hoverable
            className="book-card"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            cover={
                <div
                    style={{
                        position: 'relative',
                        paddingTop: `${COVER_RATIO}%`,
                        overflow: 'hidden',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px 8px 0 0',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            inset: CARD_COVER_INSET,
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1,
                        }}
                    >
                        <img
                            src={book.cover_image || '/placeholder-book.jpg'}
                            alt={book.title}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                display: 'block',
                            }}
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder-book.jpg';
                            }}
                        />
                    </div>

                    {/* Discount badge (kept above frame) */}
                    {book.discount && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                backgroundColor: '#52c41a',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                zIndex: 2,
                            }}
                        >
                            -{book.discount}%
                        </div>
                    )}

                    {/* Out of stock badge */}
                    {book.is_physical === 1 && book.stock === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: '#ff4d4f',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                zIndex: 2,
                            }}
                        >
                            Hết hàng
                        </div>
                    )}
                </div>
            }
            bodyStyle={{
                padding: isMobile ? '12px' : '16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
            }}
            onClick={() => router.push(`/book/${book.id}`)}
        >
            <div style={{ flex: 1 }}>
                {/* Book title (fixed height) */}
                <div
                    style={{
                        fontSize: isMobile ? '13px' : '14px',
                        lineHeight: '1.4',
                        color: '#1890ff',
                        fontWeight: '400',
                        marginBottom: '8px',
                        height: isMobile ? '36px' : '40px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        cursor: 'pointer',
                    }}
                    title={book.title}
                >
                    {book.title || 'Tên sách'}
                </div>

                {/* Author (single line, fixed height) */}
                <div
                    style={{
                        fontSize: isMobile ? '11px' : '12px',
                        color: '#8c8c8c',
                        marginBottom: '12px',
                        height: '18px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {getNames(book.author)}
                </div>
            </div>

            {/* Price section */}
            <div style={{ marginTop: 'auto' }}>
                {/* Rating - chỉ hiển thị nếu có */}
                {book.rating_avg && (
                    <div style={{ marginBottom: '8px' }}>
                        <Rate
                            disabled
                            defaultValue={parseFloat(book.rating_avg)}
                            style={{ fontSize: isMobile ? '10px' : '11px' }}
                            allowHalf
                        />
                        <span style={{ fontSize: '10px', color: '#bfbfbf', marginLeft: '4px' }}>
                            ({book.rating_count || 0})
                        </span>
                    </div>
                )}

                {/* Stock info for physical books */}
                {book.is_physical === 1 && (
                    <div style={{ marginBottom: '8px' }}>
                        <span
                            style={{
                                fontSize: '10px',
                                color: book.stock > 10 ? '#52c41a' : book.stock > 0 ? '#faad14' : '#ff4d4f',
                            }}
                        >
                            {book.stock === 0 ? 'Hết hàng' : `Còn ${book.stock} cuốn`}
                        </span>
                    </div>
                )}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                    {book.original_price && book.original_price !== book.price && (
                        <span
                            style={{
                                fontSize: '11px',
                                color: '#bfbfbf',
                                textDecoration: 'line-through',
                            }}
                        >
                            {Number(book.original_price).toLocaleString('vi-VN')} đ
                        </span>
                    )}
                    <span
                        style={{
                            color: '#262626',
                            fontSize: isMobile ? '14px' : '16px',
                            fontWeight: '600',
                            lineHeight: '1.2',
                        }}
                    >
                        {book.price ? `${Number(book.price).toLocaleString('vi-VN')} đ` : 'Liên hệ'}
                    </span>
                </div>
            </div>
        </Card>
    );
};

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const BookDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    // Helper functions to safely extract string values from objects
    const getAuthorName = (author) => {
        if (!author) return 'Không rõ';
        if (typeof author === 'string') return author;
        if (typeof author === 'object' && author.name) return author.name;
        return 'Không rõ';
    };

    const getCategoryName = (category) => {
        if (!category) return 'Không rõ';
        if (typeof category === 'string') return category;
        if (typeof category === 'object' && category.name) return category.name;
        return 'Không rõ';
    };

    // Local state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedStarFilter, setSelectedStarFilter] = useState('all');
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [mainImage, setMainImage] = useState(null);
    const [activeTab, setActiveTab] = useState('1');
    const [showAllChapters, setShowAllChapters] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [form] = Form.useForm();

    // Custom hooks
    const { book, isLoading: bookLoading, error: bookError, mutate: mutateBook } = useBookDetail(id);
    const { images, isLoading: imagesLoading } = useBookImages(book?.id);
    const { reviewStats, isLoading: statsLoading, mutate: mutateStats } = useReviewStats(book?.id);
    const { reviews, isLoading: reviewsLoading, mutate: mutateReviews } = useReviews(book?.id, selectedStarFilter);

    // Use the new chapters hook
    const { chapters, isLoading: chaptersLoading, error: chaptersError } = useBookChapters(book?.id);

    // Use helper functions for the hooks that need string values
    const { books: sameAuthorBooks, isLoading: authorBooksLoading } = useSameAuthorBooks(book?.author, book?.id);

    const { books: sameCategoryBooks, isLoading: categoryBooksLoading } = useSameCategoryBooks(
        book?.category,
        book?.id,
    );

    const { wishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlist();
    const { user, isLoggedIn, isLoading: userLoading } = useUser();
    const { addToCart } = useCart();
    const { checkCanReview, submitReview } = useReviewActions();

    // Check if book is out of stock
    const isOutOfStock = book?.is_physical === 1 && book?.stock === 0;

    // Validate quantity against stock
    useEffect(() => {
        if (book?.is_physical === 1 && book?.stock && quantity > book.stock) {
            setQuantity(book.stock);
        }
    }, [book?.stock, quantity]);

    // Set main image when images load
    useEffect(() => {
        if (images.length > 0 && !mainImage) {
            const main = images.find((img) => img.is_main === 1);
            setMainImage(main?.image_url || images[0]?.image_url);
        }
    }, [images, mainImage]);

    // Event handlers
    const handleStarFilterChange = (starLevel) => {
        setSelectedStarFilter(starLevel);
    };

    const handleQuantityChange = (action) => {
        const maxQuantity = book?.stock || 99;
        if (action === 'increase' && quantity < maxQuantity) {
            setQuantity((prev) => prev + 1);
        } else if (action === 'decrease' && quantity > 1) {
            setQuantity((prev) => prev - 1);
        }
    };

    const handleQuantityInputChange = (value) => {
        const numValue = parseInt(value) || 1;
        const maxQuantity = book?.stock || 99;
        if (numValue >= 1 && numValue <= maxQuantity) {
            setQuantity(numValue);
        }
    };

    const handleSubmitReview = async (values) => {
        if (!user) {
            toast.error('🔒 Vui lòng đăng nhập để thực hiện hành động này!');
            router.push('/login');
            return false;
        }

        try {
            const data = await submitReview(id, values.rating, values.comment);

            if (data.status) {
                message.success('Đánh giá của bạn đã được gửi thành công!');
                setShowReviewModal(false);
                form.resetFields();

                // Cập nhật lại data
                mutateStats();
                mutateReviews();
            } else {
                message.error(data.message || 'Có lỗi xảy ra khi gửi đánh giá!');
            }
        } catch (error) {
            console.error('Error submitting review:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                // Clear token và redirect
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                message.error('Có lỗi xảy ra khi gửi đánh giá!');
            }
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            toast.error('🔒 Vui lòng đăng nhập để thực hiện hành động này!');
            router.push('/login');
            return;
        }

        if (isOutOfStock) {
            toast.error('🚫 Sách này hiện đã hết hàng!');
            return;
        }

        try {
            setIsAddingToCart(true);
            const result = await addToCart(book.id, quantity);

            if (result.success) {
                toast.success('🎉 Đã thêm sách vào giỏ hàng!');
            } else {
                toast.error(`🚫 ${result.message || result.error || 'Không thể thêm vào giỏ hàng'}`);
            }
        } catch (error) {
            toast.error(`🚨 Lỗi hệ thống: ${error?.response?.data?.message || error.message || 'Không rõ lỗi'}`);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            toast.error('🔒 Vui lòng đăng nhập để thực hiện hành động này!');
            router.push('/login');
            return;
        }

        if (isOutOfStock) {
            toast.error('🚫 Sách này hiện đã hết hàng!');
            return;
        }

        try {
            const checkoutData = {
                items: [
                    {
                        id: book.id,
                        name: book.title || book.name,
                        price: book.price,
                        quantity: 1,
                        image: book.cover_image,
                        author: getAuthorName(book.author),
                    },
                ],
                totalAmount: book.price,
                totalDiscount: 0,
            };

            setIsAddingToCart(true);
            toast.info('🔄 Đang thêm vào giỏ hàng...');

            const result = await addToCart(book.id, 1);

            if (result.success) {
                toast.success(`✅ Đã thêm "${book.title}" vào giỏ hàng!`);

                localStorage.setItem(
                    'buyNowData',
                    JSON.stringify({
                        isBuyNow: true,
                        bookId: book.id,
                        checkoutData,
                        processed: false,
                        timestamp: Date.now(),
                    }),
                );

                setTimeout(() => {
                    toast.info('🛒 Chuyển đến trang đặt đơn...');
                    router.push('/cart');
                }, 800);
            } else {
                toast.error(`🚫 ${result.message || 'Không thể thêm vào giỏ hàng'}`);
            }
        } catch (error) {
            console.error('Lỗi khi thêm vào giỏ hàng:', error);
            toast.error(`🚨 Lỗi hệ thống: ${error.message}`);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleToggleWishlist = async () => {
        if (!user) {
            toast.error('🔒 Vui lòng đăng nhập để thực hiện hành động này!');
            router.push('/login');
            return;
        }

        const success = await toggleWishlist(book.id);
        if (success) {
            const isInWishlist = wishlist.includes(book.id);
            toast.success(isInWishlist ? 'Đã thêm vào yêu thích!' : 'Đã xóa khỏi yêu thích!');
        } else {
            toast.error('Có lỗi xảy ra!');
        }
    };

    const handleOpenReviewModal = async () => {
        if (!user) {
            toast.error('🔒 Vui lòng đăng nhập để thực hiện hành động này!');
            router.push('/login');
            return;
        }

        const { canReview, message: msg } = await checkCanReview(book.id);
        if (!canReview) {
            toast.error(msg);
            return;
        }

        setShowReviewModal(true);
    };

    // Utility functions
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price);
    };

    // Render functions
    const renderStats = () => {
        const baseStats = [
            {
                title: 'Lượt xem',
                value: book?.views || 0,
                prefix: <EyeOutlined />,
                color: '#3f8600',
            },
        ];

        // Chỉ hiển thị giá nếu là sách giấy (is_physical = 1)
        if (book?.is_physical === 1) {
            baseStats.push({
                title: 'Giá',
                value: (
                    <span style={{ color: 'red' }}>
                        <DollarOutlined /> {formatPrice(book?.price)} VND
                    </span>
                ),
                color: 'red',
            });

            // Thêm thông tin tồn kho
            baseStats.push({
                title: 'Tồn kho',
                value: book?.stock || 0,
                prefix: <NumberOutlined />,
                color: book?.stock > 10 ? '#52c41a' : book?.stock > 0 ? '#faad14' : '#ff4d4f',
            });
        }

        // Hiển thị số chương nếu là ebook
        if (book?.is_physical === 0 && chapters.length > 0) {
            baseStats.push({
                title: 'Số chương',
                value: chapters.length,
                prefix: <NumberOutlined />,
                color: '#1890ff',
            });
        }

        return baseStats;
    };

    const renderReviewStats = () => {
        if (statsLoading) {
            return (
                <Card className="review-stats-card" bordered={false}>
                    <Spin />
                </Card>
            );
        }

        return (
            <Card
                title={
                    <Space>
                        <Text strong style={{ fontSize: '16px' }}>
                            Tóm tắt đánh giá
                        </Text>
                        <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                    </Space>
                }
                className="review-stats-card"
                bordered={false}
            >
                <Row gutter={[32, 24]} align="middle">
                    <Col xs={24} md={12} lg={8}>
                        <div className="overall-rating" style={{ textAlign: 'center' }}>
                            <div
                                className="rating-number"
                                style={{
                                    fontSize: '48px',
                                    fontWeight: 'bold',
                                    color: '#262626',
                                    lineHeight: 1,
                                }}
                            >
                                {reviewStats?.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : '0'}
                            </div>
                            <div className="rating-stars" style={{ margin: '8px 0' }}>
                                <Rate
                                    disabled
                                    value={reviewStats?.totalReviews > 0 ? reviewStats.averageRating : 0}
                                    allowHalf
                                    style={{ fontSize: '20px' }}
                                />
                            </div>
                            <div
                                className="rating-count"
                                style={{
                                    color: '#8c8c8c',
                                    fontSize: '14px',
                                }}
                            >
                                {reviewStats?.totalReviews || 0} đánh giá
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} md={12} lg={16}>
                        {reviewStats?.totalReviews > 0 ? (
                            <div className="rating-breakdown">
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <div
                                        key={rating}
                                        className="rating-row"
                                        onClick={() => handleStarFilterChange(rating.toString())}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: '8px',
                                            padding: '4px 0',
                                        }}
                                    >
                                        <span
                                            className="rating-label"
                                            style={{
                                                minWidth: '12px',
                                                textAlign: 'center',
                                                marginRight: '8px',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {rating}
                                        </span>
                                        <Progress
                                            percent={reviewStats.starPercentages?.[rating] || 0}
                                            showInfo={false}
                                            strokeColor="#faad14"
                                            size="small"
                                            style={{
                                                flex: 1,
                                                margin: '0 12px',
                                                height: '8px',
                                            }}
                                        />
                                        <span
                                            className="rating-count-small"
                                            style={{
                                                minWidth: '30px',
                                                textAlign: 'right',
                                                fontSize: '14px',
                                                color: '#595959',
                                            }}
                                        >
                                            {reviewStats.ratingDistribution?.[rating] || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '120px',
                                    color: '#8c8c8c',
                                    fontSize: '14px',
                                }}
                            >
                                Chưa có đánh giá nào
                            </div>
                        )}

                        <Divider style={{ margin: '16px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                                type="link"
                                onClick={() => handleStarFilterChange('all')}
                                style={{
                                    padding: 0,
                                    fontSize: '14px',
                                    color: '#1890ff',
                                }}
                            >
                                → Xem tất cả đánh giá
                            </Button>

                            <Button type="primary" icon={<EditOutlined />} onClick={handleOpenReviewModal} size="small">
                                Viết đánh giá
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card>
        );
    };

    const renderReviews = () => {
        if (reviewsLoading) {
            return <Spin />;
        }

        if (!reviews || reviews.length === 0) {
            return <Empty description="Chưa có đánh giá nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
        }

        return (
            <List
                dataSource={reviews}
                renderItem={(review) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={review.user?.avatar} icon={<UserOutlined />} />}
                            title={
                                <Space>
                                    <Text strong>{review.user?.name || 'Người dùng ẩn danh'}</Text>
                                    <Rate disabled defaultValue={review.rating} style={{ fontSize: '12px' }} />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {review.timeAgo}
                                    </Text>
                                </Space>
                            }
                            description={
                                <div>
                                    <Paragraph style={{ marginBottom: 8 }}>{review.comment}</Paragraph>
                                    <Space>
                                        <Button type="text" size="small" icon={<MessageOutlined />}>
                                            Phản hồi
                                        </Button>
                                        <Text type="secondary">{review.likes} lượt thích</Text>
                                    </Space>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        );
    };

    const renderBookImages = () => {
        if (imagesLoading) {
            return <Spin />;
        }

        if (!images || images.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    {/* Fallback frame so cover is always fully shown */}
                    <div
                        style={{
                            width: 300,
                            height: 450,
                            margin: '0 auto',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={book?.cover_image || '/placeholder-book.jpg'}
                            alt={book?.title}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    {/* Wrap magnify image with a fixed 2:3 frame so it never bleeds */}
                    <div
                        style={{
                            width: 300,
                            height: 450,
                            margin: '0 auto',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            padding: 6,
                        }}
                    >
                        <ReactImageMagnify
                            {...{
                                smallImage: {
                                    alt: book?.title,
                                    isFluidWidth: true,
                                    src: mainImage || book?.cover_image,
                                },
                                largeImage: {
                                    src: mainImage || book?.cover_image,
                                    width: 1200,
                                    height: 1800,
                                },
                                enlargedImageContainerStyle: { zIndex: 1500 },
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                </div>

                {images.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {images.map((img, index) => (
                            <div
                                key={index}
                                style={{
                                    width: THUMB_W,
                                    height: THUMB_H,
                                    cursor: 'pointer',
                                    border: mainImage === img.image_url ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onClick={() => setMainImage(img.image_url)}
                            >
                                <img
                                    src={img.image_url}
                                    alt={`${book?.title} - ${index + 1}`}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render Mục lục với dữ liệu từ API
    const renderChaptersList = () => {
        if (chaptersLoading) {
            return (
                <Card
                    title={
                        <Space>
                            <BookOutlined />
                            <Text strong>Mục lục</Text>
                        </Space>
                    }
                    style={{ marginBottom: '24px' }}
                >
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                        <Text style={{ display: 'block', marginTop: '16px', color: '#8c8c8c' }}>
                            Đang tải danh sách chương...
                        </Text>
                    </div>
                </Card>
            );
        }

        if (chaptersError) {
            return (
                <Card
                    title={
                        <Space>
                            <BookOutlined />
                            <Text strong>Mục lục</Text>
                        </Space>
                    }
                    style={{ marginBottom: '24px' }}
                >
                    <Empty description={chaptersError} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Card>
            );
        }

        if (!chapters || chapters.length === 0) {
            return (
                <Card
                    title={
                        <Space>
                            <BookOutlined />
                            <Text strong>Mục lục</Text>
                        </Space>
                    }
                    style={{ marginBottom: '24px' }}
                >
                    <Empty description="Chưa có chương nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Card>
            );
        }

        const displayChapters = showAllChapters ? chapters : chapters.slice(0, 5);

        return (
            <Card
                title={
                    <Space>
                        <BookOutlined />
                        <Text strong>Mục lục</Text>
                        <Text type="secondary">({chapters.length} chương)</Text>
                    </Space>
                }
                style={{ marginBottom: '24px' }}
            >
                <div
                    style={{
                        maxHeight: showAllChapters ? '400px' : 'none',
                        overflowY: showAllChapters ? 'auto' : 'visible',
                        paddingRight: showAllChapters ? '8px' : '0',
                    }}
                >
                    <List
                        dataSource={displayChapters}
                        renderItem={(chapter) => (
                            <List.Item
                                style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                }}
                                onClick={() => {
                                    localStorage.setItem('currentBookId', book.id.toString());
                                    localStorage.setItem('currentChapterId', chapter.id.toString());

                                    router.push(`/chapterdetail`);
                                }}
                            >
                                <List.Item.Meta
                                    title={<Text strong>{chapter.title}</Text>}
                                    description={
                                        <Space>
                                            <Text type="secondary">Chương {chapter.chapter_order}</Text>
                                            <Text type="secondary">•</Text>
                                            <Text type="secondary">
                                                {chapter.content_type === 'pdf' ? 'Định dạng PDF' : 'Văn bản'}
                                            </Text>
                                            {chapter.pdf_filename && (
                                                <>
                                                    <Text type="secondary">•</Text>
                                                    <Text type="secondary">{chapter.pdf_filename}</Text>
                                                </>
                                            )}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>

                {chapters.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Button
                            type="dashed"
                            icon={showAllChapters ? <UpOutlined /> : <DownOutlined />}
                            onClick={() => setShowAllChapters(!showAllChapters)}
                            style={{
                                borderColor: '#1890ff',
                                color: '#1890ff',
                            }}
                        >
                            {showAllChapters ? 'Thu gọn' : `Xem thêm ${chapters.length - 5} chương`}
                        </Button>
                    </div>
                )}

                {/* Scroll indicator khi đang expand */}
                {showAllChapters && chapters.length > 8 && (
                    <div
                        style={{
                            textAlign: 'center',
                            marginTop: '8px',
                            color: '#8c8c8c',
                            fontSize: '12px',
                        }}
                    >
                        <Text type="secondary">↕️ Cuộn để xem thêm chương</Text>
                    </div>
                )}
            </Card>
        );
    };

    // Render Sách cùng tác giả riêng biệt
    const renderSameAuthorBooks = () => {
        if (authorBooksLoading) {
            return (
                <Card title={<Text strong>Sách cùng tác giả</Text>} style={{ marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                    </div>
                </Card>
            );
        }

        if (!sameAuthorBooks || sameAuthorBooks.length === 0) {
            return (
                <Card title={<Text strong>Sách cùng tác giả</Text>} style={{ marginBottom: '24px' }}>
                    <Empty description="Không có sách cùng tác giả" />
                </Card>
            );
        }

        return (
            <Card
                title={
                    <Space>
                        <UserOutlined />
                        <Text strong>Sách cùng tác giả: {getAuthorName(book?.author)}</Text>
                        <Text type="secondary">({sameAuthorBooks.length} sách)</Text>
                    </Space>
                }
                style={{ marginBottom: '24px' }}
            >
                {/* BookList -> BookCard now has an inner frame so all covers are fully visible */}
                <BookList books={sameAuthorBooks} />
            </Card>
        );
    };

    // Render Sách cùng thể loại riêng biệt
    const renderSameCategoryBooks = () => {
        if (categoryBooksLoading) {
            return (
                <Card title={<Text strong>Sách cùng thể loại</Text>} style={{ marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Spin size="large" />
                    </div>
                </Card>
            );
        }

        if (!sameCategoryBooks || sameCategoryBooks.length === 0) {
            return (
                <Card title={<Text strong>Sách cùng thể loại</Text>} style={{ marginBottom: '24px' }}>
                    <Empty description="Không có sách cùng thể loại" />
                </Card>
            );
        }

        return (
            <Card
                title={
                    <Space>
                        <BookOutlined />
                        <Text strong>Sách cùng thể loại: {getCategoryName(book?.category)}</Text>
                        <Text type="secondary">({sameCategoryBooks.length} sách)</Text>
                    </Space>
                }
                style={{ marginBottom: '24px' }}
            >
                <BookList books={sameCategoryBooks} />
            </Card>
        );
    };

    // Function to render tabs based on book type (chỉ còn tab đánh giá)
    const renderTabs = () => {
        const tabs = [];

        // Tab đánh giá - chỉ hiển thị nếu is_physical = 1
        if (book?.is_physical === 1) {
            tabs.push(
                <TabPane tab="Đánh giá" key="1">
                    <div style={{ marginBottom: '24px' }}>{renderReviewStats()}</div>

                    {/* Star Filter */}
                    <div style={{ marginBottom: '16px' }}>
                        <Space>
                            <Text>Lọc theo sao:</Text>
                            <Button
                                size="small"
                                type={selectedStarFilter === 'all' ? 'primary' : 'default'}
                                onClick={() => handleStarFilterChange('all')}
                            >
                                Tất cả
                            </Button>
                            {[5, 4, 3, 2, 1].map((star) => (
                                <Button
                                    key={star}
                                    size="small"
                                    type={selectedStarFilter === star.toString() ? 'primary' : 'default'}
                                    onClick={() => handleStarFilterChange(star.toString())}
                                >
                                    {star} sao
                                </Button>
                            ))}
                        </Space>
                    </div>

                    {renderReviews()}
                </TabPane>,
            );
        }

        return tabs;
    };

    // Render description với chức năng show more/less
    const renderDescription = () => {
        const description = book?.description || 'Chưa có mô tả';
        const maxLength = 200; // Giảm xuống để phù hợp với layout

        if (description.length <= maxLength) {
            // Nếu mô tả ngắn, hiển thị toàn bộ
            return (
                <div
                    style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#555',
                        marginTop: '16px',
                    }}
                    dangerouslySetInnerHTML={{
                        __html: marked(description),
                    }}
                />
            );
        }

        // Nếu mô tả dài, cần show more/less
        const shortDescription = showFullDescription ? description : description.substring(0, maxLength) + '...';

        return (
            <div style={{ marginTop: '16px' }}>
                <div
                    style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#555',
                    }}
                    dangerouslySetInnerHTML={{
                        __html: marked(shortDescription),
                    }}
                />
                <div style={{ marginTop: '8px' }}>
                    <Button
                        type="link"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        style={{
                            padding: 0,
                            fontSize: '12px',
                            color: '#1890ff',
                            height: 'auto',
                        }}
                    >
                        {showFullDescription ? (
                            <>
                                <UpOutlined style={{ marginRight: '4px', fontSize: '10px' }} />
                                Thu gọn
                            </>
                        ) : (
                            <>
                                <DownOutlined style={{ marginRight: '4px', fontSize: '10px' }} />
                                Xem thêm
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    // Loading state
    if (bookLoading || userLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Error state
    if (bookError || !book) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Empty description="Không tìm thấy sách" />
            </div>
        );
    }

    return (
        <div className="book-detail-page scaled-80" style={{ padding: '24px' }}>
            {/* Global 80% scale for the whole page */}
            <style jsx global>{`
                .scaled-80 {
                    zoom: 0.8;
                }
                /* Fallback for browsers not supporting zoom */
                @supports not (zoom: 0.8) {
                    .scaled-80 {
                        transform: scale(0.8);
                        transform-origin: top left;
                        width: 125%;
                    }
                }
            `}</style>

            {/* Breadcrumb */}
            <Breadcrumb style={{ marginBottom: '24px' }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                    <span>Trang chủ</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <BookOutlined />
                    <span>Sách</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{book.title}</Breadcrumb.Item>
            </Breadcrumb>

            <Row gutter={[24, 24]}>
                {/* Left Column - Book Images */}
                <Col xs={24} md={8} lg={6}>
                    <Card bordered={false}>{renderBookImages()}</Card>
                </Col>

                {/* Middle Column - Book Info */}
                <Col xs={24} md={12} lg={12}>
                    <Card bordered={false} style={{ height: '100%' }}>
                        <Title level={2} style={{ marginBottom: '16px', fontSize: '20px' }}>
                            {book.title}
                        </Title>

                        <Descriptions column={1} size="small" style={{ marginBottom: '16px' }}>
                            <Descriptions.Item label="Tác giả">
                                <Text strong style={{ fontSize: '14px' }}>
                                    {getAuthorName(book?.author)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thể loại">
                                <Tag color="blue" style={{ fontSize: '12px' }}>
                                    {getCategoryName(book?.category)}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Năm xuất bản">
                                <Text style={{ fontSize: '14px' }}>{book?.publication_year || 'Không rõ'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Định dạng">
                                <Tag color={book?.is_physical === 0 ? 'green' : 'orange'} style={{ fontSize: '12px' }}>
                                    {book?.is_physical === 0 ? 'Sách điện tử' : 'Sách giấy'}
                                </Tag>
                            </Descriptions.Item>
                            {/* Hiển thị tình trạng tồn kho cho sách giấy */}
                            {book?.is_physical === 1 && (
                                <Descriptions.Item label="Tình trạng">
                                    <Tag
                                        color={book?.stock > 10 ? 'green' : book?.stock > 0 ? 'orange' : 'red'}
                                        style={{ fontSize: '12px' }}
                                    >
                                        {book?.stock === 0 ? 'Hết hàng' : `Còn ${book.stock} cuốn`}
                                    </Tag>
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        {/* Out of stock alert */}
                        {isOutOfStock && (
                            <Alert
                                message="Sách hiện đã hết hàng"
                                description="Sản phẩm tạm thời không có sẵn. Vui lòng liên hệ để được tư vấn."
                                type="warning"
                                icon={<WarningOutlined />}
                                style={{ marginBottom: '16px' }}
                                showIcon
                                size="small"
                            />
                        )}

                        {/* Stats */}
                        <Row gutter={[8, 8]} style={{ marginBottom: '16px' }}>
                            {renderStats().map((stat, index) => (
                                <Col span={8} key={index}>
                                    <Card size="small" style={{ textAlign: 'center', fontSize: '12px' }}>
                                        <Space size="small">
                                            {stat.prefix &&
                                                React.cloneElement(stat.prefix, { style: { fontSize: '12px' } })}
                                            <Text style={{ color: stat.color, fontSize: '12px' }}>
                                                {stat.title && `${stat.title}: `}
                                                {stat.value}
                                            </Text>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {/* Description - Hiển thị trực tiếp không dùng Collapse */}
                        <div style={{ marginBottom: '16px' }}>
                            <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                                Mô tả sách
                            </Text>
                            {renderDescription()}
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Actions */}
                <Col xs={24} md={4} lg={6}>
                    <Card title="Thao tác" bordered={false}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {/* Price - chỉ hiển thị nếu là sách giấy */}
                            {book.is_physical === 1 && (
                                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                    {Number(book.discount_price) > 0 &&
                                    Number(book.discount_price) < Number(book.price) ? (
                                        <>
                                            <Text
                                                style={{
                                                    fontSize: '20px',
                                                    textDecoration: 'line-through',
                                                    color: '#888',
                                                    marginRight: '8px',
                                                }}
                                            >
                                                {formatPrice(book.price)} VND
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: '24px',
                                                    fontWeight: 'bold',
                                                    color: 'red',
                                                }}
                                            >
                                                {formatPrice(book.discount_price)} VND
                                            </Text>
                                        </>
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: 'red',
                                            }}
                                        >
                                            {formatPrice(book.price)} VND
                                        </Text>
                                    )}
                                </div>
                            )}

                            {/* Quantity - chỉ hiển thị nếu là sách giấy và có tồn kho */}
                            {book.is_physical === 1 && book.stock > 0 && (
                                <div>
                                    <Text strong>Số lượng:</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                        <Button
                                            icon={<MinusOutlined />}
                                            size="small"
                                            onClick={() => handleQuantityChange('decrease')}
                                            disabled={quantity <= 1}
                                        />
                                        <Input
                                            value={quantity}
                                            onChange={(e) => handleQuantityInputChange(e.target.value)}
                                            style={{ width: '60px', textAlign: 'center', margin: '0 8px' }}
                                            size="small"
                                            max={book.stock}
                                        />
                                        <Button
                                            icon={<PlusOutlined />}
                                            size="small"
                                            onClick={() => handleQuantityChange('increase')}
                                            disabled={quantity >= book.stock}
                                        />
                                    </div>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}
                                    >
                                        Tối đa {book.stock} cuốn
                                    </Text>
                                </div>
                            )}

                            {/* Action Buttons - Logic theo yêu cầu */}
                            {book.is_physical === 0 ? (
                                // Sách điện tử - chỉ hiển thị nút "Đọc sách"
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    icon={<ReadOutlined />}
                                    onClick={() => router.push(`/reader/${book.id}`)}
                                >
                                    Đọc sách
                                </Button>
                            ) : (
                                // Sách giấy - hiển thị "Mua ngay" và "Thêm vào giỏ hàng"
                                <>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleBuyNow}
                                        loading={isAddingToCart}
                                        disabled={isOutOfStock}
                                    >
                                        {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                                    </Button>

                                    <Button
                                        size="large"
                                        block
                                        icon={<ShoppingCartOutlined />}
                                        onClick={handleAddToCart}
                                        loading={isAddingToCart}
                                        disabled={isOutOfStock}
                                    >
                                        {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                                    </Button>
                                </>
                            )}

                            <Button
                                size="large"
                                block
                                icon={
                                    wishlist?.includes(book.id) ? (
                                        <HeartFilled style={{ color: 'red' }} />
                                    ) : (
                                        <HeartOutlined />
                                    )
                                }
                                onClick={handleToggleWishlist}
                                loading={wishlistLoading}
                            >
                                {wishlist?.includes(book.id) ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                            </Button>

                            <Button size="large" block icon={<ShareAltOutlined />}>
                                Chia sẻ
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Tabs Section - chỉ còn tab đánh giá cho sách giấy */}
            {book?.is_physical === 1 && (
                <Row style={{ marginBottom: '32px' }}>
                    <Col span={24}>
                        <Tabs activeKey={activeTab} onChange={setActiveTab}>
                            {renderTabs()}
                        </Tabs>
                    </Col>
                </Row>
            )}

            {/* Mục lục - chỉ hiển thị cho ebook (is_physical = 0) */}
            {book?.is_physical === 0 && renderChaptersList()}

            {/* Sách cùng tác giả - luôn hiển thị */}
            {renderSameAuthorBooks()}

            {/* Sách cùng thể loại - luôn hiển thị */}
            {renderSameCategoryBooks()}

            {/* Review Modal */}
            <Modal
                title="Viết đánh giá"
                open={showReviewModal}
                onCancel={() => {
                    setShowReviewModal(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
                    <Form.Item
                        name="rating"
                        label="Đánh giá"
                        rules={[{ required: true, message: 'Vui lòng chọn số sao!' }]}
                    >
                        <Rate allowHalf />
                    </Form.Item>

                    <Form.Item
                        name="comment"
                        label="Nhận xét"
                        rules={[
                            { required: true, message: 'Vui lòng nhập nhận xét!' },
                            { min: 10, message: 'Nhận xét phải có ít nhất 10 ký tự!' },
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    form.resetFields();
                                }}
                            >
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Gửi đánh giá
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BookDetailPage;
