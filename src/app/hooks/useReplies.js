'use client';

import { useState } from 'react';

const useReplies = (parentId) => {
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadReplies = async () => {
        if (!showReplies && replies.length === 0) {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/comments/replies?parent_id=${parentId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // body có thể rỗng nếu backend không cần
                    body: JSON.stringify({}),
                });

                const data = await res.json();
                if (data.success) {
                    setReplies(data.data);
                }
            } catch (err) {
                console.error('Lỗi khi tải replies:', err);
            } finally {
                setLoading(false);
            }
        }

        setShowReplies(!showReplies);
    };

    return {
        replies,
        showReplies,
        loading,
        loadReplies,
        hasReplies: replies.length > 0,
    };
};

export default useReplies;
