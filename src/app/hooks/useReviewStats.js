import useSWR from 'swr';

// ✅ Thêm fetcher ở đây
const fetcher = (url) => fetch(url).then((res) => res.json());

export const useReviewStats = (bookId) => {
    const { data, error, isLoading, mutate } = useSWR(
        bookId ? `http://localhost:8000/api/ratings/book/${bookId}/stats` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000, // 30 seconds
        },
    );

    const reviewStats = data?.status
        ? {
              totalReviews: data.data.total_ratings || 0,
              averageRating: data.data.total_ratings > 0 ? parseFloat(data.data.average_display) : 0,
              ratingDistribution: {
                  5: data.data.star_distribution?.[5]?.count || 0,
                  4: data.data.star_distribution?.[4]?.count || 0,
                  3: data.data.star_distribution?.[3]?.count || 0,
                  2: data.data.star_distribution?.[2]?.count || 0,
                  1: data.data.star_distribution?.[1]?.count || 0,
              },
              starPercentages: {
                  5: data.data.star_distribution?.[5]?.percentage || 0,
                  4: data.data.star_distribution?.[4]?.percentage || 0,
                  3: data.data.star_distribution?.[3]?.percentage || 0,
                  2: data.data.star_distribution?.[2]?.percentage || 0,
                  1: data.data.star_distribution?.[1]?.percentage || 0,
              },
          }
        : {
              totalReviews: 0,
              averageRating: 0,
              ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
              starPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          };

    return {
        reviewStats,
        isLoading,
        error,
        mutate,
    };
};
