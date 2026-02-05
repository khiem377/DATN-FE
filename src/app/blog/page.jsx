'use client';
import { EyeOutlined, HeartOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, message, Row, Spin, Typography } from 'antd';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import { Autoplay, Navigation, Pagination as SwiperPagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import { Eye, Heart } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const { Title, Text, Paragraph } = Typography;

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const CoffeeBlogInterface = () => {
    const [allPosts, setAllPosts] = useState([]);
    const [pinnedPosts, setPinnedPosts] = useState([]);
    const [popularPosts, setPopularPosts] = useState([]);
    const [recentPosts, setRecentPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const heroRef = useRef(null);
    const cardsRef = useRef([]);
    const timelineRef = useRef(null);
    const swiperRef = useRef(null);

    // Animation effects with GSAP
    useEffect(() => {
        // Hero section animation
        if (heroRef.current) {
            gsap.fromTo(
                heroRef.current,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
            );
        }

        // Cards animation
        cardsRef.current.forEach((card, index) => {
            if (card) {
                gsap.fromTo(
                    card,
                    { opacity: 0, y: 30, scale: 0.95 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 80%',
                            once: true,
                        },
                    },
                );
            }
        });

        // Timeline animation
        if (timelineRef.current) {
            gsap.fromTo(
                timelineRef.current.children,
                { opacity: 0, x: -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: timelineRef.current,
                        start: 'top 70%',
                        once: true,
                    },
                },
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
    }, [pinnedPosts, recentPosts, popularPosts]);

    // API calls
    useEffect(() => {
        fetchAllData();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage?.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchWithAuth = async (url) => {
        return fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
        });
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPinnedPosts(), fetchPopularPosts(), fetchAllPosts(), fetchRecentPosts()]);
        } catch (err) {
            console.error('Lỗi tải dữ liệu:', err);
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const fetchPinnedPosts = async () => {
        try {
            const res = await fetchWithAuth('http://localhost:8000/api/posts/pinned');
            const result = await res.json();
            if (result.success) {
                setPinnedPosts(result.data);
            }
        } catch (err) {
            console.error('Lỗi tải bài ghim:', err);
        }
    };

    const fetchPopularPosts = async () => {
        try {
            const res = await fetchWithAuth('http://localhost:8000/api/posts/popular');
            const result = await res.json();
            if (result.success) {
                setPopularPosts(result.data);
            }
        } catch (err) {
            console.error('Lỗi tải bài phổ biến:', err);
        }
    };

    const fetchAllPosts = async () => {
        try {
            const res = await fetchWithAuth('http://localhost:8000/api/posts?per_page=50');
            const result = await res.json();
            if (result.success) {
                setAllPosts(result.data);
            }
        } catch (err) {
            console.error('Lỗi tải tất cả bài viết:', err);
        }
    };

    const fetchRecentPosts = async () => {
        try {
            const res = await fetchWithAuth('http://localhost:8000/api/posts?per_page=10&sort=created_at');
            const result = await res.json();
            if (result.success) {
                setRecentPosts(result.data);
            }
        } catch (err) {
            console.error('Lỗi tải bài viết mới:', err);
        }
    };

    const handleLike = async (postId) => {
        const token = localStorage?.getItem('token');
        if (!token) return message.warning('Vui lòng đăng nhập để thả tim');

        try {
            const res = await fetch(`http://localhost:8000/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                // Refresh data
                fetchAllData();
            }
        } catch (err) {
            console.error('Lỗi khi like:', err);
        }
    };

    const handleClick = (slug, id) => {
        const viewedKey = `viewed_${slug}`;
        if (!sessionStorage.getItem(viewedKey)) {
            fetch(`http://localhost:8000/api/posts/${slug}/view`, { method: 'POST' });
            sessionStorage.setItem(viewedKey, 'true');
        }
        localStorage.setItem('postid', id);
        window.location.href = `/blog/${slug}`;
    };

    const formatDate = (dateString) => {
        // Chuyển "26/07/2025" => "2025-07-26"
        const [day, month, year] = dateString.split('/');
        const isoDate = `${year}-${month}-${day}`;
        return new Date(isoDate).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const cleanAndTruncateText = (htmlText, maxLength = 100) => {
        if (!htmlText) return '';
        const textOnly = htmlText
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        if (textOnly.length <= maxLength) return textOnly;
        return textOnly.substring(0, maxLength) + '...';
    };

    // Featured Blog Card (Left side - large)
    const FeaturedBlogCard = () => {
        const [isHovered, setIsHovered] = useState(false);

        // Get featured post (first pinned post or first post)
        const featuredPost = pinnedPosts[0] || allPosts[0];

        if (!featuredPost) return null;

        return (
            <Card
                hoverable
                className="featured-card"
                style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    height: '500px',
                    position: 'relative',
                    border: 'none',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => handleClick(featuredPost.slug, featuredPost.id)}
                bodyStyle={{ padding: 0, height: '100%' }}
            >
                {/* Background Image */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${
                            featuredPost.thumbnail ||
                            'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&h=500'
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.4s ease',
                    }}
                />

                {/* Gradient Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background:
                            'linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)',
                        zIndex: 1,
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '40px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        color: 'white',
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '30px',
                            left: '30px',
                            background: featuredPost.is_pinned ? '#ff4d4f' : '#FFC107',
                            color: featuredPost.is_pinned ? '#fff' : '#000',
                            padding: '8px 16px',
                            borderRadius: '25px',
                            fontSize: '14px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {featuredPost.is_pinned ? '📌 Bài ghim' : 'Nổi bật'}
                    </div>

                    {/* Title */}
                    <Title
                        level={1}
                        style={{
                            color: 'white',
                            margin: '0 0 20px 0',
                            fontSize: '32px',
                            lineHeight: '1.2',
                            fontWeight: '800',
                            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        {featuredPost.title}
                    </Title>

                    {/* Excerpt */}
                    <Paragraph
                        style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '16px',
                            margin: '0 0 24px 0',
                            lineHeight: '1.6',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        {cleanAndTruncateText(featuredPost.excerpt, 200)}
                    </Paragraph>

                    {/* Meta Info */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#FFC107' }} />
                            <div>
                                <Text style={{ color: 'white', fontSize: '14px', fontWeight: '600', display: 'block' }}>
                                    Admin
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                                    {formatDate(featuredPost.created_at)}
                                </Text>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Button
                                type="text"
                                icon={<HeartOutlined />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(featuredPost.id);
                                }}
                                style={{
                                    color: featuredPost.has_liked ? '#ff4d4f' : 'white',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '20px',
                                }}
                            >
                                {featuredPost.like_count || 0}
                            </Button>

                            <Button
                                type="primary"
                                style={{
                                    background: '#FFC107',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '25px',
                                    fontWeight: '600',
                                    height: '40px',
                                    paddingLeft: '24px',
                                    paddingRight: '24px',
                                }}
                            >
                                Xem chi tiết →
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    // Timeline Item Component
    const TimelineItem = ({ post, index }) => (
        <div
            ref={(el) => (cardsRef.current[index] = el)}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '20px 0',
                borderBottom: index < recentPosts.length - 1 ? '1px solid #f0f0f0' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
            }}
            className="timeline-item"
            onClick={() => handleClick(post.slug, post.id)}
        >
            {/* Date Badge */}
            <div
                style={{
                    minWidth: '70px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    background: '#000',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                }}
            >
                {formatDate(post.created_at).slice(0, 5)}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <h5
                    style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        lineHeight: '1.4',
                        color: '#333',
                        fontWeight: '600',
                    }}
                >
                    {post.title}
                </h5>
                <div
                    style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.5',
                    }}
                >
                    {cleanAndTruncateText ? cleanAndTruncateText(post.excerpt, 80) : post.excerpt}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#888' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} />
                        {post.views || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={12} />
                        {post.like_count || 0}
                    </span>
                </div>
            </div>
        </div>
    );

    // Swiper Card Component
    const SwiperCard = ({ post, index }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <Card
                hoverable
                style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    height: '280px',
                    position: 'relative',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => handleClick(post.slug, post.id)}
                bodyStyle={{ padding: 0, height: '100%' }}
            >
                {/* Image */}
                <div
                    style={{
                        height: '60%',
                        backgroundImage: `url(${
                            post.thumbnail || 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&h=200'
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Label */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                            background: post.is_pinned ? '#ff4d4f' : '#FFC107',
                            color: post.is_pinned ? '#fff' : '#000',
                            padding: '4px 12px',
                            borderRadius: '15px',
                            fontSize: '11px',
                            fontWeight: '600',
                        }}
                    >
                        {post.topics && post.topics[0] ? post.topics[0].name : 'Tin tức'}
                    </div>
                </div>

                {/* Content */}
                <div
                    style={{
                        padding: '16px',
                        height: '40%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <Title
                        level={5}
                        style={{
                            margin: '0 0 8px 0',
                            fontSize: '14px',
                            lineHeight: '1.3',
                            color: '#333',
                            fontWeight: '600',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {post.title}
                    </Title>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: '#888',
                        }}
                    >
                        <span>{formatDate(post.created_at)}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <EyeOutlined />
                                {post.views || 0}
                            </span>
                            <Button
                                type="text"
                                icon={<HeartOutlined />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(post.id);
                                }}
                                style={{
                                    color: post.has_liked ? '#ff4d4f' : '#888',
                                    border: 'none',
                                    padding: '0 4px',
                                    height: 'auto',
                                    fontSize: '12px',
                                }}
                            >
                                {post.like_count || 0}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    background: '#ffffff',
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            {/* Main Content Container */}
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '40px 20px',
                }}
            >
                {/* Top Section: Featured Post + Timeline */}
                <Row gutter={[32, 32]} style={{ marginBottom: '60px' }}>
                    {/* Featured Post - Left */}
                    <Col xs={24} lg={14}>
                        <div ref={heroRef}>
                            <FeaturedBlogCard />
                        </div>
                    </Col>

                    {/* Timeline - Right */}
                    <Col xs={24} lg={10}>
                        <div
                            ref={timelineRef}
                            style={{
                                background: '#ffffff',
                                borderRadius: '20px',
                                padding: '30px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                height: '500px',
                                overflowY: 'auto',
                            }}
                            className="timeline-container"
                        >
                            <Title
                                level={3}
                                style={{
                                    margin: '0 0 30px 0',
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: '#333',
                                    textAlign: 'center',
                                    borderBottom: '2px solid #FFC107',
                                    paddingBottom: '15px',
                                }}
                            >
                                Tin Tức Mới Nhất
                            </Title>

                            {recentPosts.slice(0, 5).map((item, index) => (
                                <TimelineItem key={item.id} post={item} index={index} />
                            ))}
                        </div>
                    </Col>
                </Row>

                {/* Bottom Section: Swiper */}
                <div>
                    <Title
                        level={2}
                        style={{
                            textAlign: 'center',
                            marginBottom: '40px',
                            color: '#333',
                            fontSize: '32px',
                            fontWeight: '700',
                            position: 'relative',
                        }}
                    >
                        Bài Viết Nổi Bật
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '80px',
                                height: '4px',
                                background: '#FFC107',
                                borderRadius: '2px',
                            }}
                        />
                    </Title>

                    <Swiper
                        ref={swiperRef}
                        modules={[Navigation, SwiperPagination, Autoplay]}
                        spaceBetween={24}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        breakpoints={{
                            640: { slidesPerView: 2 },
                            768: { slidesPerView: 3 },
                            1024: { slidesPerView: 4 },
                        }}
                        style={{
                            paddingBottom: '50px',
                        }}
                    >
                        {popularPosts.slice(0, 10).map((item, index) => (
                            <SwiperSlide key={item.id}>
                                <SwiperCard post={item} index={index} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx>{`
                .timeline-item:hover {
                    background: #f8f9fa;
                    border-radius: 12px;
                    transform: translateX(5px);
                }

                .swiper-button-next,
                .swiper-button-prev {
                    color: #ffc107 !important;
                    background: white;
                    border-radius: 50%;
                    width: 44px !important;
                    height: 44px !important;
                    margin-top: -22px !important;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                    border: 2px solid #f0f0f0;
                }

                .swiper-button-next:after,
                .swiper-button-prev:after {
                    font-size: 16px !important;
                    font-weight: bold;
                }

                .swiper-pagination-bullet {
                    background: #ddd !important;
                    opacity: 1 !important;
                    width: 12px !important;
                    height: 12px !important;
                }

                .swiper-pagination-bullet-active {
                    background: #ffc107 !important;
                    transform: scale(1.2);
                }

                /* Custom scrollbar for timeline */
                .timeline-container::-webkit-scrollbar {
                    width: 6px;
                }

                .timeline-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }

                .timeline-container::-webkit-scrollbar-thumb {
                    background: #ffc107;
                    border-radius: 3px;
                }

                .timeline-container::-webkit-scrollbar-thumb:hover {
                    background: #ffb300;
                }
            `}</style>
        </div>
    );
};

export default CoffeeBlogInterface;
