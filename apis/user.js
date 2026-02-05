import axios from 'axios';

export const apiLoginUser = async (email, password) => {
    try {
        const response = await axios.post(`http://localhost:8000/api/login`, {
            email,
            password,
        });

        console.log('Đăng nhập thành công:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Lỗi đăng nhập:', error.response.data);
            throw new Error(error.response.data.message || 'Đăng nhập thất bại');
        } else {
            console.error('Lỗi kết nối:', error.message);
            throw new Error('Không thể kết nối đến server');
        }
    }
};

export const apiGetMe = async (token) => {
    try {
        const response = await axios.get(`${BASE_URL}/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Lỗi lấy thông tin người dùng:', error.response?.data || error.message);
        throw new Error('Không thể lấy thông tin người dùng');
    }
};

export const apiRegisterUser = async (name, email, password, password_confirmation, phone) => {
    const res = await axios.post(`${BASE_URL}/register`, {
        name,
        email,
        password,
        password_confirmation,
        phone,
    });
    return res.data;
};

export const apiForgotPassword = async (email) => {
    try {
        const response = await axios.post(`${BASE_URL}/forgot-password`, {
            email,
        });

        console.log('Gửi yêu cầu khôi phục thành công:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Lỗi khôi phục mật khẩu:', error.response.data);
            throw new Error(error.response.data.message || 'Khôi phục mật khẩu thất bại');
        } else {
            console.error('Lỗi kết nối:', error.message);
            throw new Error('Không thể kết nối đến server');
        }
    }
};

export const apiResetPassword = async ({ email, token, password, password_confirmation }) => {
    try {
        const response = await axios.post(`${BASE_URL}/reset-password`, {
            email,
            token,
            password,
            password_confirmation,
        });

        console.log('Đặt lại mật khẩu thành công:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Lỗi đặt lại mật khẩu:', error.response.data);
            throw new Error(error.response.data.message || 'Đặt lại mật khẩu thất bại');
        } else {
            console.error('Lỗi kết nối:', error.message);
            throw new Error('Không thể kết nối đến server');
        }
    }
};

const BASE_URL = 'http://localhost:8000/api';

export const apiSearchBooks = async (params = {}) => {
    try {
        const queryString = new URLSearchParams();

        // Thêm các tham số tìm kiếm
        if (params.name) queryString.append('name', params.name);
        if (params.author) queryString.append('author', params.author);
        if (params.category) queryString.append('category', params.category);
        if (params.price_min) queryString.append('price_min', params.price_min);
        if (params.price_max) queryString.append('price_max', params.price_max);
        if (params.type) queryString.append('type', params.type);
        if (params.available) queryString.append('available', params.available);
        if (params.sort) queryString.append('sort', params.sort);
        if (params.page) queryString.append('page', params.page);
        if (params.limit) queryString.append('limit', params.limit);

        const response = await axios.get(`${BASE_URL}/books/search?${queryString.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error searching books:', error);
        return {
            status: 'error',
            message: error.response?.data?.message || 'Có lỗi xảy ra khi tìm kiếm sách',
        };
    }
};

export const apiGetAuthors = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/authors`);
        return response.data;
    } catch (error) {
        console.error('Error fetching authors:', error);
        return { status: 'error', data: [] };
    }
};

// API lấy danh sách thể loại
export const apiGetCategories = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/categories`);
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return { status: 'error', data: [] };
    }
};

// New OTP API functions
// Mở file: apis/user.js hoặc tương tự
// Tìm function apiSendOtp hiện tại và thay thế bằng:

export const apiSendOtp = async (email, type = 'otp', orderData = null) => {
    const requestData = {
        email,
        type,
    };

    // Nếu là order success thì thêm order_data
    if (type === 'order_success' && orderData) {
        requestData.order_data = orderData;
    }

    const response = await fetch(`${BASE_URL}/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gửi email thất bại');
    }

    return response.json();
};

// Thêm helper function mới:
export const apiSendOrderSuccessEmail = async (email, orderData) => {
    return apiSendOtp(email, 'order_success', orderData);
};

export const apiVerifyOtp = async (email, otp) => {
    const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Xác thực OTP thất bại');
    }

    return response.json();
};
