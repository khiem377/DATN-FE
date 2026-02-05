// hooks/useBooksByAuthor.js
import useSWR from 'swr';

const BASE_URL = 'http://localhost:8000/api';

const fetcher = async (url) => {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.result === 0) {
        throw new Error(data.msg || 'Lỗi khi lấy sách theo tác giả');
    }

    return data;
};

export const useBooksByAuthor = (author) => {
    const shouldFetch = !!author; // chỉ fetch khi có author
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? `${BASE_URL}/books/search?author=${encodeURIComponent(author)}` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 3600000,
        },
    );

    return {
        books: data || [],
        isLoading,
        error,
        mutate,
    };
};
