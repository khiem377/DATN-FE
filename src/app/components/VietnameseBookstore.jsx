'use client';
'use client';
import { useEffect, useState } from 'react';

const VietnameseBookstore = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch books from API
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/books/search?limit=500');
                const data = await response.json();

                if (data.status === 'success' && data.data) {
                    // Random 10 books mỗi ngày
                    const shuffled = data.data.sort(() => 0.5 - Math.random());
                    const randomBooks = shuffled.slice(0, 10);

                    // Transform data to match component format
                    const transformedBooks = randomBooks.map((book, index) => ({
                        id: book.id,
                        title: book.title,
                        author: book.author?.name || '',
                        cover_image: book.cover_image,
                        price: book.price || book.discount_price || '0',
                        category: book.category?.name || '',
                        // Random colors for each book
                        bgColor: getRandomColor(index),
                        textColor: getTextColor(index),
                    }));

                    setBooks(transformedBooks);
                }
            } catch (error) {
                console.error('Error fetching books:', error);
                // Fallback to default books if API fails
                setBooks(getDefaultBooks());
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    // Generate random colors for books
    const getRandomColor = (index) => {
        const colors = [
            '#1e3a8a',
            '#0d9488',
            '#dc2626',
            '#b91c1c',
            '#14b8a6',
            '#b45309',
            '#059669',
            '#7c2d12',
            '#4338ca',
            '#be123c',
        ];
        return colors[index % colors.length];
    };

    const getTextColor = (index) => {
        const lightColors = ['#ffffff', '#1f2937', '#92400e'];
        return index === 2 || index === 3 ? lightColors[index % 3] : '#ffffff';
    };

    // Default books fallback
    const getDefaultBooks = () => [
        {
            id: 1,
            title: 'ĐẦU TƯ CHỨNG KHOÁN',
            subtitle: 'Phân tích kỹ thuật và tin hiệu vào',
            author: 'Tác giả mẫu',
            bgColor: '#1e3a8a',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 2,
            title: 'KẾ KHÔN',
            author: 'Tác giả mẫu',
            bgColor: '#0d9488',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 3,
            title: 'THINK AGAIN',
            author: 'Adam Grant',
            bgColor: '#dc2626',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 4,
            title: 'DI CHÚC CỦA CHỦ TỊCH HỒ CHÍ MINH',
            author: 'Tác giả mẫu',
            bgColor: '#b91c1c',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 5,
            title: 'CHỦ TỊCH HỒ CHÍ MINH VỚI MIỀN NAM',
            author: 'Tác giả mẫu',
            bgColor: '#14b8a6',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 6,
            title: 'ĐẮC NHÂN TÂM',
            author: 'Dale Carnegie',
            bgColor: '#b45309',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 7,
            title: 'DÒNG CHẢY',
            author: 'Tác giả mẫu',
            bgColor: '#059669',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 8,
            title: 'ĐÁNH THỨC CON NGƯỜI PHI THƯỜNG TRONG BẠN',
            author: 'Anthony Robbins',
            bgColor: '#7c2d12',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 9,
            title: 'THINK & GROW RICH NGHĨ GIÀU LÀM GIÀU',
            author: 'Napoleon Hill',
            bgColor: '#4338ca',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
        {
            id: 10,
            title: 'LỊCH SỬ CUỘC CÁCH MẠNG',
            author: 'Dan Brown',
            bgColor: '#be123c',
            textColor: '#ffffff',
            cover_image: 'https://via.placeholder.com/200x300',
        },
    ];

    const styles = {
        container: {
            position: 'relative',
        },

        mainSection: {
            position: 'relative',
            paddingTop: '64px',
            paddingBottom: '64px',
            backgroundImage: 'url(https://company.waka.vn/themes/desktop/images/waka/bg_hot.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            maxHeight: '700px',
        },
        contentContainer: {
            position: 'relative',
            zIndex: 20,
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 20px',
        },
        header: {
            textAlign: 'center',
            marginBottom: '48px',
        },
        titleWrapper: {
            display: 'inline-block',
            position: 'relative',
        },

        title: {
            color: '#ffffff',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0,
            transform: 'skewX(10deg)',
        },
        subtitle: {
            color: '#ffffff',
            fontSize: '18px',
            marginTop: '16px',
            fontWeight: '300',
        },
        booksGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: '16px',
        },
        bookCard: {
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            opacity: 0,
            animation: 'fadeInUp 0.6s ease forwards',
            position: 'relative',
            overflow: 'hidden',
        },
        bookCardInner: {
            height: '288px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.3s ease',
        },
        bookImage: {
            width: '178px',
            height: '277px',
            objectFit: 'cover',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
        },
        bookTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            lineHeight: '1.2',
            marginBottom: '8px',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
        },
        bookAuthor: {
            fontSize: '12px',
            opacity: 0.8,
            fontStyle: 'italic',
            color: '#fff',
        },
        bookPrice: {
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#10b981',
            marginTop: '4px',
        },

        loadingSpinner: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            color: '#fff',
            fontSize: '18px',
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.curvedSection}>
                    <div style={styles.topCurve} />
                    <div style={styles.mainSection}>
                        <div style={styles.loadingSpinner}>
                            <div>Đang tải sách...</div>
                        </div>
                    </div>
                    <div style={styles.bottomCurve} />
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Main bookstore section */}
            <div style={styles.mainSection}>
                <div style={styles.contentContainer}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.titleWrapper}>
                            <div style={styles.titleBg}>
                                <h1 style={styles.title}>Hàng trăm tựa sách mới và hot nhất</h1>
                            </div>
                        </div>
                        <p style={styles.subtitle}>Kho sách bán quyền lên đến 13,000+ cuốn</p>
                    </div>

                    {/* Books Grid */}
                    <div style={styles.booksGrid} className="books-grid">
                        {books.map((book, index) => (
                            <div
                                key={book.id}
                                style={{
                                    ...styles.bookCard,
                                    animationDelay: `${index * 0.1}s`,
                                }}
                            >
                                <div className="book-card-inner" style={styles.bookCardInner}>
                                    <img
                                        src={book.cover_image || 'https://via.placeholder.com/200x300?text=No+Image'}
                                        alt={book.title}
                                        style={styles.bookImage}
                                        className="book-image"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                                        }}
                                    />
                                    {/* Glow overlay effect */}
                                    <div className="glow-overlay"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom curved section */}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%) translateY(-100%) rotate(45deg);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(100%) translateY(100%) rotate(45deg);
                        opacity: 0;
                    }
                }

                @keyframes glowPulse {
                    0%, 100% {
                        opacity: 0;
                    }
                    50% {
                        opacity: 0.3;
                    }
                }

                .book-card {
                    position: relative;
                }

                .book-card-inner {
                    position: relative;
                    background: none;
                    backdrop-filter: none;
                    border: none;
                }

                .glow-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 12px;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
                    box-shadow: 
                        0 0 20px rgba(255, 255, 255, 0.3),
                        0 0 40px rgba(255, 255, 255, 0.2),
                        0 0 60px rgba(255, 255, 255, 0.1);
                }

                .book-card-inner:hover .book-card-inner {
                    transform: translateY(-8px) scale(1.03);
                    box-shadow: 
                        0 15px 35px rgba(0, 0, 0, 0.4),
                        0 0 30px rgba(255, 255, 255, 0.2);
                }

                .book-card-inner:hover .book-image {
                    filter: brightness(1.2) contrast(1.1);
                }

                .book-card-inner:hover .glow-overlay {
                    opacity: 1;
                    animation: glowPulse 2s ease-in-out infinite;
                }

                .book-card-inner:hover .shimmer-overlay {
                    animation: shimmer 1.2s ease-in-out;
                }

                @media (min-width: 768px) {
                    .books-grid {
                        grid-template-columns: repeat(5, 1fr);
                        gap: 20px;
                    }
                    .book-card-inner {
                        height: 320px;
                    }
                    .title {
                        font-size: 40px;
                    }
                }

                @media (min-width: 1024px) {
                    .books-grid {
                        grid-template-columns: repeat(5, 1fr);
                        gap: 24px;
                    }
                    .book-card-inner {
                        height: 350px;
                    }
                    .title {
                        font-size: 48px;
                    }
                }

                @media (max-width: 767px) {
                    .books-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 12px;
                    }
                    .book-card-inner {
                        height: 250px;
                    }
                }

                @media (max-width: 480px) {
                    .books-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 8px;
                    }
                    .book-card-inner {
                        height: 220px;
                    }
                    .title {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default VietnameseBookstore;
