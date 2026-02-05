// hooks/useAllBooks.js
import useSWR from 'swr';

const BASE_URL = 'http://localhost:8000/api';

const fetcher = async (url) => {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.result === 0) {
        throw new Error(data.msg || 'Lỗi khi lấy danh sách sách');
    }

    return data;
};

export const useAllBooks = () => {
    const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/books`, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 3600000, // 1 hour
    });

    const books = {
        featured: data?.latest_ebooks?.slice(0, 5) || [],
        topRated: data?.top_rated_books || [],
        mostViewed: data?.top_viewed_books || [],
        ebooks: data?.latest_ebooks || [],
        paperBooks: data?.latest_paper_books || [],
    };

    return {
        books,
        isLoading,
        error,
        mutate,
    };
};
