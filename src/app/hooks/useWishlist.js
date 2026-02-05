// src/app/hooks/useWishlist.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

// fetcher nhận [url, token] để khỏi đụng localStorage trong SSR
const fetcher = async ([url, token]) => {
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const text = await res.text(); // BE lỗi có khi trả HTML
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text?.slice(0, 200)}`);
    }
    return text ? JSON.parse(text) : {};
};

export const useWishlist = () => {
    const [token, setToken] = useState(null);

    // Lấy token CHỈ bên client
    useEffect(() => {
        try {
            const t = window?.localStorage?.getItem('token');
            setToken(t || null);
        } catch {
            setToken(null);
        }
    }, []);

    const swrKey = useMemo(() => (token ? ['http://localhost:8000/api/books/followed', token] : null), [token]);

    const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60_000,
    });

    // Phòng data rỗng/lệch format
    const wishlist = useMemo(() => {
        if (data?.status && Array.isArray(data?.followed_books)) {
            return data.followed_books.map((b) => b.id);
        }
        return [];
    }, [data]);

    const toggleWishlist = async (bookId) => {
        if (!token) return false;

        const isFollowed = wishlist.includes(bookId);
        const url = isFollowed ? 'http://localhost:8000/api/books/unfollow' : 'http://localhost:8000/api/books/follow';

        try {
            // Optimistic UI nhẹ
            const optimistic = isFollowed ? wishlist.filter((id) => id !== bookId) : [...wishlist, bookId];

            // cập nhật tạm thời
            mutate(
                (prev) => ({
                    ...prev,
                    status: true,
                    followed_books: (prev?.followed_books || []).filter(
                        (b) => optimistic.includes(b.id) || (!isFollowed && b.id === bookId),
                    ), // tạm giữ cấu trúc
                }),
                { revalidate: false },
            );

            const res = await fetch(url, {
                method: isFollowed ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ book_id: bookId }),
            });

            const text = await res.text();
            const result = text ? JSON.parse(text) : {};

            if (!res.ok || !result?.status) {
                // rollback nếu fail
                await mutate(); // refetch từ server
                return false;
            }

            // refetch để đồng bộ chuẩn
            await mutate();
            return true;
        } catch (e) {
            console.error('toggle wishlist lỗi:', e);
            await mutate(); // rollback
            return false;
        }
    };

    return {
        wishlist,
        isLoading,
        error,
        toggleWishlist,
        mutate,
    };
};
