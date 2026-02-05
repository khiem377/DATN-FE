'use client';

import {
    ClearOutlined,
    EyeOutlined,
    FilterOutlined,
    HeartFilled,
    HeartOutlined,
    RobotOutlined,
    ShoppingCartOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Col,
    Divider,
    Empty,
    Pagination,
    Row,
    Select,
    Slider,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import axios from 'axios';
import { gsap } from 'gsap';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiAddToCart } from '../../../apis/cart';
import { apiGetAuthors, apiGetCategories, apiGetMe } from '../../../apis/user';
import { handleAddToCartHelper } from '../utils/addToCartHandler'; // <-- dùng helper GIỎ THƯỜNG (đã toast)
import { toggleWishlist } from '../utils/wishlist';
import styles from './search.module.css';

// 🔔 dùng react-toastify
import { toast } from 'react-toastify';
// nhớ mount <ToastContainer /> ở layout/_app nếu chưa

const { Title, Text } = Typography;
const { Option } = Select;

/* =========================
 * Group Cart helpers
 * =======================*/
const apiAddToGroupCart = async (groupToken, bookId, quantity = 1) => {
    if (!groupToken) throw new Error('Không tìm thấy token giỏ hàng nhóm');

    const qtyInt = Number.isFinite(Number(quantity)) ? Math.trunc(Number(quantity)) : 1;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

    const res = await fetch(`${base}/api/group-orders/${groupToken}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ book_id: bookId, quantity: qtyInt }),
    });

    // vẫn check HTTP error trước
    if (!res.ok) {
        let msg = 'Lỗi khi thêm vào giỏ hàng nhóm';
        try {
            const j = await res.json();
            msg = j?.message || msg;
        } catch {}
        throw new Error(msg);
    }
    return res.json(); // { success: true, item: {...} }
};

/* =========================
 * Stock checker (giống BookCard)
 * =======================*/
const checkStock = (book, requestedQty = 1) => {
    const isPhysical = book.is_physical === 1 || book.is_physical === true;
    const stock = parseInt(book?.stock) || 0;

    if (isPhysical) {
        if (stock <= 0) {
            return { canAdd: false, code: 'OUT', stock, message: 'Sản phẩm đã hết hàng' };
        }
        if (requestedQty > stock) {
            return { canAdd: false, code: 'LIMIT', stock, message: `Chỉ còn ${stock} sản phẩm trong kho` };
        }
    }
    return { canAdd: true, code: 'OK', stock, message: '' };
};

/* =========================
 * Book Card (animation + buttons)
 * =======================*/
const AnimatedBookCard = ({
    book,
    onBookClick,
    onAddToCart,
    onAddToGroupCart,
    onToggleWishlist,
    onQuickView,
    currentUser,
    wishlist = [],
    isAddingToCart = false,
    isAddingToGroupCart = false,
}) => {
    const cardRef = useRef(null);
    const actionsRef = useRef(null);
    const imageRef = useRef(null);

    const isPhysical = book.is_physical === 1 || book.is_physical === true;
    const outOfStock = isPhysical && parseInt(book.stock || 0) <= 0;
    const isFavorite = wishlist.includes(book.id);

    const canShowGroupBtn =
        isPhysical &&
        currentUser?.is_group_cart === true &&
        typeof window !== 'undefined' &&
        !!localStorage.getItem('group_cart_token');

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    const renderBookPrice = (b) => {
        if (b.is_physical === 0) {
            return (
                <div className={styles.priceContainer}>
                    <span className={styles.freePrice} style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        Miễn phí
                    </span>
                </div>
            );
        }
        return (
            <div className={styles.priceContainer}>
                <span className={styles.currentPrice}>{formatPrice(b.price)}</span>
                {b.original_price && b.original_price > b.price && (
                    <>
                        <span className={styles.originalPrice}>{formatPrice(b.original_price)}</span>
                        <span className={styles.discountPrice}>
                            -{Math.round(((b.original_price - b.price) / b.original_price) * 100)}%
                        </span>
                    </>
                )}
            </div>
        );
    };

    // GSAP
    useEffect(() => {
        const card = cardRef.current;
        const actions = actionsRef.current;
        const image = imageRef.current;
        if (!card || !actions || !image) return;

        const buttons = actions.querySelectorAll('.action-btn');
        gsap.set(buttons, { y: 30, opacity: 0, scale: 0.8 });

        const enter = () => {
            gsap.to(card, {
                y: -8,
                scale: 1.02,
                boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                duration: 0.4,
                ease: 'power2.out',
            });
            gsap.to(image, { scale: 1.1, duration: 0.6, ease: 'power2.out' });
            gsap.to(buttons, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.08 });
        };
        const leave = () => {
            gsap.to(card, { y: 0, scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', duration: 0.3, ease: 'power2.in' });
            gsap.to(image, { scale: 1, duration: 0.4, ease: 'power2.in' });
            gsap.to(buttons, { y: 30, opacity: 0, scale: 0.8, duration: 0.3, ease: 'power2.in', stagger: 0.05 });
        };

        card.addEventListener('mouseenter', enter);
        card.addEventListener('mouseleave', leave);
        return () => {
            card.removeEventListener('mouseenter', enter);
            card.removeEventListener('mouseleave', leave);
        };
    }, []);

    return (
        <div className={styles.bookGridItem}>
            <Card
                ref={cardRef}
                className={styles.bookCard}
                onClick={() => onBookClick(book.id)}
                style={{
                    height: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'none',
                    cursor: 'pointer',
                }}
            >
                <div
                    className={styles.bookImageContainer}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '280px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: '200px',
                            height: '260px',
                            border: '3px solid #ffffff',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#ffffff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                            position: 'relative',
                        }}
                    >
                        <img
                            ref={imageRef}
                            src={book.cover_image || book.thumb || 'https://via.placeholder.com/300x400?text=No+Image'}
                            alt={book.title}
                            className={styles.bookImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                transition: 'none',
                            }}
                            onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/300x400?text=No+Image';
                            }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.05) 0%, transparent 50%)',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>

                    {book.discount_percent && book.is_physical === 1 && (
                        <div
                            className={styles.discountBadge}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                background: '#ff4d4f',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                zIndex: 10,
                            }}
                        >
                            -{Math.round(book.discount_percent)}%
                        </div>
                    )}

                    {book.is_physical === 0 && (
                        <div
                            className={styles.freeBadge}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                backgroundColor: '#52c41a',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                zIndex: 10,
                            }}
                        >
                            MIỄN PHÍ
                        </div>
                    )}

                    {outOfStock && (
                        <div
                            className={styles.outOfStockOverlay}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                zIndex: 10,
                            }}
                        >
                            <span>Hết hàng</span>
                        </div>
                    )}

                    <div
                        ref={actionsRef}
                        className={styles.bookActions}
                        style={{
                            position: 'absolute',
                            bottom: '15px',
                            right: '15px',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        {/* Wishlist */}
                        <Button
                            type="text"
                            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                            className={`action-btn ${styles.wishlistBtn}`}
                            style={{
                                background: isFavorite ? 'rgba(255,77,79,0.9)' : 'rgba(255,255,255,0.9)',
                                border: '1px solid #d9d9d9',
                                color: isFavorite ? '#fff' : '#595959',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleWishlist && onToggleWishlist(book.id);
                            }}
                        />

                        {/* Personal Cart (physical only) */}
                        {isPhysical && (
                            <Button
                                type="text"
                                icon={<ShoppingCartOutlined />}
                                loading={isAddingToCart}
                                className={`action-btn ${styles.cartBtn}`}
                                style={{
                                    background: 'rgba(24,144,255,0.9)',
                                    border: '1px solid #40a9ff',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(4px)',
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart && onAddToCart(book);
                                }}
                                disabled={outOfStock}
                            />
                        )}

                        {/* Group Cart */}
                        {canShowGroupBtn && (
                            <Tooltip title="Thêm vào giỏ hàng nhóm">
                                <Button
                                    type="text"
                                    icon={<UsergroupAddOutlined />}
                                    loading={isAddingToGroupCart}
                                    className={`action-btn ${styles.groupCartBtn}`}
                                    style={{
                                        background: 'rgba(82,196,26,0.9)',
                                        border: '1px solid #b7eb8f',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddToGroupCart && onAddToGroupCart(book);
                                    }}
                                    disabled={outOfStock}
                                />
                            </Tooltip>
                        )}

                        {/* Quick view */}
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            className={`action-btn ${styles.viewBtn}`}
                            style={{
                                background: 'rgba(82,82,82,0.9)',
                                border: '1px solid #8c8c8c',
                                color: '#fff',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(4px)',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickView && onQuickView(book);
                            }}
                        />
                    </div>
                </div>

                <div className={styles.bookInfo} style={{ padding: '16px' }}>
                    <h3
                        className={styles.bookTitle}
                        style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            margin: '0 0 8px 0',
                            lineHeight: '1.4',
                            color: '#262626',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {book.title}
                    </h3>
                    <span
                        className={styles.bookAuthor}
                        style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '12px', display: 'block' }}
                    >
                        {book?.author?.name}
                    </span>

                    <div style={{ margin: '12px 0' }}>{renderBookPrice(book)}</div>

                    <div className={styles.bookMeta} style={{ marginTop: '12px' }}>
                        <Tag color="blue">{book?.category?.name}</Tag>
                        {book.type && <Tag color="green">{book.type === 'ebook' ? 'Ebook' : 'Sách giấy'}</Tag>}
                        {book.is_physical === 0 && <Tag color="lime">Miễn phí</Tag>}
                        {book.publisher && (
                            <Tag color="purple" style={{ fontSize: '11px' }}>
                                {book.publisher.name}
                            </Tag>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const SearchContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);
    const [pagination, setPagination] = useState({});
    const [authors, setAuthors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [publishers, setPublishers] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [addingToCartIds, setAddingToCartIds] = useState(new Set());
    const [addingGroupIds, setAddingGroupIds] = useState(new Set());

    const [pageSize, setPageSize] = useState(12);
    const [priceDebounce, setPriceDebounce] = useState(null);
    const [filters, setFilters] = useState({
        name: searchParams.get('keyword') || '',
        selectedAuthors: [],
        selectedCategories: searchParams.get('category') ? [searchParams.get('category')] : [],
        selectedPublisher: searchParams.get('publisher') || '',
        publisherName: searchParams.get('publisher_name') || '',
        priceRange: [0, 1000000],
        bookType: searchParams.get('type') || '',
        available: false,
        sort: searchParams.get('sort') || 'popular',
    });
    const [currentPage, setCurrentPage] = useState(1);

    const [isAISearch, setIsAISearch] = useState(false);
    const [aiSearchInfo, setAiSearchInfo] = useState(null);
    const [aiSearchResults, setAiSearchResults] = useState({
        bookTitleResults: [],
        authorResults: [],
        categoryResults: [],
        currentSearchType: null,
    });

    // Load /me (accept {status,user} hoặc {data:{user}})
    useEffect(() => {
        const loadUserData = async () => {
            if (typeof window === 'undefined') return;
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const me = await apiGetMe(token);
                const userData =
                    me?.user ||
                    me?.data?.user ||
                    (me?.status && me?.user ? me.user : null) ||
                    (me?.data && !me?.data?.user ? me.data : null);

                if (userData) {
                    setCurrentUser(userData);
                    if (userData?.wishlist) {
                        setWishlist(userData.wishlist.map((it) => it.book_id || it.id));
                    }
                } else {
                    setCurrentUser(me);
                }
            } catch (e) {
                console.error('Lỗi gọi /me:', e);
            }
        };
        loadUserData();
    }, []);

    useEffect(() => {
        loadAuthors();
        loadCategories();
        loadPublishers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isAISearch && aiSearchInfo) {
            performAISearch();
        } else {
            searchBooks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.get('keyword'), filters, currentPage, pageSize, isAISearch, aiSearchInfo]);

    const handleBookClick = (bookId) => {
        router.push(`/book/${bookId}`);
    };

    /* =========================
     * ADD TO CART (dùng helper + toast)
     * =======================*/
    const handleAddToCart = async (book, qty = 1) => {
        const stockCheck = checkStock(book, qty);
        if (!stockCheck.canAdd) {
            if (stockCheck.code === 'OUT') return toast.error(`🚫 Hết hàng rồi nha\n${book.title}`);
            if (stockCheck.code === 'LIMIT') return toast.warn(`⚠️ Chỉ còn ${stockCheck.stock} cái trong kho.`);
            return;
        }

        try {
            setAddingToCartIds((prev) => new Set(prev).add(book.id));

            await handleAddToCartHelper({
                user: currentUser, // helper sẽ tự toast login + success
                bookId: book.id,
                quantity: qty,
                addToCart: apiAddToCart, // phải trả về { success: boolean, ... }
                setIsAddingToCart: null, // Search list đang xài loading theo id riêng
                router,
            });

            // helper đã bắn toast + updateCartCount + cartUpdated
        } catch (e) {
            // helper đã toast error rồi
            console.error('ADD CART ERROR:', e);
        } finally {
            setAddingToCartIds((prev) => {
                const next = new Set(prev);
                next.delete(book.id);
                return next;
            });
        }
    };

    /* =========================
     * ADD TO GROUP CART (check res.success === true -> toast.success)
     * =======================*/
    const handleAddToGroupCart = async (book, qty = 1) => {
        const stockCheck = checkStock(book, qty);
        if (!stockCheck.canAdd) {
            if (stockCheck.code === 'OUT') return toast.error(`🚫 Hết hàng rồi nha\n${book.title}`);
            if (stockCheck.code === 'LIMIT') return toast.warn(`⚠️ Chỉ còn ${stockCheck.stock} cái trong kho.`);
            return;
        }

        const groupToken = localStorage.getItem('group_cart_token');
        if (!groupToken) return toast.warn('🔗 Chưa có nhóm mua. Vào phòng trước đã.');

        // check login giống cart thường
        if (!currentUser || !currentUser.id) {
            toast.error('🔒 Vui lòng đăng nhập để mua sách!');
            router.push('/login');
            return;
        }

        try {
            setAddingGroupIds((prev) => new Set(prev).add(book.id));

            const res = await apiAddToGroupCart(groupToken, book.id, qty);

            if (res?.success === true) {
                toast.success(`🎉 Đã thêm "${book.title}" x${qty} vào giỏ hàng nhóm!`);
                if (typeof window !== 'undefined') {
                    if (window.updateGroupCartCount) window.updateGroupCartCount();
                    window.dispatchEvent(new CustomEvent('groupCartUpdated', { detail: res.item }));
                }
            } else {
                // API 200 nhưng success=false
                const msg = res?.message || 'Không thể thêm vào giỏ hàng nhóm';
                toast.error(`🚫 ${msg}`);
            }
        } catch (e) {
            toast.error(e?.message || 'Lỗi khi thêm vào giỏ hàng nhóm');
            console.error('GROUP CART ERROR:', e);
        } finally {
            setAddingGroupIds((prev) => {
                const next = new Set(prev);
                next.delete(book.id);
                return next;
            });
        }
    };

    const handleToggleWishlist = async (bookId) => {
        const token = localStorage.getItem('token');
        if (!token) return toast.warn('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
        await toggleWishlist({ bookId, token, wishlist, setWishlist });
        const isFav = wishlist.includes(bookId);
        isFav ? toast.info('Đã xoá khỏi danh sách yêu thích') : toast.success('Đã thêm vào danh sách yêu thích');
    };

    const handleQuickView = (book) => {
        console.log('Quick view:', book);
    };

    const loadAuthors = async () => {
        const response = await apiGetAuthors();
        if (response.success === true) setAuthors(response.data);
    };

    const loadCategories = async () => {
        const response = await apiGetCategories();
        if (response.success === true) setCategories(response.data);
    };

    const loadPublishers = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/publisher');
            const data = await response.json();
            if (data.status) setPublishers(data.data);
        } catch (error) {
            console.error('Error fetching publishers:', error);
        }
    };

    const searchBooks = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchParams.get('keyword')) params.name = searchParams.get('keyword');
            if (filters.selectedAuthors.length > 0) params.author = filters.selectedAuthors.join(',');
            if (filters.selectedCategories.length > 0) params.category = filters.selectedCategories.join(',');
            if (filters.selectedPublisher) params.publisher = filters.selectedPublisher;
            if (filters.priceRange[0] > 0) params.price_min = filters.priceRange[0];
            if (filters.priceRange[1] < 1000000) params.price_max = filters.priceRange[1];
            if (filters.bookType) params.type = filters.bookType === 'physical' ? 'paper' : filters.bookType;
            if (filters.available) params.available = 1;
            if (filters.sort) params.sort = filters.sort;
            params.page = currentPage;
            params.limit = pageSize;

            const response = await axios.get('http://localhost:8000/api/books/search', { params });
            if (response.data.status === 'success') {
                setBooks(response.data.data);
                if (response.data.pagination) setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Lỗi khi tìm kiếm:', err);
        } finally {
            setLoading(false);
        }
    };

    const performAISearch = async () => {
        setLoading(true);
        // ... nếu có AI search riêng thì gắn vào đây
        setLoading(false);
    };

    const handleAuthorChange = (vals) => {
        setFilters((prev) => ({ ...prev, selectedAuthors: vals }));
        setCurrentPage(1);
    };
    const handleCategoryChange = (vals) => {
        setFilters((prev) => ({ ...prev, selectedCategories: vals }));
        setCurrentPage(1);
    };
    const handlePublisherChange = (value) => {
        const selectedPub = publishers.find((pub) => pub.id.toString() === value);
        setFilters((prev) => ({
            ...prev,
            selectedPublisher: value,
            publisherName: selectedPub ? selectedPub.name : '',
        }));
        setCurrentPage(1);
    };
    const handlePriceChange = (value) => {
        if (priceDebounce) clearTimeout(priceDebounce);
        setFilters((prev) => ({ ...prev, priceRange: value }));
        const timeout = setTimeout(() => setCurrentPage(1), 500);
        setPriceDebounce(timeout);
    };
    const handleTypeChange = (value) => {
        setFilters((prev) => ({ ...prev, bookType: value }));
        setCurrentPage(1);
    };
    const handleAvailableChange = (e) => {
        setFilters((prev) => ({ ...prev, available: e.target.checked }));
        setCurrentPage(1);
    };
    const handleSortChange = (value) => {
        setFilters((prev) => ({ ...prev, sort: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            name: '',
            selectedAuthors: [],
            selectedCategories: [],
            selectedPublisher: '',
            publisherName: '',
            priceRange: [0, 1000000],
            bookType: '',
            available: false,
            sort: 'popular',
        });
        setCurrentPage(1);
        setIsAISearch(false);
        setAiSearchInfo(null);
        setAiSearchResults({
            bookTitleResults: [],
            authorResults: [],
            categoryResults: [],
            currentSearchType: null,
        });

        const currentType = searchParams.get('type');
        const currentSort = searchParams.get('sort');
        if (currentType || currentSort) {
            const newParams = new URLSearchParams();
            if (currentType) newParams.set('type', currentType);
            if (currentSort) newParams.set('sort', currentSort);
            router.push(`/search?${newParams.toString()}`);
        } else {
            router.push('/search');
        }
    };

    const handlePageChange = (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) setPageSize(size);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    const getSearchTitle = () => {
        if (filters.bookType === 'ebook') return 'Ebooks';
        if (filters.bookType === 'paper') return 'Sách bán';
        if (filters.selectedPublisher && filters.publisherName)
            return `Sách từ nhà xuất bản: "${filters.publisherName}"`;

        if (isAISearch && aiSearchInfo) {
            if (aiSearchResults.currentSearchType === 'title')
                return `AI OCR.space tìm thấy sách: "${aiSearchInfo.bookTitle}"`;
            if (aiSearchResults.currentSearchType === 'author') return `Sách của tác giả: "${aiSearchInfo.author}"`;
            if (aiSearchResults.currentSearchType === 'category') return `Thể loại: "${aiSearchInfo.category}"`;
            return 'AI OCR.space đang phân tích...';
        }

        if (filters.name) return `Kết quả tìm kiếm: "${filters.name}"`;
        return 'Tất cả sách';
    };

    const renderAISearchAlert = () => {
        if (!isAISearch || !aiSearchInfo) return null;

        let searchTypeText = '';
        let searchValue = '';
        if (aiSearchResults.currentSearchType === 'title') {
            searchTypeText = 'Tìm theo tên sách';
            searchValue = aiSearchInfo.bookTitle;
        } else if (aiSearchResults.currentSearchType === 'author') {
            searchTypeText = 'Tìm theo tác giả';
            searchValue = aiSearchInfo.author;
        } else if (aiSearchResults.currentSearchType === 'category') {
            searchTypeText = 'Tìm theo thể loại';
            searchValue = aiSearchInfo.category;
        } else {
            searchTypeText = 'AI phân tích';
            searchValue = aiSearchInfo.bookTitle || aiSearchInfo.author || aiSearchInfo.category;
        }

        return (
            <Alert
                message={
                    <Space>
                        <RobotOutlined style={{ color: '#1890ff' }} />
                        <span>
                            Kết quả tìm kiếm bằng AI OCR.space ({searchTypeText}):
                            <strong style={{ marginLeft: 4 }}>{searchValue}</strong>
                        </span>
                    </Space>
                }
                type="info"
                showIcon={false}
                style={{ marginBottom: 16 }}
                closable
                onClose={() => {
                    setIsAISearch(false);
                    setAiSearchInfo(null);
                    setAiSearchResults({
                        bookTitleResults: [],
                        authorResults: [],
                        categoryResults: [],
                        currentSearchType: null,
                    });
                    router.push('/search');
                }}
            />
        );
    };

    return (
        <div className={styles.bookstoreContainer}>
            <div className={styles.section}>
                <Row gutter={24}>
                    <Col xs={24} md={6}>
                        <Card
                            title={
                                <Space>
                                    <FilterOutlined />
                                    Bộ lọc
                                </Space>
                            }
                            extra={
                                <Button type="link" icon={<ClearOutlined />} onClick={clearFilters} size="small">
                                    Xóa bộ lọc
                                </Button>
                            }
                            className={styles.filterCard}
                        >
                            <div className={styles.filterSection}>
                                <Title level={5}>Tác giả</Title>
                                <div className={styles.filterCheckboxContainer}>
                                    <Checkbox.Group
                                        value={filters.selectedAuthors}
                                        onChange={handleAuthorChange}
                                        className={styles.filterCheckboxGroup}
                                    >
                                        {authors.map((author) => (
                                            <Checkbox key={author.id} value={author.name}>
                                                {author.name}
                                            </Checkbox>
                                        ))}
                                    </Checkbox.Group>
                                </div>
                            </div>

                            <Divider />

                            <div className={styles.filterSection}>
                                <Title level={5}>Thể loại</Title>
                                <div className={styles.filterCheckboxContainer}>
                                    <Checkbox.Group
                                        value={filters.selectedCategories}
                                        onChange={handleCategoryChange}
                                        className={styles.filterCheckboxGroup}
                                    >
                                        {categories.map((category) => (
                                            <Checkbox key={category.id} value={category.name}>
                                                {category.name}
                                            </Checkbox>
                                        ))}
                                    </Checkbox.Group>
                                </div>
                            </div>

                            <Divider />

                            <div className={styles.filterSection}>
                                <Title level={5}>Nhà xuất bản</Title>
                                <Select
                                    value={filters.selectedPublisher}
                                    onChange={handlePublisherChange}
                                    placeholder="Chọn nhà xuất bản"
                                    style={{ width: '100%' }}
                                    allowClear
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option?.children?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {publishers.map((publisher) => (
                                        <Option key={publisher.id} value={publisher.id.toString()}>
                                            {publisher.name}
                                        </Option>
                                    ))}
                                </Select>
                            </div>

                            <Divider />

                            <div className={styles.filterSection}>
                                <Title level={5}>Khoảng giá</Title>
                                <Slider
                                    range
                                    min={0}
                                    max={1000000}
                                    step={10000}
                                    value={filters.priceRange}
                                    onChange={handlePriceChange}
                                    tooltip={{ formatter: (value) => formatPrice(value) }}
                                />
                                <div className={styles.priceRangeDisplay}>
                                    <Text>{formatPrice(filters.priceRange[0])}</Text>
                                    <Text>{formatPrice(filters.priceRange[1])}</Text>
                                </div>
                            </div>

                            <Divider />

                            <div className={styles.filterSection}>
                                <Title level={5}>Loại sách</Title>
                                <Select
                                    value={filters.bookType}
                                    onChange={handleTypeChange}
                                    placeholder="Chọn loại sách"
                                    style={{ width: '100%' }}
                                    allowClear
                                >
                                    <Option value="ebook">Ebook</Option>
                                    <Option value="paper">Sách giấy</Option>
                                </Select>
                            </div>

                            <Divider />

                            <div className={styles.filterSection}>
                                <Checkbox checked={filters.available} onChange={handleAvailableChange}>
                                    Chỉ hiển thị sách còn hàng
                                </Checkbox>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={18}>
                        {renderAISearchAlert()}

                        <div className={styles.searchHeader}>
                            <div className={styles.searchInfo}>
                                <div className={styles.sectionTitle}>
                                    <Title level={2}>{getSearchTitle()}</Title>
                                </div>
                                {pagination.total && (
                                    <Text type="secondary">
                                        Tìm thấy {pagination.total} kết quả
                                        {isAISearch && (
                                            <Tag color="blue" style={{ marginLeft: 8 }}>
                                                OCR.space{' '}
                                                {aiSearchResults.currentSearchType === 'title'
                                                    ? 'Tên sách'
                                                    : aiSearchResults.currentSearchType === 'author'
                                                    ? 'Tác giả'
                                                    : aiSearchResults.currentSearchType === 'category'
                                                    ? 'Thể loại'
                                                    : 'Phân tích'}
                                            </Tag>
                                        )}
                                        {filters.selectedPublisher && (
                                            <Tag color="green" style={{ marginLeft: 8 }}>
                                                {filters.publisherName}
                                            </Tag>
                                        )}
                                        {filters.bookType && (
                                            <Tag color="orange" style={{ marginLeft: 8 }}>
                                                {filters.bookType === 'ebook'
                                                    ? 'Ebook'
                                                    : filters.bookType === 'paper'
                                                    ? 'Sách giấy'
                                                    : filters.bookType}
                                            </Tag>
                                        )}
                                    </Text>
                                )}
                            </div>

                            <div className={styles.searchControls}>
                                <Select value={filters.sort} onChange={handleSortChange} style={{ width: 200 }}>
                                    <Option value="popular">Phổ biến nhất</Option>
                                    <Option value="price_low">Giá thấp đến cao</Option>
                                    <Option value="price_high">Giá cao đến thấp</Option>
                                    <Option value="newest">Mới nhất</Option>
                                </Select>
                            </div>
                        </div>

                        <Spin spinning={loading}>
                            {books.length > 0 ? (
                                <div className={styles.booksGrid}>
                                    {books.map((book) => (
                                        <AnimatedBookCard
                                            key={book.id}
                                            book={book}
                                            onBookClick={handleBookClick}
                                            onAddToCart={handleAddToCart}
                                            onAddToGroupCart={handleAddToGroupCart}
                                            onToggleWishlist={handleToggleWishlist}
                                            onQuickView={handleQuickView}
                                            currentUser={currentUser}
                                            wishlist={wishlist}
                                            isAddingToCart={addingToCartIds.has(book.id)}
                                            isAddingToGroupCart={addingGroupIds.has(book.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Empty
                                    description={
                                        filters.selectedPublisher && filters.publisherName
                                            ? `Không tìm thấy sách nào từ nhà xuất bản "${filters.publisherName}"`
                                            : isAISearch
                                            ? `OCR.space AI không tìm thấy sách phù hợp với "${
                                                  aiSearchInfo?.bookTitle ||
                                                  aiSearchInfo?.author ||
                                                  aiSearchInfo?.category
                                              }". Thử điều chỉnh bộ lọc hoặc tìm kiếm bằng từ khóa khác.`
                                            : 'Không tìm thấy sách nào'
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            )}
                        </Spin>

                        {pagination.total > 0 && (
                            <div className={styles.paginationContainer}>
                                <Pagination
                                    current={currentPage}
                                    total={pagination.total}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                    showSizeChanger
                                    pageSizeOptions={['5', '10', '20']}
                                    onShowSizeChange={(current, size) => {
                                        setPageSize(size);
                                        setCurrentPage(1);
                                    }}
                                    showQuickJumper
                                    showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} sách`}
                                />
                            </div>
                        )}
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default SearchContent;
