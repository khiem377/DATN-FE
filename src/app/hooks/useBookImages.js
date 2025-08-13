import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export const useBookImages = (bookId) => {
    const { data, error, isLoading } = useSWR(
        bookId ? `https://smartbook.io.vn/api/books/${bookId}/images` : null,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 3600000, //  1hour
        },
    );

    return {
        images: data?.data || [],
        isLoading,
        error,
    };
};
