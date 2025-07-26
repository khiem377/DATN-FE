'use client';

import { message } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export const useComments = (postId) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Lấy bình luận cha
    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/comments?post_id=${postId}`);
            const data = await res.json();
            if (data.success) {
                setComments(data.data);
            }
        } catch {
            message.error('Không thể tải bình luận');
        } finally {
            setLoading(false);
        }
    };

    // Gửi comment hoặc reply
    const submitComment = async (content, parentId = null) => {
        setSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:8000/api/comments', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_id: postId,
                    parent_id: parentId,
                    content: content,
                }),
            });

            const data = await res.json();
            if (data.success || res.ok) {
                toast.success('Bình luận đã được gửi!');
                await fetchComments();
                return true;
            } else {
                throw new Error(data.message || 'Lỗi khi gửi bình luận');
            }
        } catch  {
            toast.error('Vui lòng đăng nhập để bình luận');
            // setTimeout(()=>{
            //     router.push('/login')
            // },1000)
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (postId) fetchComments();
    }, [postId,fetchComments]);

    return {
        comments,
        loading,
        submitting,
        fetchComments,
        submitComment,
    };
};
