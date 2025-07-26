// ReactionButton.js
'use client';

import { LikeOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import useReaction from '../../hooks/useReaction';

const typeToLabel = {
    like: 'Thích',
    love: 'Yêu thích',
    haha: 'Haha',
    wow: 'Wow',
    sad: 'Buồn',
    angry: 'Phẫn nộ',
};

const typeToColor = {
    like: '#3578E5',
    love: '#F33E58',
    haha: '#F7B125',
    wow: '#F7B125',
    sad: '#F7B125',
    angry: '#E9710F',
};

const typeToEmoji = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡',
};

const ReactionButton = ({
    itemId,

    parentId, // Thêm parentId prop
    buttonStyle = {},
    reactionStyle = {},
    reactionSummary = {},
    reactions = null,
    onReactionUpdate,
}) => {
    const [currentUserReaction, setCurrentUserReaction] = useState(null);
    const [localReactionSummary, setLocalReactionSummary] = useState(reactionSummary);

    const {
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
        setShowReactions,
        setHoveredReaction,
    } = useReaction();

    useEffect(() => {
        if (reactions?.data && Array.isArray(reactions.data)) {
            const currentUserId = getCurrentUserId();
            const userReaction = reactions.data.find((r) => r.user_id === currentUserId);
            setCurrentUserReaction(userReaction?.type || null);
        }
        setLocalReactionSummary(reactionSummary);
    }, [reactions, reactionSummary]);

    const getCurrentUserId = () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData).id : null;
    };

    const postId = localStorage.getItem('postid');

    console.log(postId);
    const handleReactionSuccess = async (itemId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = {
                Authorization: `Bearer ${token}`,
            };

            // Gọi API để lấy comments của post
            const commentsPromise = postId
                ? fetch(`http://localhost:8000/api/comments?post_id=${postId}`, { headers })
                : null;

            // Gọi API để lấy replies của comment
            const repliesPromise = parentId
                ? fetch(`http://localhost:8000/api/comments/replies?parent_id=${parentId}`, { headers })
                : null;

            // Chờ cả 2 API được gọi (nếu có)
            const results = await Promise.allSettled([commentsPromise, repliesPromise].filter(Boolean));

            // Xử lý kết quả từ API comments
            if (results[0] && results[0].status === 'fulfilled') {
                const commentsResponse = results[0].value;
                if (commentsResponse.ok) {
                    const commentsData = await commentsResponse.json();
                    if (commentsData.success && onReactionUpdate) {
                        onReactionUpdate(commentsData.data, 'comments');
                    }
                }
            }

            // Xử lý kết quả từ API replies
            if (results[1] && results[1].status === 'fulfilled') {
                const repliesResponse = results[1].value;
                if (repliesResponse.ok) {
                    const repliesData = await repliesResponse.json();
                    if (repliesData.success && onReactionUpdate) {
                        onReactionUpdate(repliesData.data, 'replies');
                    }
                }
            }

            // Nếu không có postId và parentId, gọi API cũ
            if (!postId) {
                const response = await fetch(`http://localhost:8000/api/comments/${itemId}`, { headers });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && onReactionUpdate) {
                        onReactionUpdate(data.data);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating comment data:', error);
        }
    };

    const label = typeToLabel[currentUserReaction] || 'Thích';
    const color = typeToColor[currentUserReaction] || '#65676b';
    const emoji = typeToEmoji[currentUserReaction];

    const totalCount = Object.values(localReactionSummary || {}).reduce((sum, count) => sum + count, 0);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                style={{
                    background: 'none',
                    border: 'none',
                    color: color,
                    cursor: 'pointer',
                    fontWeight: currentUserReaction ? '600' : '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    ...buttonStyle,
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={(e) => handleMouseUp(e, itemId, handleReactionSuccess)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, itemId, handleReactionSuccess)}
                onContextMenu={(e) => e.preventDefault()}
            >
                {currentUserReaction ? (
                    <span style={{ fontSize: '16px' }}>{emoji}</span>
                ) : (
                    <LikeOutlined style={{ fontSize: '16px' }} />
                )}
                <span>{label}</span>
                {totalCount > 0 && (
                    <span style={{ fontSize: '12px', color: '#65676b', fontWeight: '400' }}>({totalCount})</span>
                )}
            </button>

            {showReactions && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '0',
                        backgroundColor: 'white',
                        border: '1px solid #dadde1',
                        borderRadius: '25px',
                        padding: '8px 12px',
                        display: 'flex',
                        gap: '6px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        marginBottom: '8px',
                        animation: 'reactionPopup 0.2s ease-out',
                        ...reactionStyle,
                    }}
                    onMouseLeave={() => {
                        setShowReactions(false);
                        setHoveredReaction(null);
                    }}
                >
                    {reactionTypes.map((reaction) => (
                        <div
                            key={reaction.type}
                            style={{
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'transform 0.15s ease-out',
                                transform: hoveredReaction === reaction.type ? 'scale(1.4)' : 'scale(1)',
                                cursor: 'pointer',
                                backgroundColor: currentUserReaction === reaction.type ? '#e7f3ff' : 'transparent',
                                border: currentUserReaction === reaction.type ? '2px solid #1877f2' : 'none',
                            }}
                            onMouseEnter={() => handleReactionHover(reaction.type)}
                            onMouseLeave={() => setHoveredReaction(null)}
                            onClick={() => handleReactionClick(itemId, reaction.type, handleReactionSuccess)}
                            title={reaction.label}
                        >
                            <span style={{ fontSize: '22px', lineHeight: '1', userSelect: 'none' }}>
                                {reaction.emoji}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes reactionPopup {
                    0% {
                        opacity: 0;
                        transform: translateY(10px) scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default ReactionButton;
