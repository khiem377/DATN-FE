import useSWR from 'swr';

// ✅ Thêm fetcher ở đây
const fetcher = (url) => fetch(url).then((res) => res.json());

export const useReviews = (bookId, starLevel = 'all') => {
    const url = bookId
        ? `http://localhost:8000/api/ratings/book/${bookId}/filter${
              starLevel !== 'all' ? `?star_level=${starLevel}` : ''
          }`
        : null;

    const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 30000, // 30 seconds
    });

    const reviews =
        data?.status && data.data.ratings
            ? data.data.ratings.map((rating) => ({
                  id: rating.rating_id,
                  user: {
                      name: rating?.user_name,
                      avatar: rating?.user_avatar,
                  },
                  rating: rating.rating_star,
                  comment: rating.comment,
                  date: rating.created_at,
                  timeAgo: rating.time_ago,
                  likes: Math.floor(Math.random() * 20),
              }))
            : [];

    return {
        reviews,
        isLoading,
        error,
        mutate,
    };
};
