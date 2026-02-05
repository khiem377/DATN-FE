import useSWR from 'swr';

const fetchOrderStatus = async (orderId, token) => {
    const response = await fetch(`http://localhost:8000/api/orders/${orderId}/sync-status`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (result.success && result.status) {
        return result.status;
    }

    throw new Error('Không lấy được trạng thái đơn hàng');
};

export const useOrderStatus = (orderId, token) => {
    const { data, error, isLoading } = useSWR(
        orderId && token ? ['order-status', orderId, token] : null,
        ([, id, token]) => fetchOrderStatus(id, token),
        {
            revalidateOnFocus: false,
            refreshInterval: 30000, // Refresh every 30 seconds
            onError: (err) => {
                console.warn('Lỗi khi gọi API trạng thái:', err);
            },
        },
    );

    return {
        status: data,
        loading: isLoading,
        error,
    };
};
