import { message } from 'antd';
import useSWR from 'swr';

const fetchFavoriteBooks = async (token) => {
    const response = await fetch('http://localhost:8000/api/books/followed', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (!data.status) {
        throw new Error('Không thể tải danh sách yêu thích');
    }

    return data.followed_books;
};

export const useFavoriteBooks = (token, enabled = false) => {
    const { data, error, isLoading, mutate } = useSWR(
        enabled && token ? ['favorite-books', token] : null,
        ([, token]) => fetchFavoriteBooks(token),
        {
            revalidateOnFocus: false,
            onError: (error) => {
                message.error(error.message || 'Lỗi kết nối API');
            },
        },
    );

    // Mock data fallback
    const mockData = [
        {
            id: 1,
            title: 'One Piece',
            description: 'Hành trình của Luffy để trở thành Vua Hải Tặc với những cuộc phiêu lưu đầy kịch tính.',
            cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
            rating_avg: '4.2',
            is_physical: 1,
            views: 5345,
            price: '0.00',
        },
        {
            id: 2,
            title: 'Attack on Titan',
            description: 'Cuộc chiến sinh tồn của nhân loại chống lại những titan khổng lồ đầy bí ẩn.',
            cover_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop',
            rating_avg: '4.5',
            is_physical: 0,
            views: 8234,
            price: '89000',
        },
        {
            id: 3,
            title: 'Death Note',
            description: 'Câu chuyện về Light Yagami và quyển sổ tử thần với những trò chơi tâm lý căng thẳng.',
            cover_image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
            rating_avg: '4.8',
            is_physical: 1,
            views: 12456,
            price: '120000',
        },
    ];

    return {
        favoriteBooks: error ? mockData : data || [],
        loading: isLoading,
        error,
        mutate,
    };
};
