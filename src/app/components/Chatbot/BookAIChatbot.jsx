'use client';
import { BookOutlined, CloseOutlined, MessageOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, FloatButton, Input, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

const SmartBookChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allBooksData, setAllBooksData] = useState([]);
    const [authorsData, setAuthorsData] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [chatInitialized, setChatInitialized] = useState(false);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // API configuration
    const API_BASE = 'http://localhost:8000/api';
    const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDhZbONQYp7sPTaq_Wv83qRrQo3_FYCZhs';

    // Load chat from localStorage on component mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('smartBookChatMessages');
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                setMessages(parsedMessages);
            } catch (error) {
                console.error('Error loading saved messages:', error);
                initializeChat();
            }
        } else {
            initializeChat();
        }
        setChatInitialized(true);
    }, []);

    // Save messages to localStorage whenever messages change
    useEffect(() => {
        if (chatInitialized && messages.length > 0) {
            localStorage.setItem('smartBookChatMessages', JSON.stringify(messages));
        }
    }, [messages, chatInitialized]);

    // Initialize chat with welcome message
    const initializeChat = () => {
        const welcomeMessage = {
            id: 1,
            type: 'bot',
            content:
                'Chào bạn! Mình là AI tư vấn sách thông minh! 🤖📚\n\nMình có thể:\n🔍 Tìm sách theo tên, tác giả, thể loại\n💰 Tư vấn sách theo giá cả\n⭐ Gợi ý sách hay nhất\n📖 Kể chi tiết nội dung sách\n🛒 Hỗ trợ mua sắm\n\nBạn đang muốn tìm gì nào? ✨',
            timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
    };

    // Load all data when chatbot opens
    useEffect(() => {
        if (isOpen && !dataLoaded) {
            loadAllData();
        }
    }, [isOpen]);

    // Auto-focus on chat container when opened
    useEffect(() => {
        if (isOpen && chatContainerRef.current) {
            chatContainerRef.current.focus();
        }
    }, [isOpen]);

    const loadAllData = async () => {
        try {
            const [booksRes, authorsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE}/books`),
                fetch(`${API_BASE}/authors`),
                fetch(`${API_BASE}/categories`),
            ]);

            // Process books data
            const booksData = await booksRes.json();
            let allBooks = [];
            if (booksData.status === 'success') {
                const bookLists = [
                    ...(booksData.top_rated_books || []),
                    ...(booksData.top_viewed_books || []),
                    ...(booksData.latest_paper_books || []),
                    ...(booksData.latest_ebooks || []),
                ];
                allBooks = bookLists.filter((book, index, self) => index === self.findIndex((b) => b.id === book.id));
            }

            const authorsResult = await authorsRes.json();
            const authors = authorsResult.success ? authorsResult.data : [];

            const categoriesResult = await categoriesRes.json();
            const categories = categoriesResult.success ? categoriesResult.data : [];

            setAllBooksData(allBooks);
            setAuthorsData(authors);
            setCategoriesData(categories);
            setDataLoaded(true);

            console.log('Data loaded:', {
                books: allBooks.length,
                authors: authors.length,
                categories: categories.length,
            });
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Enhanced intelligent response generator with flexible handling
    const generateIntelligentResponse = (userMessage) => {
        const msg = userMessage.toLowerCase().trim();

        // Greeting responses
        if (msg.match(/^(chào|hello|hi|xin chào|hey|hii|helo)/)) {
            const greetings = [
                `Chào bạn nha! 😊 Mình có ${allBooksData.length} cuốn sách đang chờ bạn khám phá đấy!\n\nBạn muốn tìm sách gì hôm nay?`,
                `Hello! 👋 Mình đã chuẩn bị sẵn ${categoriesData.length} thể loại sách khác nhau cho bạn rồi!\n\nBạn quan tâm đến thể loại nào nhất?`,
                `Chào bạn! ✨ Với ${authorsData.length} tác giả nổi tiếng, mình tin chắc sẽ tìm được sách ưng ý cho bạn!\n\nCùng bắt đầu tìm kiếm nhé! 📚`,
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Flexible handling for "Kiều" or classic literature requests
        if (msg.includes('kiều') || msg.includes('truyện kiều') || msg.includes('kim vân kiều')) {
            return `Ôi! Bạn hỏi về "Truyện Kiều" - tác phẩm kinh điển của Nguyễn Du á! 📚✨\n\nHiện tại trong kho của mình chưa có "Truyện Kiều", nhưng đây là tác phẩm văn học cổ điển rất nổi tiếng!\n\n💡 **Mình có thể gợi ý:**\n• Sách văn học Việt Nam khác\n• Sách lịch sử và văn hóa\n• Các tác phẩm cổ điển khác\n\nHoặc bạn có muốn mình tìm sách tương tự về văn học cổ điển không? 🤔`;
        }

        // Handle requests for specific genres or types not available
        const unavailableRequests = {
            manga: 'Hiện tại mình chưa có manga trong kho, nhưng có nhiều truyện tranh và comic khác! 📖',
            'light novel': 'Light novel thì mình chưa có, nhưng có thể tìm tiểu thuyết và truyện dài hay! 📚',
            webtoon: 'Webtoon mình chưa có, nhưng có truyện tranh và manga thì có đấy! 🎨',
            audibook: 'Audiobook mình chưa hỗ trợ, nhưng có ebook và sách giấy! 🎧➡️📖',
        };

        for (let [key, response] of Object.entries(unavailableRequests)) {
            if (msg.includes(key)) {
                return `${response}\n\nBạn có muốn xem những gì mình có không? Hoặc cho mình biết thể loại bạn thích! 😊`;
            }
        }

        // Help/guide requests
        if (msg.includes('giúp') || msg.includes('hướng dẫn') || msg.includes('làm gì') || msg.includes('hỗ trợ')) {
            return `Mình có thể giúp bạn rất nhiều thứ nè! 🚀\n\n🔍 **Tìm kiếm thông minh:**\n• "Tìm sách của tác giả [tên]"\n• "Sách thể loại trinh thám"\n• "Sách có từ 'yêu' trong tên"\n\n💰 **Tư vấn giá cả:**\n• "Sách dưới 100k"\n• "Sách từ 50k đến 150k"\n• "Sách giá rẻ nhất"\n\n⭐ **Gợi ý thông minh:**\n• "Gợi ý sách hay nhất"\n• "Sách được đánh giá cao"\n• "Sách bán chạy"\n\n📖 **Chi tiết sách:**\n• Gõ tên sách để xem thông tin chi tiết\n• Mô tả nội dung, giá cả, tình trạng kho\n\nThử ngay đi! 😄`;
        }

        // Thank you responses
        if (msg.includes('cảm ơn') || msg.includes('thanks') || msg.includes('thank you') || msg.includes('cám ơn')) {
            const thankResponses = [
                'Không có gì đâu bạn! 😊 Mình luôn sẵn sàng giúp bạn tìm sách hay!',
                'Hihi, được giúp bạn là niềm vui của mình! 🤗 Còn cần tư vấn gì nữa không?',
                'Hehe, cảm ơn bạn nhé! 💕 Có sách nào khác cần tìm hiểu không?',
            ];
            return thankResponses[Math.floor(Math.random() * thankResponses.length)];
        }

        // Bye/goodbye responses
        if (
            msg.includes('bye') ||
            msg.includes('tạm biệt') ||
            msg.includes('chào tạm biệt') ||
            msg.includes('goodbye')
        ) {
            const goodbyeResponses = [
                'Tạm biệt bạn nhé! 👋 Hẹn gặp lại lần sau, chúc bạn đọc sách vui vẻ! 📚✨',
                'Bye bye! 🥰 Nhớ quay lại tìm mình khi cần tư vấn sách nha!',
                'Chào bạn! 🌟 Chúc bạn có những cuốn sách hay và ngày tuyệt vời!',
            ];
            return goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)];
        }

        // Author search with intelligent matching
        const authorKeywords = ['tác giả', 'author', 'viết', 'của'];
        if (authorKeywords.some((keyword) => msg.includes(keyword))) {
            const foundAuthor = authorsData.find(
                (author) =>
                    msg.includes(author.name.toLowerCase()) ||
                    author.name.toLowerCase().includes(msg.replace(/tác giả|author|viết|của/g, '').trim()),
            );

            if (foundAuthor) {
                const authorBooks = allBooksData.filter((book) => book.author?.id === foundAuthor.id);
                if (authorBooks.length > 0) {
                    let response = `Tuyệt! Mình tìm thấy ${authorBooks.length} cuốn sách của tác giả **${foundAuthor.name}**! 📚✨\n\n`;

                    authorBooks.slice(0, 5).forEach((book, index) => {
                        const price =
                            book.discount_price && book.discount_price !== '0.00'
                                ? `~~${formatPrice(book.price)}~~ **${formatPrice(book.discount_price)}** 🔥`
                                : formatPrice(book.price);

                        response += `${index + 1}. 📖 **${book.title}**\n`;
                        response += `   💰 ${price}\n`;
                        response += `   📚 ${book.category?.name || 'Unknown'}\n`;
                        if (book.rating_avg !== '0.0') response += `   ⭐ ${book.rating_avg}/5\n`;
                        response += `   📦 ${book.stock > 0 ? 'Còn hàng ✅' : 'Hết hàng 😢'}\n\n`;
                    });

                    if (authorBooks.length > 5) {
                        response += `Và còn ${authorBooks.length - 5} cuốn khác nữa!\n\n`;
                    }

                    response += 'Bạn muốn xem chi tiết cuốn nào không? 😊';
                    return response;
                } else {
                    return `Tác giả **${foundAuthor.name}** có trong danh sách, nhưng hiện tại chưa có sách nào của tác giả này trong kho.\n\n🔄 Mình sẽ cập nhật khi có sách mới!\n\nBạn có muốn xem sách của tác giả khác không? 🤔`;
                }
            }

            const randomAuthors = authorsData.sort(() => 0.5 - Math.random()).slice(0, 8);
            let response = `Mình có ${authorsData.length} tác giả trong hệ thống! Một số tác giả nổi bật:\n\n`;
            randomAuthors.forEach((author, index) => {
                response += `${index + 1}. ${author.name}\n`;
            });
            response += `\nBạn muốn tìm sách của tác giả nào? Gõ tên để mình tìm giúp nha! 😊`;
            return response;
        }

        // Category search with intelligent matching
        const categoryKeywords = ['thể loại', 'category', 'loại sách', 'genre'];
        const foundCategory = categoriesData.find(
            (cat) => msg.includes(cat.name.toLowerCase()) || categoryKeywords.some((keyword) => msg.includes(keyword)),
        );

        if (foundCategory) {
            const categoryBooks = allBooksData.filter((book) => book.category?.id === foundCategory.id);
            if (categoryBooks.length > 0) {
                let response = `Tìm thấy ${categoryBooks.length} cuốn sách **${foundCategory.name}**! 🎯\n\n`;

                const topBooks = categoryBooks
                    .sort((a, b) => (parseFloat(b.rating_avg) || 0) - (parseFloat(a.rating_avg) || 0))
                    .slice(0, 4);

                topBooks.forEach((book, index) => {
                    const price =
                        book.discount_price && book.discount_price !== '0.00'
                            ? `~~${formatPrice(book.price)}~~ **${formatPrice(book.discount_price)}** 🔥`
                            : formatPrice(book.price);

                    response += `${index + 1}. 📖 **${book.title}**\n`;
                    response += `   ✍️ ${book.author?.name || 'Unknown'}\n`;
                    response += `   💰 ${price}\n`;
                    if (book.rating_avg !== '0.0') response += `   ⭐ ${book.rating_avg}/5\n`;
                    response += `   📦 ${book.stock > 0 ? 'Còn hàng' : 'Hết hàng'}\n\n`;
                });

                response += `Bạn muốn xem thêm sách ${foundCategory.name} khác không? 😊`;
                return response;
            }
        }

        if (categoryKeywords.some((keyword) => msg.includes(keyword))) {
            let response = `Mình có ${categoriesData.length} thể loại sách đa dạng:\n\n`;
            categoriesData.forEach((cat, index) => {
                const count = allBooksData.filter((book) => book.category?.id === cat.id).length;
                response += `${index + 1}. **${cat.name}** (${count} cuốn)\n`;
            });
            response += `\nBạn quan tâm thể loại nào? Gõ tên để mình tìm sách cho bạn! 📚`;
            return response;
        }

        // Intelligent price search
        const pricePatterns = [
            /(\d+)\s*k?\s*(?:đến|tới|đến|-|~)\s*(\d+)\s*k?/,
            /dưới\s*(\d+)\s*k?/,
            /trên\s*(\d+)\s*k?/,
            /khoảng\s*(\d+)\s*k?/,
            /(\d+)\s*k?\s*(?:nghìn|ngàn)/,
        ];

        for (let pattern of pricePatterns) {
            const match = msg.match(pattern);
            if (match) {
                return handlePriceSearch(match, msg);
            }
        }

        // Recommendation requests
        const recommendKeywords = ['gợi ý', 'đề xuất', 'recommend', 'sách hay', 'nên đọc', 'tốt nhất', 'bestseller'];
        if (recommendKeywords.some((keyword) => msg.includes(keyword))) {
            return generateRecommendations();
        }

        // Specific book search
        const possibleBook = findBookByTitle(msg);
        if (possibleBook) {
            return generateBookDetails(possibleBook);
        }

        // Handle random/unclear queries with flexible responses
        return generateFlexibleDefault(msg);
    };

    // Enhanced flexible default response
    const generateFlexibleDefault = (msg) => {
        // Keywords analysis for better responses
        const keywordResponses = {
            rẻ: 'Bạn muốn tìm sách giá rẻ à? Gõ "sách dưới 100k" để mình tìm giúp nha! 💰',
            mới: 'Muốn xem sách mới nhất? Mình có nhiều sách hot đang được cập nhật đấy! 🔥',
            hay: 'Tìm sách hay? Gõ "gợi ý sách hay" để mình recommend nhé! ⭐',
            yêu: 'Tìm sách về tình yêu? Thử "sách ngôn tình" hoặc tên sách cụ thể! 💕',
            'trinh thám': 'Ôi fan trinh thám nè! Gõ "sách trinh thám" để xem collection của mình! 🕵️',
            'lịch sử': 'Quan tâm đến lịch sử? Mình có mục "sách lịch sử" đấy! 📜',
            'tâm lý': 'Sách tâm lý rất hay! Thử tìm "sách phát triển bản thân" nhé! 🧠',
            'kinh doanh': 'Sách kinh doanh? Mình có "sách đời sống" có thể phù hợp! 💼',
            'nấu ăn': 'Sách nấu ăn hiện mình chưa có, nhưng có "sách đời sống" hay lắm! 👨‍🍳',
            'du lịch': 'Sách du lịch à? Hiện chưa có, nhưng có thể tìm trong "sách đời sống"! ✈️',
        };

        for (let [keyword, response] of Object.entries(keywordResponses)) {
            if (msg.includes(keyword)) {
                return `${response}\n\n💡 **Hoặc bạn có thể:**\n🔍 Gõ tên sách cụ thể\n👤 Tìm theo tác giả\n📚 Xem theo thể loại\n💰 Tìm theo giá cả\n\nCứ thoải mái hỏi mình nhé! 😊`;
            }
        }

        // If no keywords match, provide a friendly and encouraging response
        const encouragingResponses = [
            `Hmm, mình chưa hiểu rõ ý bạn lắm! 🤔 Nhưng đừng lo, mình có ${allBooksData.length} cuốn sách và luôn sẵn sàng giúp bạn tìm kiếm!`,
            `Ơ, có vẻ như bạn đang tìm gì đó đặc biệt nhỉ? 😄 Với ${categoriesData.length} thể loại sách, chắc chắn sẽ có gì đó dành cho bạn!`,
            `Bạn ơi, mình muốn giúp nhưng chưa hiểu rõ yêu cầu! 😅 Cùng tìm hiểu xem ${authorsData.length} tác giả của mình có ai bạn thích không nhé!`,
        ];

        const randomResponse = encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)];

        return `${randomResponse}\n\n🎯 **Thử những cách này nhé:**\n• "Gợi ý sách hay nhất"\n• "Sách của [tên tác giả]"\n• "Sách [thể loại]"\n• "Sách từ [giá] đến [giá]"\n• Hoặc gõ tên sách cụ thể\n\nMình luôn ở đây để giúp bạn! 🤗`;
    };

    const handlePriceSearch = (match, originalMsg) => {
        let minPrice = 0,
            maxPrice = Infinity;

        if (originalMsg.includes('dưới')) {
            maxPrice = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1);
        } else if (originalMsg.includes('trên')) {
            minPrice = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1);
        } else if (originalMsg.includes('khoảng')) {
            const price = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1);
            minPrice = price * 0.8;
            maxPrice = price * 1.2;
        } else if (match[2]) {
            minPrice = parseInt(match[1]) * (match[1].length <= 3 ? 1000 : 1);
            maxPrice = parseInt(match[2]) * (match[2].length <= 3 ? 1000 : 1);
        }

        const booksInRange = allBooksData.filter((book) => {
            const price =
                book.discount_price && book.discount_price !== '0.00'
                    ? parseFloat(book.discount_price)
                    : parseFloat(book.price || 0);
            return price >= minPrice && price <= maxPrice && book.stock > 0;
        });

        if (booksInRange.length > 0) {
            let response = `Tìm thấy ${booksInRange.length} cuốn sách trong tầm giá của bạn! 💰✨\n\n`;

            const sortedBooks = booksInRange
                .sort((a, b) => {
                    const ratingA = parseFloat(a.rating_avg) || 0;
                    const ratingB = parseFloat(b.rating_avg) || 0;
                    return ratingB - ratingA;
                })
                .slice(0, 5);

            sortedBooks.forEach((book, index) => {
                const price =
                    book.discount_price && book.discount_price !== '0.00'
                        ? `~~${formatPrice(book.price)}~~ **${formatPrice(book.discount_price)}** 🔥`
                        : formatPrice(book.price);

                response += `${index + 1}. 📚 **${book.title}**\n`;
                response += `   ✍️ ${book.author?.name || 'Unknown'}\n`;
                response += `   💰 ${price}\n`;
                response += `   📚 ${book.category?.name || 'Unknown'}\n`;
                if (book.rating_avg !== '0.0') response += `   ⭐ ${book.rating_avg}/5\n`;
                response += '\n';
            });

            response += 'Bạn muốn xem chi tiết cuốn nào không? 😊';
            return response;
        } else {
            return `Hmm, hiện tại mình không tìm thấy sách nào trong tầm giá này! 😅\n\n💡 **Bạn có thể:**\n• Tăng ngân sách một chút?\n• Xem sách đang khuyến mãi 🔥\n• Tìm ebook giá rẻ hơn 📱\n• Xem sách miễn phí 🆓\n\nMình luôn sẵn sàng tư vấn thêm! 💪`;
        }
    };

    const generateRecommendations = () => {
        const topRated = allBooksData
            .filter((book) => parseFloat(book.rating_avg) > 0)
            .sort((a, b) => parseFloat(b.rating_avg) - parseFloat(a.rating_avg))
            .slice(0, 3);

        const onSale = allBooksData.filter((book) => book.discount_price && book.discount_price !== '0.00').slice(0, 2);

        let response = `Đây là những gợi ý sách tuyệt vời nhất của mình! ⭐\n\n`;

        if (topRated.length > 0) {
            response += `🏆 **SÁCH ĐƯỢC ĐÁNH GIÁ CAO NHẤT:**\n`;
            topRated.forEach((book, index) => {
                response += `${index + 1}. **${book.title}** - ${book.author?.name}\n`;
                response += `   ⭐ ${book.rating_avg}/5 | ${formatPrice(book.price)}\n\n`;
            });
        }

        if (onSale.length > 0) {
            response += `🔥 **ĐANG KHUYẾN MÃI:**\n`;
            onSale.forEach((book, index) => {
                response += `${index + 1}. **${book.title}**\n`;
                response += `   💰 ~~${formatPrice(book.price)}~~ **${formatPrice(book.discount_price)}**\n\n`;
            });
        }

        response += 'Cuốn nào bạn thấy hấp dẫn nhất? Mình kể chi tiết hơn nha! 😊';
        return response;
    };

    const findBookByTitle = (searchText) => {
        const cleanSearch = searchText.toLowerCase().replace(/["']/g, '');
        return allBooksData.find(
            (book) =>
                book.title?.toLowerCase().includes(cleanSearch) || cleanSearch.includes(book.title?.toLowerCase()),
        );
    };

    const generateBookDetails = (book) => {
        const price =
            book.discount_price && book.discount_price !== '0.00'
                ? `~~${formatPrice(book.price)}~~ **${formatPrice(book.discount_price)}** (Đang sale! 🔥)`
                : formatPrice(book.price);

        const description = book.description?.replace(/<[^>]*>/g, '').substring(0, 300) || 'Chưa có mô tả chi tiết';

        let response = `Tìm thấy rồi! Cuốn này hay lắm! 📚✨\n\n`;
        response += `📖 **${book.title}**\n\n`;
        response += `👨‍💼 **Tác giả:** ${book.author?.name || 'Unknown'}\n`;
        response += `📚 **Thể loại:** ${book.category?.name || 'Unknown'}\n`;
        response += `📰 **NXB:** ${book.publisher?.name || 'Unknown'}\n`;
        response += `💰 **Giá:** ${price}\n`;
        response += `📱 **Loại:** ${book.is_physical ? 'Sách giấy' : 'Ebook'}\n`;
        if (book.rating_avg !== '0.0') response += `⭐ **Rating:** ${book.rating_avg}/5 sao\n`;
        response += `👀 **Lượt xem:** ${book.views || 0}\n`;
        response += `📦 **Tình trạng:** ${book.stock > 0 ? `Còn ${book.stock} cuốn ✅` : 'Hết hàng 😢'}\n\n`;
        response += `**📝 Nội dung:**\n${description}...\n\n`;

        if (book.stock > 0) {
            response += 'Bạn có muốn mua không? Mình có thể tư vấn thêm về sách tương tự! 😊';
        } else {
            response += 'Để mình tìm sách tương tự nhé! 🔍';
        }

        return response;
    };

    const formatPrice = (price) => {
        if (!price || price === '0.00') return 'Miễn phí';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(parseFloat(price));
    };

    // Enhanced Gemini AI integration
    const callGeminiAI = async (userMessage) => {
        try {
            const systemPrompt = createAdvancedSystemPrompt();
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: `${systemPrompt}\n\nKhách hàng: ${userMessage}` }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.9,
                            maxOutputTokens: 2048,
                        },
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || generateIntelligentResponse(userMessage);
            }
        } catch (error) {
            console.error('Gemini AI error:', error);
        }

        return generateIntelligentResponse(userMessage);
    };

    const createAdvancedSystemPrompt = () => {
        const booksSummary = allBooksData.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author?.name,
            category: book.category?.name,
            price: book.price,
            discount_price: book.discount_price,
            stock: book.stock,
            rating: book.rating_avg,
            views: book.views,
            is_physical: book.is_physical,
        }));

        return `Bạn là AI tư vấn sách thông minh và cực kỳ linh hoạt! 🤖📚

TÍNH CÁCH: 
- Thân thiện, nhiệt tình như người bạn thân
- Linh hoạt trong mọi tình huống 
- Luôn tìm cách giúp đỡ dù câu hỏi khó hiểu
- Không bao giờ nói "không hiểu" mà luôn cố gắng đoán ý và gợi ý

NGUYÊN TẮC TRẢ LỜI LINH HOẠT:
✅ Nếu không có sách cụ thể → "Hiện tại chưa có, nhưng tương lai sẽ cập nhật! Thay vào đó..."
✅ Nếu câu hỏi mơ hồ → Đoán ý và đưa ra nhiều gợi ý phù hợp
✅ Nếu yêu cầu ngoài phạm vi → "Mình chuyên sách, nhưng có thể gợi ý sách liên quan..."
✅ Luôn kết thúc bằng câu hỏi để tiếp tục cuộc trò chuyện

DỮ LIỆU THỰC TẾ:
📚 Tổng số sách: ${allBooksData.length}
👥 Tác giả: ${authorsData
            .map((a) => a.name)
            .slice(0, 10)
            .join(', ')}...
📂 Thể loại: ${categoriesData.map((c) => c.name).join(', ')}

SÁCH HIỆN TẠI:
${JSON.stringify(booksSummary.slice(0, 20), null, 2)}

CÁC TÌNH HUỐNG ĐẶC BIỆT:
- "Truyện Kiều" → "Hiện chưa có tác phẩm kinh điển này, nhưng sẽ cập nhật! Bạn có muốn xem sách văn học Việt Nam khác?"
- Manga/Anime → "Chưa có manga, nhưng có truyện tranh và comic!"
- Sách không có → "Tương lai sẽ có! Hiện tại có thể xem sách tương tự..."

LUÔN LUÔN:
🌟 Tích cực và lạc quan
🌟 Đưa ra giải pháp thay thế
🌟 Sử dụng emoji phù hợp
🌟 Duy trì cuộc trò chuyện
🌟 Không bao giờ từ chối hoàn toàn

NHIỆM VỤ: Trở thành AI tư vấn sách thân thiện và linh hoạt nhất, luôn tìm cách giúp đỡ khách hàng!`;
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');
        setIsLoading(true);

        try {
            let aiResponse;
            if (dataLoaded && allBooksData.length > 0) {
                // Use Gemini AI if available, fallback to local intelligence
                aiResponse = await callGeminiAI(currentInput);
            } else {
                aiResponse = 'Mình đang tải dữ liệu sách... Vui lòng đợi một chút! 📚⏳';
            }

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Oops! Có lỗi xảy ra rồi 😅 Nhưng mình vẫn ở đây để giúp bạn! Thử hỏi lại nhé!',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Clear chat function
    const clearChat = () => {
        localStorage.removeItem('smartBookChatMessages');
        initializeChat();
    };

    const renderMessage = (message) => {
        const isBot = message.type === 'bot';
        return (
            <div
                key={message.id}
                style={{
                    display: 'flex',
                    justifyContent: isBot ? 'flex-start' : 'flex-end',
                    marginBottom: '12px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: isBot ? 'row' : 'row-reverse',
                        alignItems: 'flex-end',
                        maxWidth: '85%',
                    }}
                >
                    {isBot && (
                        <Avatar
                            icon={<RobotOutlined />}
                            size={32}
                            style={{
                                backgroundColor: '#1890ff',
                                marginRight: '8px',
                                flexShrink: 0,
                            }}
                        />
                    )}
                    <div
                        style={{
                            backgroundColor: isBot ? '#f0f2f5' : '#1890ff',
                            color: isBot ? '#000' : '#fff',
                            borderRadius: isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                            padding: '12px 16px',
                            maxWidth: '100%',
                            wordBreak: 'break-word',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            whiteSpace: 'pre-line',
                        }}
                    >
                        {message.content}
                    </div>
                </div>
            </div>
        );
    };

    const quickSuggestions = [
        { text: '📚 Gợi ý sách hay', value: 'gợi ý sách hay nhất' },
        { text: '💰 Sách giá rẻ', value: 'sách dưới 100k' },
        { text: '❤️ Sách ngôn tình', value: 'sách ngôn tình' },
        { text: '🕵️ Trinh thám', value: 'sách trinh thám' },
        { text: '🎯 Theo tác giả', value: 'tìm sách theo tác giả' },
        { text: '🔥 Đang sale', value: 'sách đang khuyến mãi' },
    ];

    return (
        <>
            {/* Enhanced Chat Icon with pulse animation */}
            <FloatButton
                icon={<MessageOutlined />}
                type="primary"
                style={{
                    right: 24,
                    bottom: 24,
                    width: isHovered ? 70 : 65,
                    height: isHovered ? 70 : 65,
                    fontSize: 26,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'scale(1.05) rotate(5deg)' : 'scale(1)',
                    boxShadow: isHovered ? '0 12px 30px rgba(24, 144, 255, 0.4)' : '0 6px 16px rgba(0,0,0,0.15)',
                    background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                    border: 'none',
                }}
                badge={{
                    dot: true,
                    style: {
                        backgroundColor: '#52c41a',
                        animation: 'pulse 2s infinite',
                    },
                }}
                onClick={() => setIsOpen(true)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                tooltip="💬 Chat với AI tư vấn sách thông minh - Luôn ghi nhớ cuộc trò chuyện!"
            />

            {/* Enhanced Chat Window with auto-focus */}
            {isOpen && (
                <div
                    ref={chatContainerRef}
                    tabIndex={-1}
                    style={{
                        position: 'fixed',
                        right: 24,
                        bottom: 110,
                        width: 400,
                        height: 650,
                        backgroundColor: '#fff',
                        borderRadius: '20px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                        border: '1px solid #e8e8e8',
                        animation: 'slideUpScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)',
                        outline: 'none',
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <style jsx>{`
                        @keyframes slideUpScale {
                            from {
                                opacity: 0;
                                transform: translateY(30px) scale(0.9);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }
                        @keyframes pulse {
                            0%,
                            100% {
                                opacity: 1;
                            }
                            50% {
                                opacity: 0.5;
                            }
                        }
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translateY(10px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>

                    {/* Enhanced Header with Clear Chat Button */}
                    <div
                        style={{
                            padding: '20px 24px',
                            background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
                            color: '#fff',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background:
                                    'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                                opacity: 0.1,
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'relative',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Avatar
                                    icon={<BookOutlined />}
                                    size={42}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: '#fff',
                                        backdropFilter: 'blur(10px)',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                    }}
                                />
                                <div>
                                    <Text strong style={{ fontSize: '18px', color: '#fff', display: 'block' }}>
                                        Smart Book AI
                                    </Text>
                                    <div
                                        style={{
                                            fontSize: '13px',
                                            opacity: 0.9,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <Badge status="processing" color="#52c41a" />
                                        {dataLoaded ? `${allBooksData.length} sách | Chat đã lưu` : 'Đang tải...'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    type="text"
                                    onClick={clearChat}
                                    style={{
                                        color: '#fff',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        height: '32px',
                                        padding: '0 8px',
                                    }}
                                    size="small"
                                >
                                    🗑️ Xóa chat
                                </Button>
                                <Button
                                    type="text"
                                    icon={<CloseOutlined />}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        color: '#fff',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            padding: '20px',
                            overflowY: 'auto',
                            backgroundColor: '#fafafa',
                            backgroundImage:
                                'radial-gradient(circle at 25px 25px, rgba(24,144,255,0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(54,207,201,0.05) 2%, transparent 0%)',
                            backgroundSize: '100px 100px',
                        }}
                    >
                        {messages.map(renderMessage)}

                        {/* Quick Suggestions - only show when less than 3 messages and data loaded */}
                        {messages.length <= 2 && dataLoaded && (
                            <div
                                style={{
                                    marginTop: '20px',
                                    animation: 'fadeInUp 0.6s ease-out 0.3s both',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: '13px',
                                        color: '#666',
                                        marginBottom: '12px',
                                        display: 'block',
                                        fontWeight: 500,
                                    }}
                                >
                                    💡 Gợi ý cho bạn:
                                </Text>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {quickSuggestions.map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            size="small"
                                            style={{
                                                fontSize: '12px',
                                                borderRadius: '16px',
                                                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
                                                borderColor: '#91d5ff',
                                                color: '#1890ff',
                                                fontWeight: 500,
                                                height: '32px',
                                                padding: '0 12px',
                                                transition: 'all 0.3s ease',
                                                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
                                            }}
                                            onClick={() => {
                                                setInputValue(suggestion.value);
                                                setTimeout(handleSendMessage, 100);
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'scale(1.05)';
                                                e.target.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'scale(1)';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                        >
                                            {suggestion.text}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    marginTop: '16px',
                                    animation: 'fadeInUp 0.3s ease-out',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Avatar icon={<RobotOutlined />} size={32} style={{ backgroundColor: '#1890ff' }} />
                                    <div
                                        style={{
                                            backgroundColor: '#f0f2f5',
                                            borderRadius: '18px 18px 18px 4px',
                                            padding: '12px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        <Spin size="small" />
                                        <span style={{ fontSize: '14px', color: '#666' }}>
                                            Đang suy nghĩ cách giúp bạn tốt nhất...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Enhanced Input Area */}
                    <div
                        style={{
                            padding: '16px 20px',
                            borderTop: '1px solid #f0f0f0',
                            backgroundColor: '#fff',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                            <TextArea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Hỏi mình về sách bạn quan tâm..."
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                style={{
                                    flex: 1,
                                    borderRadius: '24px',
                                    resize: 'none',
                                    border: '2px solid #e8e8e8',
                                    transition: 'all 0.3s ease',
                                    fontSize: '14px',
                                    padding: '12px 16px',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#1890ff';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(24, 144, 255, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e8e8e8';
                                    e.target.style.boxShadow = 'none';
                                }}
                                disabled={isLoading}
                            />
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<SendOutlined />}
                                onClick={handleSendMessage}
                                loading={isLoading}
                                disabled={!inputValue.trim()}
                                size="large"
                                style={{
                                    flexShrink: 0,
                                    background: inputValue.trim()
                                        ? 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)'
                                        : '#d9d9d9',
                                    border: 'none',
                                    boxShadow: inputValue.trim() ? '0 4px 12px rgba(24, 144, 255, 0.3)' : 'none',
                                    transition: 'all 0.3s ease',
                                    width: '44px',
                                    height: '44px',
                                }}
                            />
                        </div>

                        {/* Status indicator */}
                        <div
                            style={{
                                marginTop: '8px',
                                fontSize: '11px',
                                color: '#999',
                                textAlign: 'center',
                            }}
                        >
                            {dataLoaded
                                ? `🤖 AI thông minh với ${allBooksData.length} cuốn sách | 💾 Chat tự động lưu`
                                : '⏳ Đang tải dữ liệu sách...'}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SmartBookChatbot;
