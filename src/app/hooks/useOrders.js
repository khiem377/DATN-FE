import { message } from 'antd';
import axios from 'axios';
import useSWR from 'swr';

const fetchOrders = async (token) => {
    const response = await axios.get('http://localhost:8000/api/orders', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data.data.orders;
};

const fetchOrderDetail = async (id, token) => {
    const response = await axios.get(`http://localhost:8000/api/orders/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data.data.order;
};

export const useOrders = (token, enabled = false) => {
    const { data, error, isLoading, mutate } = useSWR(
        enabled && token ? ['orders', token] : null,
        ([, token]) => fetchOrders(token),
        {
            revalidateOnFocus: false,
            onError: (error) => {
                message.error('Lỗi khi lấy đơn hàng');
                console.error('Lỗi gọi API:', error.response?.data || error.message || error);
            },
        },
    );

    const cancelOrder = async (id) => {
        try {
            await axios.post(
                `http://localhost:8000/api/orders/${id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            message.success('Đã hủy đơn hàng');
            mutate(); // Refresh data
        } catch (error) {
            message.error('Không thể hủy đơn hàng');
            throw error;
        }
    };

    return {
        orders: data || [],
        loading: isLoading,
        error,
        mutate,
        cancelOrder,
    };
};

export const useOrderDetail = (orderId, token) => {
    const { data, error, isLoading } = useSWR(
        orderId && token ? ['order-detail', orderId, token] : null,
        ([, id, token]) => fetchOrderDetail(id, token),
        {
            revalidateOnFocus: false,
            onError: () => {
                message.error('Không thể lấy chi tiết đơn hàng');
            },
        },
    );

    return {
        orderDetail: data,
        loading: isLoading,
        error,
    };
};
