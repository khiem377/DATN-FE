'use client';
import { useEffect, useState } from 'react';

const RunningBookBanner = () => {
    const [randomBook, setRandomBook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getTodaySeed = () => {
        const today = new Date();
        return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    };

    const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    useEffect(() => {
        const fetchRandomBook = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('http://localhost:8000/api/books/search?limit=500');
                const data = await response.json();

                if (data.status === 'success' && data.data && data.data.length > 0) {
                    const seed = getTodaySeed();
                    const randomIndex = Math.floor(seededRandom(seed) * data.data.length);
                    const selectedBook = data.data[randomIndex];
                    setRandomBook(selectedBook);
                }
            } catch (error) {
                console.error('Error fetching books:', error);
                const fallbackBooks = [
                    {
                        id: 51,
                        title: 'test1',
                        cover_image:
                            'https://res.cloudinary.com/dz7y2yufu/image/upload/v1754896873/book_covers/n21cu6rmzegicsm4a4t6.jpg',
                    },
                    {
                        id: 50,
                        title: 'test',
                        cover_image:
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyoDM1ST0bgUf-EqUOY4oCgKBBmqRsG-poMA&s',
                    },
                ];
                const seed = getTodaySeed();
                const randomIndex = Math.floor(seededRandom(seed) * fallbackBooks.length);
                setRandomBook(fallbackBooks[randomIndex]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRandomBook();
    }, []);

    const handleBookClick = () => {
        if (randomBook && randomBook.id) {
            window.open(`/book/${randomBook.id}`);
        }
    };

    return (
        <>
            <style jsx global>{`
                .running-book-banner {
                    position: fixed;
                    bottom: 20px;
                    left: 100%;
                    width: 400px;
                    height: 80px;
                    z-index: 1000;
                    animation: slideAcross 10s linear infinite;
                    cursor: pointer;
                }

                .banner-content-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                }

                .banner-svg-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .banner-svg-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    display: block;\
                }

                .book-cover-image {
                    position: absolute;
                    top: 10px; /* chỉnh để vừa khung */
                    right: 28px; /* chỉnh để vừa khung */
                    width: 40px;
                    height: 55px;
                    border-radius: 6px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }

                .book-cover-image:hover {
                    transform: scale(1.05);
                }

                .book-cover-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .loading-book-placeholder {
                    position: absolute;
                    top: 8px;
                    right: 15px;
                    width: 45px;
                    height: 60px;
                    border-radius: 8px;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border: 2px solid rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #ddd;
                    border-top: 2px solid #22c55e;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .book-tooltip {
                    position: absolute;
                    bottom: 90px;
                    right: 10px;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                    pointer-events: none;
                    max-width: 200px;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }

                .running-book-banner:hover .book-tooltip {
                    opacity: 1;
                    transform: translateY(0);
                }

                .book-tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    right: 20px;
                    border: 6px solid transparent;
                    border-top-color: rgba(0, 0, 0, 0.9);
                }

                @keyframes slideAcross {
                    0% {
                        left: 100%;
                        opacity: 1;
                    }
                    100% {
                        left: -400px;
                        opacity: 1;
                    }
                }

                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 768px) {
                    .running-book-banner {
                        width: 300px;
                        height: 60px;
                        bottom: 10px;
                    }

                    .book-cover-image,
                    .loading-book-placeholder {
                        width: 35px;
                        height: 45px;
                        top: 5px;
                        right: 10px;
                    }
                }
            `}</style>

            <div className="running-book-banner" onClick={handleBookClick}>
                <div className="banner-content-wrapper">
                    <div className="banner-svg-container">
                        <img src="https://waka.vn/svgs/neo-run.svg" alt="Running banner" loading="lazy" />
                    </div>

                    {!isLoading && randomBook && (
                        <div className="book-cover-image">
                            <img
                                src={randomBook.cover_image}
                                alt={randomBook.title}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/45x60/22c55e/white?text=📚';
                                }}
                                loading="lazy"
                            />
                        </div>
                    )}

                    {isLoading && (
                        <div className="loading-book-placeholder">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {!isLoading && randomBook && <div className="book-tooltip">📚 {randomBook.title}</div>}
                </div>
            </div>
        </>
    );
};

export default RunningBookBanner;
