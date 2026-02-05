'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const AdvancedPartnersMarquee = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const marqueeRef = useRef(null);
    const containerRef = useRef(null);
    const router = useRouter();

    // Fetch publishers from API
    useEffect(() => {
        const fetchPublishers = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/publisher');
                const data = await response.json();
                if (data.status) {
                    setPartners(data.data);
                }
            } catch (error) {
                console.error('Error fetching publishers:', error);
                // Fallback data nếu API không hoạt động
                setPartners([
                    {
                        id: 19,
                        name: 'NXB Dân Trí',
                        image_url:
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoBtRquhZ2CHH_QpxL7tpDFD8QaF7sSdm9dA&s',
                    },
                    {
                        id: 17,
                        name: 'NXB Hà Nội',
                        image_url:
                            'https://play-lh.googleusercontent.com/J1iTXkL4lWni2x2iyhMJB-THqZnZyuwJyDB52H5DYo09s1AD7yIIFZikv9iiCFl0pg',
                    },
                    {
                        id: 22,
                        name: 'NXB Hội Nhà Văn',
                        image_url: 'https://www.netabooks.vn/data/author/18246/logo--nxb-hoi-nha-van.jpg',
                    },
                    {
                        id: 20,
                        name: 'NXB Lao Động',
                        image_url:
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuvopYf5opN1k1TaIyBPhmxIHrZo3hhQ00yA&s',
                    },
                    {
                        id: 21,
                        name: 'NXB Thế Giới',
                        image_url:
                            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSdDuCUYMiVxHUd-NhA0gnWoJkXv8MNq6eDw&s',
                    },
                    {
                        id: 18,
                        name: 'NXB Văn Học',
                        image_url:
                            'https://bizweb.dktcdn.net/thumb/grande/100/370/339/articles/62546969-logo-nxb-van-hoc-1a3f50ce-15aa-4748-8c11-b7b494553f51.jpg?v=1576158807580',
                    },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchPublishers();
    }, []);

    // Handle publisher click
    const handlePublisherClick = (publisherId, publisherName) => {
        console.log('Navigating to search with publisher:', publisherId, publisherName);
        router.push(`/search?publisher=${publisherId}&publisher_name=${encodeURIComponent(publisherName)}`);
    };

    // Advanced GSAP-style animations with smoother effects
    useEffect(() => {
        if (!loading && partners.length > 0 && marqueeRef.current) {
            const marqueeElement = marqueeRef.current;
            const logos = marqueeElement.querySelectorAll('.partner-logo-container');

            // Smooth stagger animation for initial load
            logos.forEach((logo, index) => {
                logo.style.opacity = '0';
                logo.style.transform = 'translateY(30px) scale(0.9)';

                setTimeout(() => {
                    logo.style.transition = 'all 1.2s cubic-bezier(0.23, 1, 0.32, 1)';
                    logo.style.opacity = '1';
                    logo.style.transform = 'translateY(0) scale(1)';
                }, index * 80);
            });

            // Start smooth marquee animation
            const startSmoothMarquee = () => {
                marqueeElement.style.animation = 'none';
                marqueeElement.offsetHeight; // Force reflow
                marqueeElement.style.animation = 'smoothMarquee 40s linear infinite';
            };

            setTimeout(() => {
                startSmoothMarquee();
            }, 1500);

            // Enhanced hover interactions
            const handleMouseEnter = (e) => {
                marqueeElement.style.animationPlayState = 'paused';

                // Add subtle zoom to hovered item
                const target = e.target.closest('.partner-logo-container');
                if (target) {
                    target.style.transform = 'scale(1.1) translateY(-5px)';
                    target.style.zIndex = '10';
                    target.style.cursor = 'pointer';
                }
            };

            const handleMouseLeave = (e) => {
                marqueeElement.style.animationPlayState = 'running';

                // Reset transform
                const target = e.target.closest('.partner-logo-container');
                if (target) {
                    target.style.transform = 'scale(1) translateY(0)';
                    target.style.zIndex = '1';
                }
            };

            // Add event listeners to each logo
            logos.forEach((logo) => {
                logo.addEventListener('mouseenter', handleMouseEnter);
                logo.addEventListener('mouseleave', handleMouseLeave);
            });

            return () => {
                logos.forEach((logo) => {
                    logo.removeEventListener('mouseenter', handleMouseEnter);
                    logo.removeEventListener('mouseleave', handleMouseLeave);
                });
            };
        }
    }, [loading, partners]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    background: 'white',
                }}
            >
                <div
                    style={{
                        textAlign: 'center',
                        color: '#1e40af',
                        fontSize: '16px',
                        fontWeight: '500',
                    }}
                >
                    Đang tải nhà xuất bản...
                </div>
            </div>
        );
    }

    // Triple the partners for seamless loop
    const triplePartners = [...partners, ...partners, ...partners];

    return (
        <>
            <style jsx>{`
                .partners-marquee-container {
                    background: white;
                    padding: 60px 0;
                    position: relative;
                    overflow: hidden;
                    border-top: 1px solid #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                }

                .container-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 0 40px;
                }

                .header-section {
                    text-align: center;
                    margin-bottom: 50px;
                    position: relative;
                    z-index: 2;
                }

                .header-title {
                    font-size: 42px;
                    font-weight: 700;
                    color: #1e40af;
                    margin-bottom: 20px;
                    letter-spacing: -0.5px;
                    position: relative;
                }

                .header-title::after {
                    content: '';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 80px;
                    height: 4px;
                    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
                    border-radius: 2px;
                }

                .header-subtitle {
                    font-size: 18px;
                    color: #64748b;
                    max-width: 600px;
                    margin: 0 auto;
                    line-height: 1.6;
                    font-weight: 400;
                }

                .marquee-track {
                    position: relative;
                    overflow: hidden;
                    mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
                    -webkit-mask-image: linear-gradient(
                        to right,
                        transparent 0%,
                        black 10%,
                        black 90%,
                        transparent 100%
                    );
                }

                .marquee-content {
                    display: flex;
                    align-items: center;
                    gap: 80px;
                    animation: smoothMarquee 40s linear infinite;
                    width: max-content;
                    will-change: transform;
                }

                @keyframes smoothMarquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.333%);
                    }
                }

                .partner-logo-container {
                    flex-shrink: 0;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 20px;
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    cursor: pointer;
                    position: relative;
                    border-radius: 12px;
                    backdrop-filter: blur(10px);
                }

                .partner-logo-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(29, 78, 216, 0.05));
                    border-radius: 12px;
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .partner-logo-container:hover::before {
                    opacity: 1;
                }

                .partner-logo-container:hover {
                    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08);
                }

                .partner-logo-container::after {
                    content: 'Xem sách từ nhà xuất bản này';
                    position: absolute;
                    bottom: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                    z-index: 20;
                }

                .partner-logo-container:hover::after {
                    opacity: 1;
                }

                .partner-logo {
                    max-height: 60px;
                    max-width: 140px;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    filter: grayscale(100%) opacity(0.7);
                    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                    pointer-events: none;
                }

                .partner-logo-container:hover .partner-logo {
                    filter: grayscale(0%) opacity(1);
                    transform: scale(1.05);
                }

                .background-decoration {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                }

                .floating-shape {
                    position: absolute;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(29, 78, 216, 0.08));
                    border-radius: 50%;
                    animation: floatShape 15s infinite ease-in-out;
                }

                .floating-shape:nth-child(1) {
                    width: 120px;
                    height: 120px;
                    top: 20%;
                    left: 85%;
                    animation-delay: 0s;
                }

                .floating-shape:nth-child(2) {
                    width: 80px;
                    height: 80px;
                    top: 70%;
                    left: 10%;
                    animation-delay: 5s;
                }

                .floating-shape:nth-child(3) {
                    width: 100px;
                    height: 100px;
                    top: 40%;
                    left: 75%;
                    animation-delay: 10s;
                }

                @keyframes floatShape {
                    0%,
                    100% {
                        transform: translate(0, 0) rotate(0deg);
                        opacity: 0.3;
                    }
                    25% {
                        transform: translate(-20px, -20px) rotate(90deg);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translate(20px, -30px) rotate(180deg);
                        opacity: 0.4;
                    }
                    75% {
                        transform: translate(-30px, 10px) rotate(270deg);
                        opacity: 0.7;
                    }
                }

                @media (max-width: 1024px) {
                    .container-content {
                        padding: 0 20px;
                    }

                    .header-title {
                        font-size: 36px;
                    }

                    .header-subtitle {
                        font-size: 16px;
                    }

                    .marquee-content {
                        gap: 60px;
                    }

                    .partner-logo {
                        max-height: 50px;
                        max-width: 120px;
                    }
                }

                @media (max-width: 768px) {
                    .partners-marquee-container {
                        padding: 40px 0;
                    }

                    .header-title {
                        font-size: 28px;
                    }

                    .header-section {
                        margin-bottom: 30px;
                    }

                    .marquee-content {
                        gap: 40px;
                    }

                    .partner-logo-container {
                        height: 60px;
                        padding: 0 15px;
                    }

                    .partner-logo {
                        max-height: 40px;
                        max-width: 100px;
                    }

                    .partner-logo-container::after {
                        font-size: 10px;
                        padding: 4px 8px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .marquee-content {
                        animation-duration: 80s;
                    }

                    .floating-shape {
                        animation: none;
                    }
                }
            `}</style>

            <div className="partners-marquee-container" ref={containerRef}>
                {/* Background Decoration */}
                <div className="background-decoration">
                    <div className="floating-shape"></div>
                    <div className="floating-shape"></div>
                    <div className="floating-shape"></div>
                </div>

                <div className="container-content">
                    {/* Header Section */}
                    <div className="header-section">
                        <h2 className="header-title">Nhà Xuất Bản Đối Tác</h2>
                        <p className="header-subtitle">
                            Kết nối với những nhà xuất bản uy tín nhất Việt Nam, mang đến nguồn tri thức phong phú và
                            chất lượng cao
                        </p>
                    </div>

                    {/* Marquee Track */}
                    <div className="marquee-track">
                        <div className="marquee-content" ref={marqueeRef}>
                            {triplePartners.map((partner, index) => (
                                <div
                                    key={`${partner.id}-${index}`}
                                    className="partner-logo-container"
                                    onClick={() => handlePublisherClick(partner.id, partner.name)}
                                >
                                    <img
                                        src={partner.image_url}
                                        alt={partner.name}
                                        className="partner-logo"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="140" height="60" viewBox="0 0 140 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="140" height="60" fill="#f8fafc" rx="8"/>
                          <text x="70" y="35" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12" font-weight="500">
                            ${partner.name}
                          </text>
                        </svg>
                      `)}`;
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdvancedPartnersMarquee;
