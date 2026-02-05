'use client';

import { ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Card, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiAddToCart } from '../../../../apis/cart';
import { apiGetMe } from '../../../../apis/user';
import { handleAddToCartHelper } from '../../utils/addToCartHandler';
import './OnlinePromotion.css';

const { Title } = Typography;

const OnlinePromotion = () => {
    const router = useRouter();

    const [events, setEvents] = useState([]);
    const [currentEvents, setCurrentEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [selectedTab, setSelectedTab] = useState('current');
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [displayedBooks, setDisplayedBooks] = useState([]);

    const [user, setUser] = useState(null);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // lấy danh sách sự kiện
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/events');
                const data = await res.json();
                setEvents(data);
                categorizeEvents(data);
            } catch (err) {
                console.error('Error fetching events:', err);
                message.error('Không tải được danh sách sự kiện.');
            }
        };
        fetchEvents();
    }, []);

    // lấy user
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const getUserInfo = async () => {
            try {
                const response = await apiGetMe(token);
                if (response?.status === true) {
                    setUser(response?.user);
                }
            } catch (error) {
                console.error('Error getting user info:', error);
            }
        };
        getUserInfo();
    }, []);

    // thêm vào giỏ
    const handleAddToCart = async (book, qty = 1) => {
        try {
            if (!user) {
                message.warning('Bạn cần đăng nhập để thêm vào giỏ hàng.');
                router.push('/login');
                return;
            }

            await handleAddToCartHelper({
                user,
                bookId: book.id,
                quantity: qty,
                addToCart: apiAddToCart,
                setIsAddingToCart,
                router,
            });
        } catch (e) {
            console.error(e);
            message.error('Thêm vào giỏ thất bại.');
        }
    };

    // phân loại sự kiện
    const categorizeEvents = (eventsData) => {
        const now = new Date();
        const current = [];
        let upcoming = [];

        eventsData.forEach((event) => {
            const startDate = new Date(event.start_date);
            const endDate = new Date(event.end_date);
            if (startDate <= now && endDate >= now) current.push(event);
        });

        const sortedCurrent = current.sort((a, b) => new Date(a.end_date) - new Date(b.end_date));

        if (sortedCurrent.length > 0) {
            const currentEndDate = new Date(sortedCurrent[0].end_date);

            let nearestUpcoming = null;
            let minDistance = Infinity;

            eventsData.forEach((event) => {
                const startDate = new Date(event.start_date);
                if (startDate >= currentEndDate) {
                    const distance = Math.abs(startDate - currentEndDate);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestUpcoming = event;
                    }
                }
            });

            if (nearestUpcoming) upcoming = [nearestUpcoming];
        } else {
            const futureEvents = eventsData.filter((event) => new Date(event.start_date) > now);
            if (futureEvents.length > 0) {
                const sortedFuture = futureEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                upcoming = [sortedFuture[0]];
            }
        }

        setCurrentEvents(sortedCurrent);
        setUpcomingEvents(upcoming);

        if (sortedCurrent.length > 0) {
            setSelectedTab('current');
            setDisplayedBooks(sortedCurrent[0].books || []);
        } else if (upcoming.length > 0) {
            setSelectedTab('upcoming');
            setDisplayedBooks(upcoming[0].books || []);
        } else {
            setDisplayedBooks([]);
        }
    };

    // countdown
    useEffect(() => {
        let timer;

        const updateCountdown = (targetTime) => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance > 0) {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setCountdown({ days, hours, minutes, seconds });
            } else {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setTimeout(() => {
                    categorizeEvents(events);
                }, 1000);
            }
        };

        if (selectedTab === 'current' && currentEvents.length > 0) {
            timer = setInterval(() => updateCountdown(new Date(currentEvents[0].end_date).getTime()), 1000);
        } else if (selectedTab === 'upcoming' && upcomingEvents.length > 0) {
            timer = setInterval(() => updateCountdown(new Date(upcomingEvents[0].start_date).getTime()), 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [selectedTab, currentEvents, upcomingEvents, events]);

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
        if (tab === 'current' && currentEvents.length > 0) {
            setDisplayedBooks(currentEvents[0].books || []);
        } else if (tab === 'upcoming' && upcomingEvents.length > 0) {
            setDisplayedBooks(upcomingEvents[0].books || []);
        } else {
            setDisplayedBooks([]);
        }
    };

    // helper tính phần trăm giảm giá
    const getDiscountPercent = (book) => {
        const p = Number(book.price) || 0;
        const d = Number(book.discount_price) || 0;
        if (!p || !d || d >= p) return 0;
        return Math.round(((p - d) / p) * 100);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(Number(price) || 0) + 'đ';

    const formatDateRange = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startFormatted = `${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(
            2,
            '0',
        )}`;
        const endFormatted = `${String(end.getDate()).padStart(2, '0')}/${String(end.getMonth() + 1).padStart(2, '0')}`;
        return `${startFormatted} - ${endFormatted}`;
    };

    const getCountdownLabel = () =>
        selectedTab === 'current' ? 'Kết thúc sau' : selectedTab === 'upcoming' ? 'Bắt đầu sau' : '';

    return (
        <div className="bookstore-container">
            <div className="section">
                <div className="section-title">
                    <Title level={2}>Khuyến mãi Online</Title>
                </div>

                <div className="tab-navigation">
                    <div className="tabs">
                        <div
                            className={`tab ${selectedTab === 'current' ? 'active' : ''} ${
                                currentEvents.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => currentEvents.length > 0 && handleTabChange('current')}
                        >
                            <div className="tab-header2">
                                {currentEvents.length > 0
                                    ? formatDateRange(currentEvents[0].start_date, currentEvents[0].end_date)
                                    : 'Không có sự kiện'}
                            </div>
                            <div className="tab-title">Đang diễn ra ({currentEvents.length})</div>
                        </div>

                        <div
                            className={`tab ${selectedTab === 'upcoming' ? 'active' : ''} ${
                                upcomingEvents.length === 0 ? 'disabled' : ''
                            }`}
                            onClick={() => upcomingEvents.length > 0 && handleTabChange('upcoming')}
                        >
                            <div className="tab-header2">
                                {upcomingEvents.length > 0
                                    ? formatDateRange(upcomingEvents[0].start_date, upcomingEvents[0].end_date)
                                    : 'Không có sự kiện'}
                            </div>
                            <div className="tab-title">Sắp diễn ra ({upcomingEvents.length})</div>
                        </div>
                    </div>

                    {((selectedTab === 'current' && currentEvents.length > 0) ||
                        (selectedTab === 'upcoming' && upcomingEvents.length > 0)) && (
                        <div className="countdown-container">
                            <span className="countdown-label">{getCountdownLabel()}</span>
                            <div className="countdown-timer">
                                <span className="countdown-item">{String(countdown.days).padStart(2, '0')}</span>
                                <span className="countdown-item">{String(countdown.hours).padStart(2, '0')}</span>
                                <span className="countdown-item">{String(countdown.minutes).padStart(2, '0')}</span>
                                <span className="countdown-item">{String(countdown.seconds).padStart(2, '0')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="books-grid">
                    {displayedBooks.length > 0 ? (
                        displayedBooks.map((book) => (
                            <div key={book.id} className="book-grid-item">
                                <Card className="book-card">
                                    <div className="book-image-container">
                                        <img
                                            src={book?.thumb || 'https://via.placeholder.com/300x400?text=No+Image'}
                                            alt={book?.title || 'Book'}
                                            className="book-image"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    'https://via.placeholder.com/300x400?text=No+Image';
                                            }}
                                        />

                                        {getDiscountPercent(book) > 0 && (
                                            <div className="discount-badge">Ưu đãi đến {getDiscountPercent(book)}%</div>
                                        )}

                                        <div className="book-actions">
                                            <Button
                                                onClick={() => handleAddToCart(book, 1)}
                                                type="text"
                                                icon={<ShoppingCartOutlined />}
                                                className="cart-btn"
                                                loading={isAddingToCart}
                                            />
                                        </div>
                                    </div>

                                    <div className="book-info" onClick={() => router.push(`/book/${book.id}`)}>
                                        <h3 className="book-title">{book.title}</h3>

                                        <div className="price-container">
                                            <span className="current-price">
                                                {formatPrice(
                                                    book.discount_price > 0 ? book.discount_price : book.price,
                                                )}
                                            </span>
                                            {getDiscountPercent(book) > 0 && (
                                                <>
                                                    <span className="original-price">{formatPrice(book.price)}</span>
                                                    <span className="discount-price">-{getDiscountPercent(book)}%</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))
                    ) : (
                        <div className="no-books-message">
                            <p>Không có sách nào trong sự kiện này.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnlinePromotion;
