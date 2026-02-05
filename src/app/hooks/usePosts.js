import useSWR from 'swr';

const BASE_URL = 'http://localhost:8000/api';

const fetcher = async (url) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    });

    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Lỗi khi tải bài viết');
    }

    return data;
};

export const useAllPosts = (page = 1, perPage = 10) => {
    const { data, error, isLoading, mutate } = useSWR(`${BASE_URL}/posts?page=${page}&per_page=${perPage}`, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 3600000, // 1 hour
    });

    const posts = data?.data || [];
    const meta = data?.meta || {};

    return {
        posts,
        meta,
        isLoading,
        error,
        mutate,
    };
};
