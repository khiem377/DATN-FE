import useSWR from 'swr';

const fetcher = async (url) => {
    console.log('🔗 Fetching URL:', url);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📡 API Response:', data);
    return data;
};

export const useSameAuthorBooks = (author, currentBookId) => {
    console.log('🔍 useSameAuthorBooks params:', { author, currentBookId });

    // Tạo URL dựa trên loại dữ liệu author
    let searchUrl = null;

    if (author) {
        if (typeof author === 'string') {
            // Nếu là string thì search theo name
            searchUrl = `http://localhost:8000/api/books/search?author=${encodeURIComponent(author)}`;
        } else if (typeof author === 'object') {
            // Nếu là object thì ưu tiên ID, fallback về name
            const authorId = author._id || author.id;
            const authorName = author.name;

            if (authorId) {
                // Thử search theo ID trước
                searchUrl = `http://localhost:8000/api/books/search?author=${encodeURIComponent(authorId)}`;
            } else if (authorName) {
                // Fallback về name
                searchUrl = `http://localhost:8000/api/books/search?author=${encodeURIComponent(authorName)}`;
            }
        }
    }

    console.log('🔗 Author search URL:', searchUrl);

    const { data, error, isLoading } = useSWR(searchUrl, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 600000,
        onError: (error) => {
            console.error('❌ useSameAuthorBooks error:', error);
        },
    });

    let books = [];

    if (data) {
        if (data.data && Array.isArray(data.data)) {
            books = data.data;
        } else if (data.books && Array.isArray(data.books)) {
            books = data.books;
        } else if (Array.isArray(data)) {
            books = data;
        }

        books = books.filter((book) => book.id !== currentBookId);
        console.log('📚 Final sameAuthorBooks:', books.length, 'books');
    }

    return { books, isLoading, error };
};
