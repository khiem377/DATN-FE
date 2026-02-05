'use client';

import { message } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Stripper: loại bỏ mọi dấu tổ hợp (như kí tự sắc \u0301) trong URL
const stripCombining = (s) => (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

// Base URL: set trong .env hoặc fallback về 127.0.0.1:8000 (Laravel mặc định)
const RAW_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Ép dùng http (tránh https khi backend chỉ chạy http) + strip kí tự rác
const API_BASE = stripCombining(RAW_BASE).replace(/^https:\/\//i, 'http://');

export const useComments = (postId) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // GET: Lấy bình luận cha theo post_id
    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const url = `${API_BASE}/api/comments?post_id=${encodeURIComponent(postId)}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                const msg = (data && (data.message || data.error)) || `Không thể tải bình luận (HTTP ${res.status})`;
                throw new Error(msg);
            }

            // Laravel resource thường trả { success, data }
            setComments(data?.data ?? []);
        } catch (err) {
            console.error('fetchComments error:', err);
            message.error('Không thể tải bình luận');
        } finally {
            setLoading(false);
        }
    };

    // POST: Gửi comment hoặc reply
    const submitComment = async (content, parentId = null) => {
        const raw = (content || '').trim();
        if (!raw) {
            toast.error('Nội dung bình luận trống');
            return false;
        }
        if (!postId) {
            toast.error('Thiếu post_id');
            return false;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để bình luận!');
            return false;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/comments`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    post_id: typeof postId === 'string' ? parseInt(postId, 10) || postId : postId,
                    parent_id: parentId, // null = comment gốc
                    content: raw,
                }),
            });

            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                    return false;
                }
                if (res.status === 422 && data?.errors) {
                    const values = Object.values(data.errors);
                    const firstError =
                        (Array.isArray(values) && values.flat()[0]) ||
                        (values[0] && values[0][0]) ||
                        'Dữ liệu không hợp lệ';
                    toast.error(firstError);
                    return false;
                }
                const msg = data?.message || `Có lỗi xảy ra (HTTP ${res.status})`;
                toast.error(msg);
                return false;
            }

            // OK
            toast.success('Bình luận đã được gửi!');
            await fetchComments();
            return true;
        } catch (err) {
            console.error('submitComment error:', err);
            toast.error('Không thể kết nối máy chủ. Thử lại sau!');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [postId]);

    return {
        comments,
        loading,
        submitting,
        fetchComments,
        submitComment,
    };
};
