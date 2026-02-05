import { HeartFilled } from '@ant-design/icons';
import { Card, Col, Empty, Row, Spin, Tabs, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Title, Text } = Typography;

// BookGrid Component với thiết kế trắng đen
const BookGrid = ({ books, emptyMessage, cardRefs, router }) => {
    if (!books || books.length === 0) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #f0f0f0',
                }}
            >
                <Empty description={emptyMessage} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ color: '#666' }} />
            </div>
        );
    }

    return (
        <Row gutter={[20, 24]} style={{ margin: 0 }}>
            {books.map((book, index) => (
                <Col key={book.id || index} xs={24} sm={12} md={8} lg={6} xl={4} xxl={4}>
                    <Card
                        ref={(el) => (cardRefs.current[index] = el)}
                        hoverable
                        onClick={() => router?.push(`/book/${book.id}`)}
                        style={{
                            height: '100%',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                        }}
                        bodyStyle={{
                            padding: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        cover={
                            <div
                                style={{
                                    height: '220px',
                                    padding: '12px',
                                    backgroundColor: '#fafafa',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#ffffff',
                                        position: 'relative',
                                        border: '1px solid #f0f0f0',
                                    }}
                                >
                                    <img
                                        alt={book.title || book.name}
                                        src={book.image_url || book.cover_image || '/placeholder-book.jpg'}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            transition: 'transform 0.3s ease',
                                            padding: '4px',
                                        }}
                                        onError={(e) => {
                                            e.target.src = '/placeholder-book.jpg';
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '16px',
                                        right: '16px',
                                        backgroundColor: '#ffffff',
                                        borderRadius: '50%',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <HeartFilled style={{ color: '#ff4d4f', fontSize: '16px' }} />
                                </div>
                            </div>
                        }
                    >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Title
                                level={5}
                                style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '15px',
                                    lineHeight: '1.4',
                                    height: '42px',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    fontWeight: 600,
                                    color: '#000000',
                                }}
                                title={book.title || book.name}
                            >
                                {book.title || book.name}
                            </Title>

                            <Text
                                style={{
                                    fontSize: '13px',
                                    marginBottom: '12px',
                                    color: '#666666',
                                    height: '18px',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {/* {book.author || book.publisher || 'Đang cập nhật'} */}
                            </Text>

                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <Text
                                        strong
                                        style={{
                                            color: '#000000',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {book.price ? `${Number(book.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                                    </Text>

                                    {book.original_price && book.original_price > book.price && (
                                        <Text
                                            delete
                                            style={{
                                                marginLeft: '8px',
                                                fontSize: '12px',
                                                color: '#999999',
                                            }}
                                        >
                                            {Number(book.original_price).toLocaleString('vi-VN')} đ
                                        </Text>
                                    )}
                                </div>

                                {book.is_physical !== undefined && (
                                    <div
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: book.is_physical ? '#000000' : '#f0f0f0',
                                            color: book.is_physical ? '#ffffff' : '#000000',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            textAlign: 'center',
                                            border: `1px solid ${book.is_physical ? '#000000' : '#d9d9d9'}`,
                                        }}
                                    >
                                        {book.is_physical ? 'Sách bán' : 'Sách đọc'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

// FavoriteBooks Component - KHÔNG có sidebar
const FavoriteBooks = ({ enabled, token }) => {
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const cardRefs = useRef([]);

    // Mock router cho demo - thay bằng useRouter thực tế
    const router = {
        push: (url) => console.log(`Navigate to ${url}`),
    };

    // Fetch data từ API thật
    useEffect(() => {
        const fetchFavoriteBooks = async () => {
            if (!enabled) return;

            try {
                setLoading(true);
                const response = await fetch('http://localhost:8000/api/books/followed', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('Unauthorized - token may be invalid');
                        setFavoriteBooks([]);
                        return;
                    }
                    throw new Error('Failed to fetch');
                }

                const data = await response.json();
                console.log('API Response:', data); // Debug log

                // FIX: Xử lý đúng cấu trúc API response
                let books = [];
                if (data && Array.isArray(data.followed_books)) {
                    // Trường hợp API trả về { followed_books: [...] }
                    books = data.followed_books;
                } else if (Array.isArray(data)) {
                    // Trường hợp API trả về trực tiếp array
                    books = data;
                } else if (data && Array.isArray(data.books)) {
                    // Trường hợp API trả về { books: [...] }
                    books = data.books;
                } else if (data && Array.isArray(data.data)) {
                    // Trường hợp API trả về { data: [...] }
                    books = data.data;
                } else {
                    console.warn('Unexpected API response format:', data);
                    books = [];
                }

                setFavoriteBooks(books);
            } catch (error) {
                console.error('Error fetching favorite books:', error);
                setFavoriteBooks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFavoriteBooks();
    }, [enabled, token]);

    // GSAP animation khi có data
    useEffect(() => {
        if (Array.isArray(favoriteBooks) && favoriteBooks.length > 0 && cardRefs.current.length > 0) {
            // Kiểm tra xem gsap có available không
            if (typeof window !== 'undefined' && window.gsap) {
                window.gsap.fromTo(
                    cardRefs.current.filter(Boolean),
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        stagger: 0.1,
                        duration: 0.6,
                        ease: 'power3.out',
                    },
                );
            }
        }
    }, [favoriteBooks]);

    // Đảm bảo favoriteBooks luôn là array trước khi filter
    const booksArray = Array.isArray(favoriteBooks) ? favoriteBooks : [];
    const physicalBooks = booksArray.filter((book) => book.is_physical === 1);
    const digitalBooks = booksArray.filter((book) => book.is_physical === 0);

    const tabItems = [
        {
            key: 'all',
            label: (
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>
                    Tất cả ({booksArray.length})
                </span>
            ),
            children: (
                <BookGrid
                    books={booksArray}
                    emptyMessage="Chưa có sách yêu thích nào"
                    cardRefs={cardRefs}
                    router={router}
                />
            ),
        },
        {
            key: 'physical',
            label: (
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>
                    Sách bán ({physicalBooks.length})
                </span>
            ),
            children: (
                <BookGrid
                    books={physicalBooks}
                    emptyMessage="Chưa có sách bán yêu thích nào"
                    cardRefs={cardRefs}
                    router={router}
                />
            ),
        },
        {
            key: 'digital',
            label: (
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#000000' }}>
                    Sách đọc ({digitalBooks.length})
                </span>
            ),
            children: (
                <BookGrid
                    books={digitalBooks}
                    emptyMessage="Chưa có sách đọc yêu thích nào"
                    cardRefs={cardRefs}
                    router={router}
                />
            ),
        },
    ];

    return (
        <div
            style={{
                backgroundColor: '#ffffff',
                minHeight: '100vh',
                width: '100%',
                margin: 0,
                padding: 0,
            }}
        >
            {/* Header Section */}
            <div
                style={{
                    padding: '24px 32px',
                    backgroundColor: '#000000',
                    color: 'white',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <Title
                    level={2}
                    style={{
                        margin: 0,
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 700,
                        marginBottom: '4px',
                    }}
                >
                    Danh sách yêu thích
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                    {booksArray.length} cuốn sách được yêu thích
                </Text>
            </div>

            {/* Content Section */}
            <div style={{ padding: '32px' }}>
                {loading ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '80px 0',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        <Spin size="large" style={{ color: '#000000' }} />
                        <div
                            style={{
                                marginTop: 16,
                                color: '#666666',
                                fontSize: '16px',
                            }}
                        >
                            Đang tải danh sách yêu thích...
                        </div>
                    </div>
                ) : (
                    <Tabs
                        defaultActiveKey="all"
                        items={tabItems}
                        size="large"
                        style={{
                            backgroundColor: 'white',
                        }}
                        tabBarStyle={{
                            marginBottom: '24px',
                            borderBottom: '2px solid #f0f0f0',
                            paddingLeft: 0,
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default FavoriteBooks;
