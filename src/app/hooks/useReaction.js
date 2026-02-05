// hooks/useReaction.js
import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const useReaction = () => {
    const [showReactions, setShowReactions] = useState(false);
    const [hoveredReaction, setHoveredReaction] = useState(null);
    const pressTimerRef = useRef(null);
    const isLongPressRef = useRef(false);

    const reactionTypes = [
        { emoji: '👍', label: 'Thích', type: 'like' },
        { emoji: '❤️', label: 'Yêu thích', type: 'love' },
        { emoji: '😂', label: 'Haha', type: 'haha' },
        { emoji: '😮', label: 'Wow', type: 'wow' },
        { emoji: '😢', label: 'Buồn', type: 'sad' },
        { emoji: '😡', label: 'Phẫn nộ', type: 'angry' },
    ];

    const handleReaction = async (itemId, reactionType) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:8000/api/comments/${itemId}/react`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reaction_type: reactionType }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Reaction updated successfully:', data);
                toast.success('Bình luận thành công');
                return data;
            } else {
                console.error('Failed to update reaction:', response.status);
                throw new Error('Failed to update reaction');
            }
        } catch (error) {
            toast.error('Vui lòng đăng nhập để thả cảm xúc!');
            console.error('Error updating reaction:', error);
            throw error;
        }
    };

    const startPressTimer = useCallback(() => {
        isLongPressRef.current = false;
        pressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setShowReactions(true);
        }, 500); // 0.5s để hiện reactions
    }, []);

    const clearPressTimer = useCallback(() => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
    }, []);

    const handleMouseDown = useCallback(
        (e) => {
            e.preventDefault();
            startPressTimer();
        },
        [startPressTimer],
    );

    const handleMouseUp = useCallback(
        async (e, itemId, onSuccess) => {
            e.preventDefault();
            clearPressTimer();

            try {
                if (!isLongPressRef.current) {
                    // Click nhanh - thực hiện like
                    await handleReaction(itemId, 'like');
                    if (onSuccess) {
                        await onSuccess(itemId, 'like');
                    }
                } else if (hoveredReaction) {
                    // Long press và có reaction được hover
                    await handleReaction(itemId, hoveredReaction);
                    if (onSuccess) {
                        await onSuccess(itemId, hoveredReaction);
                    }
                }
            } catch (error) {
                console.error('Error in handleMouseUp:', error);
            }

            setShowReactions(false);
            setHoveredReaction(null);
        },
        [clearPressTimer, hoveredReaction],
    );

    const handleMouseLeave = useCallback(() => {
        clearPressTimer();
        if (!showReactions) {
            setShowReactions(false);
        }
    }, [clearPressTimer, showReactions]);

    const handleTouchStart = useCallback(
        (e) => {
            e.preventDefault();
            startPressTimer();
        },
        [startPressTimer],
    );

    const handleTouchEnd = useCallback(
        async (e, itemId, onSuccess) => {
            e.preventDefault();
            clearPressTimer();

            try {
                if (!isLongPressRef.current) {
                    // Tap nhanh - thực hiện like
                    await handleReaction(itemId, 'like');
                    if (onSuccess) {
                        await onSuccess(itemId, 'like');
                    }
                } else if (hoveredReaction) {
                    // Long press và có reaction được chọn
                    await handleReaction(itemId, hoveredReaction);
                    if (onSuccess) {
                        await onSuccess(itemId, hoveredReaction);
                    }
                }
            } catch (error) {
                console.error('Error in handleTouchEnd:', error);
            }

            setShowReactions(false);
            setHoveredReaction(null);
        },
        [clearPressTimer, hoveredReaction],
    );

    const handleReactionHover = useCallback((reactionType) => {
        setHoveredReaction(reactionType);
    }, []);

    const handleReactionClick = useCallback(async (itemId, reactionType, onSuccess) => {
        try {
            await handleReaction(itemId, reactionType);
            if (onSuccess) {
                await onSuccess(itemId, reactionType);
            }
        } catch (error) {
            console.error('Error in handleReactionClick:', error);
        }

        setShowReactions(false);
        setHoveredReaction(null);
    }, []);

    const resetReactions = useCallback(() => {
        setShowReactions(false);
        setHoveredReaction(null);
    }, []);

    return {
        reactionTypes,
        showReactions,
        hoveredReaction,
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
        handleTouchStart,
        handleTouchEnd,
        handleReactionHover,
        handleReactionClick,
        resetReactions,
        setShowReactions,
        setHoveredReaction,
    };
};

export default useReaction;
