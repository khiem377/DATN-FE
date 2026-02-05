import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export const useBookDetail = (id) => {
    const { data, error, isLoading, mutate } = useSWR(id ? `http://localhost:8000/api/books/${id}` : null, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 3600000, // 1 hour
    });

    return {
        book: data,
        isLoading,
        error,
        mutate,
    };
};
