'use client';
import {
    Book,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText,
    FileType,
    Home,
    List,
    Loader,
    Menu,
    RotateCcw,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

const PDFFlipbook = () => {
    const [chapterData, setChapterData] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0); // 0-based PDF page
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [pdfPages, setPdfPages] = useState([]);
    const [htmlContent, setHtmlContent] = useState('');
    const [contentType, setContentType] = useState('text'); // 'pdf' | 'text'
    const [pdfDoc, setPdfDoc] = useState(null);
    const [bookId, setBookId] = useState(null);
    const [chapterId, setChapterId] = useState(null);
    const [pdfCache, setPdfCache] = useState({});
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [allChapters, setAllChapters] = useState([]);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const flipBookRef = useRef();

    useEffect(() => {
        const loadPDFJS = async () => {
            const storedBookId = localStorage.getItem('currentBookId');
            const storedChapterId = localStorage.getItem('currentChapterId');
            if (!storedBookId || !storedChapterId) {
                setLoading(false);
                return;
            }
            setBookId(storedBookId);
            setChapterId(storedChapterId);

            if (typeof window !== 'undefined' && !window.pdfjsLib) {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                script.onload = () => {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    fetchChapterData(storedBookId, storedChapterId);
                };
                document.head.appendChild(script);
            } else {
                fetchChapterData(storedBookId, storedChapterId);
            }
        };
        loadPDFJS();
    }, []);

    const fetchChapterData = async (currentBookId, currentChapterId) => {
        try {
            setLoading(true);
            const res = await fetch(
                `http://localhost:8000/api/admin/books/${currentBookId}/chapters/${currentChapterId}/detail`,
            );
            const data = await res.json();
            setChapterData(data);
            localStorage.setItem('currentBookId', data.chapter.book_id.toString());
            localStorage.setItem('currentChapterId', data.chapter.id.toString());
            setBookId(data.chapter.book_id);
            setChapterId(data.chapter.id);

            if (data.chapter.content_type === 'pdf' && data.chapter.pdf_url) {
                setContentType('pdf');
                await loadPDF(data.chapter.pdf_url, data.chapter.id);
            } else if (data.chapter.content_type === 'text' && data.chapter.content) {
                setContentType('text');
                loadHTMLContent(data.chapter.content);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const loadHTMLContent = (content) => {
        setHtmlContent(content);
        setNumPages(1);
        setLoading(false);
        setTimeout(() => flipBookRef.current?.pageFlip?.().flip(0), 100);
    };

    const loadPDF = async (pdfUrl, chapterIdForCache) => {
        try {
            const cacheKey = `${chapterIdForCache}_${pdfUrl}`;
            if (pdfCache[cacheKey]) {
                const { pages, numPages } = pdfCache[cacheKey];
                setPdfPages(pages);
                setNumPages(numPages);
                setLoading(false);
                setTimeout(() => flipBookRef.current?.pageFlip?.().flip(0), 100);
                return;
            }

            const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            setPdfDoc(pdf);
            setNumPages(pdf.numPages);

            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const pageImage = await renderPageToImage(pdf, i);
                pages.push({ pageNumber: i, imageUrl: pageImage, width: 600, height: 800 });
            }

            setPdfPages(pages);
            setPdfCache((prev) => ({ ...prev, [cacheKey]: { pages, numPages: pdf.numPages, timestamp: Date.now() } }));
            setLoading(false);
            setTimeout(() => flipBookRef.current?.pageFlip?.().flip(0), 100);
        } catch (e) {
            console.error('Error loading PDF:', e);
            setLoading(false);
        }
    };

    const renderPageToImage = async (pdf, pageNumber) => {
        try {
            const page = await pdf.getPage(pageNumber);
            const scale = 2;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;
            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (e) {
            console.error(`render ${pageNumber} failed`, e);
            return null;
        }
    };

    const fetchAllChapters = async (currentBookId) => {
        if (allChapters.length) return;
        try {
            setLoadingChapters(true);
            const res = await fetch(`http://localhost:8000/api/admin/books/${currentBookId}/chapters`);
            const data = await res.json();
            if (data.success) {
                const chaptersWithStats = data.chapters.map((c) => ({
                    ...c,
                    wordCount: c.display_content ? c.display_content.replace(/<[^>]*>/g, '').trim().length : 0,
                }));
                setAllChapters(chaptersWithStats);
            }
        } finally {
            setLoadingChapters(false);
        }
    };

    const navigateToChapter = async (cid) => {
        setShowChapterModal(false);
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/admin/books/${bookId}/chapters/${cid}/detail`);
            const data = await res.json();
            setChapterData(data);
            setCurrentPage(0);
            localStorage.setItem('currentBookId', data.chapter.book_id.toString());
            localStorage.setItem('currentChapterId', data.chapter.id.toString());
            if (data.chapter.content_type === 'pdf' && data.chapter.pdf_url) {
                setContentType('pdf');
                await loadPDF(data.chapter.pdf_url, data.chapter.id);
            } else {
                setContentType('text');
                loadHTMLContent(data.chapter.content);
            }
            flipBookRef.current?.flip?.(0);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const nextPage = () => flipBookRef.current?.pageFlip?.().flipNext();
    const prevPage = () => flipBookRef.current?.pageFlip?.().flipPrev();

    const goToPage = (pageNum) => {
        if (contentType === 'text') return;
        const target = Math.max(1, Math.min(pageNum, numPages));
        flipBookRef.current?.pageFlip?.().flip(target - 1); // index = page - 1
    };

    const onFlip = (e) => {
        if (contentType === 'text') return;
        const pageIndex = e.data; // 0-based child index
        const pdfPage = Math.min(pageIndex + 1, numPages);
        setCurrentPage(pdfPage - 1);
    };

    const zoomIn = () => setZoom((p) => Math.min(p + 0.2, 3));
    const zoomOut = () => setZoom((p) => Math.max(p - 0.2, 0.5));
    const resetZoom = () => setZoom(1);

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingContent}>
                    <Loader style={styles.loadingIcon} />
                    <p style={styles.loadingText}>
                        {contentType === 'pdf' ? 'Đang tải PDF...' : 'Đang tải nội dung...'}
                    </p>
                    <div style={styles.progressContainer}>
                        <div style={styles.progressBar}></div>
                    </div>
                </div>
            </div>
        );
    }

    // danh sách trang sẽ render (chèn trang trắng cuối nếu lẻ để luôn 2 mặt)
    const pagesToRender = (() => {
        if (contentType !== 'pdf') return [];
        const arr = [...pdfPages];
        if (arr.length % 2 !== 0) {
            arr.push({ pageNumber: null, imageUrl: null, isBlank: true });
        }
        return arr;
    })();

    return (
        <div style={styles.container}>
            {/* Header (giữ nguyên) */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.bookInfo}>
                        <Book style={styles.bookIcon} />
                        <div>
                            <h1 style={styles.bookTitle}>{chapterData?.chapter?.book?.title}</h1>
                            <p style={styles.chapterTitle}>
                                Chương {chapterData?.chapter?.title}{' '}
                                <span style={styles.contentType}>({contentType === 'pdf' ? 'PDF' : 'Văn bản'})</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <div style={styles.zoomControls}>
                        <button onClick={zoomOut} style={styles.controlButton} title="Thu nhỏ">
                            <ZoomOut style={styles.controlIcon} />
                        </button>
                        <span style={styles.zoomDisplay}>{Math.round(zoom * 100)}%</span>
                        <button onClick={zoomIn} style={styles.controlButton} title="Phóng to">
                            <ZoomIn style={styles.controlIcon} />
                        </button>
                        <button onClick={resetZoom} style={styles.controlButton} title="Reset">
                            <RotateCcw style={styles.controlIcon} />
                        </button>
                    </div>

                    <button style={styles.headerButton} title="Trang chủ">
                        <Home style={styles.controlIcon} />
                    </button>
                    <button
                        style={styles.chapterListButton}
                        title="Danh sách chương"
                        onClick={() => {
                            setShowChapterModal(true);
                            fetchAllChapters(bookId);
                        }}
                    >
                        <List style={styles.controlIcon} />
                        <span style={styles.buttonText}>Danh sách chương</span>
                    </button>
                    <button style={styles.headerButton} title="Menu">
                        <Menu style={styles.controlIcon} />
                    </button>
                </div>
            </div>

            {/* Main */}
            <div style={styles.mainContent}>
                <div style={styles.backgroundPattern}>
                    <div style={styles.backgroundGradient}></div>
                </div>

                <div style={styles.contentWrapper}>
                    {contentType === 'pdf' && (
                        <>
                            <button
                                onClick={prevPage}
                                disabled={currentPage <= 0}
                                style={{
                                    ...styles.navButton,
                                    ...styles.prevButton,
                                    ...(currentPage <= 0 ? styles.disabledButton : {}),
                                }}
                            >
                                <ChevronLeft style={styles.navIcon} />
                            </button>

                            <button
                                onClick={nextPage}
                                disabled={currentPage >= numPages - 1}
                                style={{
                                    ...styles.navButton,
                                    ...styles.nextButton,
                                    ...(currentPage >= numPages - 1 ? styles.disabledButton : {}),
                                }}
                            >
                                <ChevronRight style={styles.navIcon} />
                            </button>
                        </>
                    )}

                    <div style={{ ...styles.flipbookWrapper, transform: `scale(${zoom})` }}>
                        {contentType === 'pdf' && pagesToRender.length > 0 && (
                            <HTMLFlipBook
                                ref={flipBookRef}
                                width={700}
                                height={900}
                                size="fixed"
                                minWidth={500}
                                maxWidth={1200}
                                minHeight={600}
                                maxHeight={1400}
                                maxShadowOpacity={0.5}
                                /* 🔥 Không dùng bìa – vào thẳng 2 mặt */
                                showCover={false}
                                mobileScrollSupport={false}
                                usePortrait={false}
                                onFlip={onFlip}
                                className="flipbook"
                                startPage={0}
                                drawShadow
                                flippingTime={800}
                                startZIndex={0}
                                autoSize={false}
                                clickEventForward
                                useMouseEvents
                                swipeDistance={30}
                                showPageCorners
                                disableFlipByClick={false}
                            >
                                {pagesToRender.map((page, idx) => (
                                    <div key={idx} style={styles.page}>
                                        <div style={styles.pdfPageContent}>
                                            {page.isBlank ? (
                                                <div style={styles.blankPage}>
                                                    <p style={styles.blankText}>Trang trống</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <img
                                                        src={page.imageUrl}
                                                        alt={`Trang ${page.pageNumber}`}
                                                        style={styles.pageImage}
                                                        loading="lazy"
                                                    />
                                                    <div style={styles.pageNumber}>{page.pageNumber}</div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </HTMLFlipBook>
                        )}

                        {contentType === 'text' && htmlContent && (
                            <div style={styles.textContentContainer}>
                                <div style={styles.textPage}>
                                    <div style={styles.textHeader}>
                                        <FileText style={styles.textIcon} />
                                        <h2 style={styles.textTitle}>Chương {chapterData?.chapter?.title}</h2>
                                    </div>
                                    <div style={styles.textContent} dangerouslySetInnerHTML={{ __html: htmlContent }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <div style={styles.footerContent}>
                    <div style={styles.footerInfo}>
                        <span style={styles.authorName}>{chapterData?.chapter?.book?.author?.name}</span>
                        <span style={styles.separator}>•</span>
                        <span>{chapterData?.chapter?.book?.title}</span>
                    </div>

                    {contentType === 'pdf' && (
                        <div style={styles.pageNavigation}>
                            <div style={styles.pageInputGroup}>
                                <span style={styles.pageLabel}>Trang:</span>
                                <div style={styles.pageInputContainer}>
                                    <input
                                        type="number"
                                        min="1"
                                        max={numPages}
                                        value={currentPage + 1}
                                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                        style={styles.pageInput}
                                    />
                                    <span style={styles.pageLabel}>/ {numPages}</span>
                                </div>
                            </div>

                            <div style={styles.progressGroup}>
                                <span style={styles.pageLabel}>Tiến độ:</span>
                                <div style={styles.progressBarContainer}>
                                    <div
                                        style={{
                                            ...styles.progressBarFill,
                                            width: `${((currentPage + 1) / numPages) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span style={styles.pageLabel}>
                                    {Math.round(((currentPage + 1) / numPages) * 100)}%
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={styles.chapterNavigation}>
                        {chapterData?.previous && (
                            <button
                                style={styles.chapterButton}
                                onClick={async () => {
                                    await goToPreviousChapter();
                                }}
                            >
                                ← Chương trước
                            </button>
                        )}
                        {chapterData?.next && (
                            <button
                                style={{ ...styles.chapterButton, ...styles.nextChapterButton }}
                                onClick={async () => {
                                    await goToNextChapter();
                                }}
                            >
                                Chương tiếp →
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal chương (giữ nguyên) */}
            {showChapterModal && (
                <div style={styles.modalOverlay} onClick={() => setShowChapterModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div style={styles.modalTitle}>
                                <List style={styles.modalIcon} />
                                <span>Danh sách chương ({allChapters.length})</span>
                            </div>
                            <button style={styles.closeButton} onClick={() => setShowChapterModal(false)}>
                                <X style={styles.controlIcon} />
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            {loadingChapters ? (
                                <div style={styles.modalLoading}>
                                    <Loader style={styles.loadingSpinner} />
                                    <span>Đang tải danh sách chương...</span>
                                </div>
                            ) : (
                                <div style={styles.chaptersList}>
                                    {allChapters.map((chapter) => (
                                        <div
                                            key={chapter.id}
                                            style={{
                                                ...styles.chapterItem,
                                                ...(chapter.id === chapterData?.chapter?.id
                                                    ? styles.currentChapterItem
                                                    : {}),
                                            }}
                                            onClick={() => navigateToChapter(chapter.id)}
                                        >
                                            <div style={styles.chapterInfo}>
                                                <div style={styles.chapterHeader}>
                                                    <div style={styles.chapterIcon}>
                                                        {chapter.content_type === 'pdf' ? (
                                                            <FileType style={styles.chapterTypeIcon} />
                                                        ) : (
                                                            <FileText style={styles.chapterTypeIcon} />
                                                        )}
                                                    </div>
                                                    <div style={styles.chapterTitle}>
                                                        <h4 style={styles.chapterName}>{chapter.title}</h4>
                                                        <div style={styles.chapterMeta}>
                                                            <span style={styles.chapterOrder}>
                                                                #{chapter.chapter_order}
                                                            </span>
                                                            <span style={styles.chapterType}>
                                                                {chapter.content_type === 'pdf' ? 'PDF' : 'Văn bản'}
                                                            </span>
                                                            {chapter.wordCount > 0 && (
                                                                <span style={styles.wordCount}>
                                                                    <Clock style={styles.clockIcon} />
                                                                    {chapter.wordCount.toLocaleString()} ký tự
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {chapter.display_content && (
                                                    <div style={styles.chapterPreview}>
                                                        <div
                                                            style={styles.previewText}
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    chapter.display_content.length > 200
                                                                        ? chapter.display_content.substring(0, 200) +
                                                                          '...'
                                                                        : chapter.display_content,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            {chapter.id === chapterData?.chapter?.id && (
                                                <div style={styles.currentBadge}>Đang đọc</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    async function goToPreviousChapter() {
        if (!chapterData?.previous) return;
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:8000/api/admin/books/${chapterData.chapter.book_id}/chapters/${chapterData.previous.id}/detail`,
            );
            const data = await res.json();
            setChapterData(data);
            setCurrentPage(0);
            localStorage.setItem('currentBookId', data.chapter.book_id.toString());
            localStorage.setItem('currentChapterId', data.chapter.id.toString());
            if (data.chapter.content_type === 'pdf' && data.chapter.pdf_url) {
                setContentType('pdf');
                await loadPDF(data.chapter.pdf_url, data.chapter.id);
            } else {
                setContentType('text');
                loadHTMLContent(data.chapter.content);
            }
            flipBookRef.current?.flip?.(0);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    async function goToNextChapter() {
        if (!chapterData?.next) return;
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:8000/api/admin/books/${chapterData.chapter.book_id}/chapters/${chapterData.next.id}/detail`,
            );
            const data = await res.json();
            setChapterData(data);
            setCurrentPage(0);
            localStorage.setItem('currentBookId', data.chapter.book_id.toString());
            localStorage.setItem('currentChapterId', data.chapter.id.toString());
            if (data.chapter.content_type === 'pdf' && data.chapter.pdf_url) {
                setContentType('pdf');
                await loadPDF(data.chapter.pdf_url, data.chapter.id);
            } else {
                setContentType('text');
                loadHTMLContent(data.chapter.content);
            }
            flipBookRef.current?.flip?.(0);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }
};

const styles = {
    // Loading styles
    loadingContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1f2937, #374151)',
    },
    loadingContent: {
        textAlign: 'center',
        color: 'white',
    },
    loadingIcon: {
        width: '48px',
        height: '48px',
        margin: '0 auto 16px',
        color: '#60a5fa',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        fontSize: '18px',
        marginBottom: '16px',
    },
    progressContainer: {
        width: '256px',
        height: '8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBar: {
        width: '60%',
        height: '100%',
        backgroundColor: '#2563eb',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    },

    // Main container styles
    container: {
        height: '100vh',
        background: 'linear-gradient(135deg, #1f2937, #374151)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },

    // Header styles
    header: {
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        color: 'white',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #374151',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    bookInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    bookIcon: {
        width: '24px',
        height: '24px',
        color: '#60a5fa',
    },
    bookTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        margin: 0,
    },
    chapterTitle: {
        fontSize: '14px',
        color: '#d1d5db',
        margin: 0,
    },
    contentType: {
        fontSize: '12px',
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    zoomControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        padding: '4px',
    },
    controlButton: {
        padding: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    controlIcon: {
        width: '16px',
        height: '16px',
    },
    zoomDisplay: {
        fontSize: '14px',
        padding: '4px 12px',
        minWidth: '60px',
        textAlign: 'center',
        color: 'white',
    },
    headerButton: {
        padding: '8px',
        backgroundColor: '#374151',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    chapterListButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: '#2563eb',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
    },
    buttonText: {
        fontSize: '14px',
        fontWeight: '500',
    },

    // Main content styles
    mainContent: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundPattern: {
        position: 'absolute',
        inset: 0,
        opacity: 0.05,
    },
    backgroundGradient: {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, transparent, white, transparent)',
        transform: 'rotate(45deg)',
    },
    contentWrapper: {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        padding: '16px',
        background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
    },
    prevButton: {
        left: '-80px',
    },
    nextButton: {
        right: '-80px',
    },
    disabledButton: {
        opacity: 0.3,
        cursor: 'not-allowed',
    },
    navIcon: {
        width: '24px',
        height: '24px',
    },
    flipbookWrapper: {
        transformOrigin: 'center',
        transition: 'transform 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Text content styles
    textContentContainer: {
        width: '800px',
        height: '900px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    textPage: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    textHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '24px 32px 16px',
        borderBottom: '2px solid #f3f4f6',
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
    },
    textIcon: {
        width: '24px',
        height: '24px',
        color: '#2563eb',
    },
    textTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1f2937',
        margin: 0,
    },
    textContent: {
        flex: 1,
        padding: '32px',
        overflow: 'auto',
        fontSize: '16px',
        lineHeight: '1.8',
        color: '#374151',
        backgroundColor: 'white',
    },

    // Page styles (for PDF)
    page: {
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ddd',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    coverPage: {
        flex: 1,
        background: 'linear-gradient(135deg, #1e3a8a, #7c3aed)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '32px',
        borderRadius: '8px',
    },
    coverIcon: {
        width: '64px',
        height: '64px',
        marginBottom: '16px',
        color: '#93c5fd',
    },
    coverTitle: {
        fontSize: '30px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textAlign: 'center',
        margin: 0,
    },
    coverChapter: {
        fontSize: '20px',
        marginBottom: '16px',
        margin: 0,
    },
    coverAuthor: {
        fontSize: '18px',
        color: '#d1d5db',
        margin: 0,
    },
    pdfPageContent: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        padding: 0,
        backgroundColor: 'white',
    },
    pageImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    pageNumber: {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        zIndex: 10,
    },
    blankPage: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
    },
    blankText: {
        color: '#6c757d',
        fontSize: '14px',
        fontStyle: 'italic',
        margin: 0,
    },

    // Footer styles
    footer: {
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        color: 'white',
        padding: '16px',
        borderTop: '1px solid #374151',
    },
    footerContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1280px',
        margin: '0 auto',
        gap: '24px',
        flexWrap: 'wrap',
    },
    footerInfo: {
        fontSize: '14px',
        color: '#d1d5db',
    },
    authorName: {
        fontWeight: 500,
    },
    separator: {
        margin: '0 8px',
    },
    pageNavigation: {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
    },
    pageInputGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    pageLabel: {
        fontSize: '14px',
        color: '#9ca3af',
    },
    pageInputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        padding: '4px',
    },
    pageInput: {
        width: '64px',
        padding: '4px 8px',
        backgroundColor: 'transparent',
        color: 'white',
        border: 'none',
        textAlign: 'center',
        fontSize: '14px',
        borderRadius: '4px',
    },
    progressGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    progressBarContainer: {
        width: '160px',
        height: '8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        background: 'linear-gradient(to right, #3b82f6, #2563eb)',
        borderRadius: '4px',
        transition: 'width 0.5s ease',
    },
    chapterNavigation: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    chapterButton: {
        padding: '8px 16px',
        backgroundColor: '#374151',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    nextChapterButton: {
        background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
    },

    // Modal styles
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90vw',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    },
    modalHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f8fafc',
        borderRadius: '12px 12px 0 0',
    },
    modalTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#1f2937',
    },
    modalIcon: {
        width: '20px',
        height: '20px',
        color: '#2563eb',
    },
    closeButton: {
        padding: '8px',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#6b7280',
        transition: 'all 0.2s',
    },
    modalBody: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    modalLoading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '48px',
        color: '#6b7280',
    },
    loadingSpinner: {
        width: '20px',
        height: '20px',
        animation: 'spin 1s linear infinite',
    },
    chaptersList: {
        flex: 1,
        overflow: 'auto',
        padding: '8px',
    },
    chapterItem: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px',
        margin: '8px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid #e5e7eb',
    },
    currentChapterItem: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
    },
    chapterInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    chapterHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
    },
    chapterIcon: {
        padding: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chapterTypeIcon: {
        width: '16px',
        height: '16px',
        color: '#6b7280',
    },
    chapterTitle: {
        flex: 1,
    },
    chapterName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 4px 0',
    },
    chapterMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
    },
    chapterOrder: {
        fontSize: '12px',
        color: '#6b7280',
        backgroundColor: '#e5e7eb',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: '500',
    },
    chapterType: {
        fontSize: '12px',
        color: '#059669',
        backgroundColor: '#d1fae5',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: '500',
    },
    wordCount: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: '#6b7280',
    },
    clockIcon: {
        width: '12px',
        height: '12px',
    },
    chapterPreview: {
        marginTop: '8px',
    },
    previewText: {
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: '1.5',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    },
    currentBadge: {
        padding: '4px 8px',
        backgroundColor: '#2563eb',
        color: 'white',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        alignSelf: 'flex-start',
    },
};

export default PDFFlipbook;
