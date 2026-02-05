'use client';

import { DeleteOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { formatTime } from '../../utils/timeUtils';
import ReactionButton from './ReactionButton';
import ReplyItem from './ReplyItem';
import UserAvatar from './UserAvatar';

const CommentItem = ({ comment, onReply, onCommentUpdate, onCommentDelete, currentUserId }) => {
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showReactionDetails, setShowReactionDetails] = useState(false);
    const [commentData, setCommentData] = useState(comment);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Kiểm tra quyền sở hữu comment
    const isOwner = currentUserId && commentData.user_id === currentUserId;

    // Decode JWT token để lấy user info
    const getCurrentUser = () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const payload = JSON.parse(atob(token?.split('.')[1]));
            return payload;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    // Lấy current user khi component mount
    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            // Có thể set vào state nếu cần
        }
    }, []);

    const loadReplies = async () => {
        if (!showReplies && replies.length === 0) {
            setLoadingReplies(true);
            try {
                const res = await fetch(`http://localhost:8000/api/comments/replies?parent_id=${comment.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}), // nếu không cần gửi gì thêm trong body thì để rỗng
                });

                const data = await res.json();
                if (data.success) {
                    setReplies(data.data);
                }
            } catch (err) {
                console.error('Lỗi khi tải replies:', err);
            } finally {
                setLoadingReplies(false);
            }
        }
        setShowReplies(!showReplies);
    };

    const handleReactionUpdate = (updatedData, dataType) => {
        if (dataType === 'comments') {
            const updatedComment = updatedData.find((c) => c.id === commentData.id);
            if (updatedComment) {
                setCommentData(updatedComment);
                if (onCommentUpdate) {
                    onCommentUpdate(updatedComment);
                }
            }
        } else if (dataType === 'replies') {
            setReplies(updatedData);
        } else {
            setCommentData(updatedData);
            if (onCommentUpdate) {
                onCommentUpdate(updatedData);
            }
        }
    };

    const handleRepliesUpdate = (updatedReplies) => {
        if (Array.isArray(updatedReplies)) {
            setReplies(updatedReplies);
        }
    };

    const handleEditComment = async () => {
        if (editContent.trim() === '') {
            alert('Nội dung bình luận không được để trống');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:8000/api/comments/${commentData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ content: editContent.trim() }),
            });

            const data = await res.json();

            if (data.success) {
                setCommentData((prev) => ({
                    ...prev,
                    content: data.data.content,
                    updated_at: data.data.updated_at,
                }));

                if (onCommentUpdate) {
                    onCommentUpdate({
                        ...commentData,
                        content: data.data.content,
                        updated_at: data.data.updated_at,
                    });
                }

                setIsEditing(false);
            } else {
                alert(data.message || 'Có lỗi xảy ra khi cập nhật bình luận');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật bình luận:', err);
            alert('Lỗi kết nối server!');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteComment = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/comments/${commentData.id}`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const data = await res.json();

            if (data.success) {
                if (onCommentDelete) {
                    onCommentDelete(commentData.id);
                }
                setShowDeleteConfirm(false);
                setShowOptions(false);
            } else {
                alert(data.message || 'Có lỗi xảy ra khi xóa bình luận');
            }
        } catch (err) {
            console.error('Lỗi khi xóa bình luận:', err);
            alert('Lỗi kết nối server!');
        } finally {
            setIsDeleting(false);
        }
    };

    const postId = localStorage.getItem('postid');

    const handleReplySubmit = async () => {
        if (replyContent.trim() === '') {
            alert('Nội dung phản hồi không được để trống');
            return;
        }

        setIsSubmittingReply(true);
        try {
            // Lấy postId từ localStorage thay vì từ props
            const postId = localStorage.getItem('postid');

            if (!postId) {
                alert('Không tìm thấy ID bài viết');
                return;
            }

            const res = await fetch(`http://localhost:8000/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    post_id: parseInt(postId),
                    parent_id: commentData.id,
                    content: replyContent.trim(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Thêm reply mới vào danh sách
                setReplies((prev) => [...prev, data.data]);

                // Cập nhật số lượng replies
                setCommentData((prev) => ({
                    ...prev,
                    replies_count: prev.replies_count + 1,
                }));

                // Clear form
                setReplyContent('');
                setShowReplyForm(false);

                // Hiển thị replies nếu chưa hiển thị
                if (!showReplies) {
                    setShowReplies(true);
                }
            } else {
                alert(data.message || 'Có lỗi xảy ra khi gửi phản hồi');
            }
        } catch (err) {
            console.error('Lỗi khi gửi phản hồi:', err);
            alert('Lỗi kết nối server!');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const openEditMode = () => {
        setEditContent(commentData.content);
        setIsEditing(true);
        setShowOptions(false);
    };

    const cancelEdit = () => {
        setEditContent(commentData.content);
        setIsEditing(false);
    };

    const openDeleteConfirm = () => {
        setShowDeleteConfirm(true);
        setShowOptions(false);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleReplyClick = () => {
        setShowReplyForm(true);
        setReplyContent(`@${commentData?.user?.name} `);
    };

    const cancelReply = () => {
        setShowReplyForm(false);
        setReplyContent('');
    };

    const renderReactionsSummary = () => {
        const reactionSummary = commentData.reaction_summary || {};
        const totalReactions = Object.values(reactionSummary).reduce((sum, count) => sum + count, 0);

        if (totalReactions === 0) return null;

        const reactionEmojis = {
            like: '👍',
            love: '❤️',
            haha: '😂',
            wow: '😮',
            sad: '😢',
            angry: '😡',
        };

        return (
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        marginTop: '4px',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f2f5',
                        width: 'fit-content',
                        transition: 'background-color 0.2s',
                    }}
                    onClick={() => setShowReactionDetails(!showReactionDetails)}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#f0f2f5')}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                        {Object.keys(reactionSummary).map((type) => (
                            <span key={type} style={{ fontSize: '12px' }}>
                                {reactionEmojis[type]}
                            </span>
                        ))}
                    </div>
                    <span style={{ color: '#65676b', marginLeft: '4px', fontSize: '12px' }}>{totalReactions}</span>
                </div>

                {showReactionDetails && (
                    <>
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 998,
                            }}
                            onClick={() => setShowReactionDetails(false)}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                backgroundColor: 'white',
                                border: '1px solid #dadde1',
                                borderRadius: '8px',
                                padding: '12px',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                                zIndex: 999,
                                minWidth: '200px',
                                maxWidth: '300px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    color: '#1c1e21',
                                }}
                            >
                                Những người đã thả cảm xúc
                            </div>
                            {commentData.reactions?.data?.map((reaction) => (
                                <div
                                    key={reaction.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '4px 0',
                                        borderBottom: '1px solid #f0f2f5',
                                    }}
                                >
                                    <UserAvatar user={reaction?.user} size={24} />
                                    <span style={{ fontSize: '13px', flex: 1 }}>{reaction?.user?.name}</span>
                                    <span style={{ fontSize: '16px' }}>{reactionEmojis[reaction.type]}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
                <UserAvatar user={commentData?.user} />
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#1877f2', fontSize: '14px' }}>
                            {commentData?.user?.name}
                        </span>
                        <span style={{ color: '#65676b', fontSize: '14px', marginLeft: '8px' }}>
                            {formatTime(commentData.created_at)}
                        </span>
                        {commentData.updated_at !== commentData.created_at && (
                            <span
                                style={{ color: '#65676b', fontSize: '12px', marginLeft: '8px', fontStyle: 'italic' }}
                            >
                                (đã chỉnh sửa)
                            </span>
                        )}
                    </div>

                    {/* Nội dung bình luận hoặc form chỉnh sửa */}
                    {isEditing ? (
                        <div style={{ marginBottom: '12px' }}>
                            {/* Thanh công cụ */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    backgroundColor: '#f0f2f5',
                                    borderRadius: '8px 8px 0 0',
                                    borderBottom: '1px solid #e4e6ea',
                                }}
                            >
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    B
                                </button>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontStyle: 'italic',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    I
                                </button>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    ""
                                </button>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    &lt;/&gt;
                                </button>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    🖼️
                                </button>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#65676b',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    🔗
                                </button>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid #e4e6ea',
                                    borderTop: 'none',
                                    borderRadius: '0 0 8px 8px',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none',
                                    backgroundColor: '#fff',
                                }}
                                placeholder="Nhập nội dung bình luận..."
                                autoFocus
                            />

                            {/* Nút action */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                    marginTop: '8px',
                                }}
                            >
                                <button
                                    onClick={cancelEdit}
                                    disabled={isSaving}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #e4e6ea',
                                        borderRadius: '6px',
                                        backgroundColor: '#f8f9fa',
                                        color: '#65676b',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isSaving ? 'not-allowed' : 'pointer',
                                        opacity: isSaving ? 0.6 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => !isSaving && (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => !isSaving && (e.target.style.backgroundColor = '#f8f9fa')}
                                >
                                    HỦY
                                </button>
                                <button
                                    onClick={handleEditComment}
                                    disabled={isSaving || editContent.trim() === ''}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        backgroundColor: isSaving || editContent.trim() === '' ? '#e4e6ea' : '#1877f2',
                                        color: isSaving || editContent.trim() === '' ? '#bcc0c4' : '#fff',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isSaving || editContent.trim() === '' ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {isSaving ? (
                                        <>
                                            <div
                                                style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    border: '2px solid #bcc0c4',
                                                    borderTop: '2px solid #1877f2',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                }}
                                            />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        'LƯU LẠI'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: '#65676b', fontSize: '14px', marginBottom: '8px' }}>
                            {commentData?.content}
                        </div>
                    )}

                    {!isEditing && (
                        <div style={{ fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <ReactionButton
                                    itemId={commentData.id}
                                    postId={postId}
                                    buttonStyle={{ fontSize: '14px' }}
                                    reactionSummary={commentData.reaction_summary}
                                    reactions={commentData.reactions}
                                    onReactionUpdate={handleReactionUpdate}
                                />
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#65676b',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onClick={handleReplyClick}
                                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f2f5')}
                                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                >
                                    Phản hồi
                                </button>

                                {/* Chỉ hiển thị menu options nếu user là chủ comment */}
                                {isOwner && (
                                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                                        <div
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                backgroundColor: showOptions ? '#e4e6ea' : 'transparent',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onClick={() => setShowOptions(!showOptions)}
                                            onMouseEnter={(e) =>
                                                !showOptions && (e.target.style.backgroundColor = '#f0f2f5')
                                            }
                                            onMouseLeave={(e) =>
                                                !showOptions && (e.target.style.backgroundColor = 'transparent')
                                            }
                                        >
                                            <MoreOutlined style={{ color: '#65676b', fontSize: '16px' }} />
                                        </div>

                                        {showOptions && (
                                            <>
                                                <div
                                                    style={{
                                                        position: 'fixed',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        zIndex: 998,
                                                    }}
                                                    onClick={() => setShowOptions(false)}
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        right: 0,
                                                        background: '#fff',
                                                        border: '1px solid #dadde1',
                                                        borderRadius: '8px',
                                                        padding: '8px 0',
                                                        zIndex: 999,
                                                        minWidth: '150px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: '12px 16px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '14px',
                                                            transition: 'background-color 0.2s',
                                                        }}
                                                        onClick={openEditMode}
                                                        onMouseEnter={(e) =>
                                                            (e.target.style.backgroundColor = '#f0f2f5')
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.target.style.backgroundColor = 'transparent')
                                                        }
                                                    >
                                                        <EditOutlined style={{ color: '#65676b' }} />
                                                        Chỉnh sửa
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: '12px 16px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '14px',
                                                            transition: 'background-color 0.2s',
                                                            color: '#d73502',
                                                        }}
                                                        onClick={openDeleteConfirm}
                                                        onMouseEnter={(e) =>
                                                            (e.target.style.backgroundColor = '#f0f2f5')
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.target.style.backgroundColor = 'transparent')
                                                        }
                                                    >
                                                        <DeleteOutlined style={{ color: '#d73502' }} />
                                                        Xóa
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {renderReactionsSummary()}

                            {commentData.replies_count > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <button
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#65676b',
                                            cursor: 'pointer',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onClick={loadReplies}
                                        onMouseEnter={(e) => (e.target.style.backgroundColor = '#f0f2f5')}
                                        onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                    >
                                        {showReplies ? 'Ẩn phản hồi' : `Xem phản hồi (${commentData.replies_count})`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form phản hồi */}
                    {showReplyForm && (
                        <div style={{ marginTop: '12px', paddingLeft: '0' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <UserAvatar user={getCurrentUser()} size={32} />
                                <div style={{ flex: 1 }}>
                                    {/* Thanh công cụ */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 12px',
                                            backgroundColor: '#f0f2f5',
                                            borderRadius: '8px 8px 0 0',
                                            borderBottom: '1px solid #e4e6ea',
                                        }}
                                    >
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            B
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                fontStyle: 'italic',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            I
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            ""
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            &lt;/&gt;
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            🖼️
                                        </button>
                                        <button
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                color: '#65676b',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => (e.target.style.backgroundColor = '#e4e6ea')}
                                            onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                                        >
                                            🔗
                                        </button>
                                    </div>

                                    {/* Textarea cho phản hồi */}
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '60px',
                                            padding: '12px',
                                            border: '1px solid #e4e6ea',
                                            borderTop: 'none',
                                            borderRadius: '0 0 8px 8px',
                                            fontSize: '14px',
                                            fontFamily: 'inherit',
                                            resize: 'vertical',
                                            outline: 'none',
                                            backgroundColor: '#fff',
                                        }}
                                        placeholder="Viết phản hồi..."
                                        autoFocus
                                    />

                                    {/* Nút action cho phản hồi */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '8px',
                                            marginTop: '8px',
                                        }}
                                    >
                                        <button
                                            onClick={cancelReply}
                                            disabled={isSubmittingReply}
                                            style={{
                                                padding: '8px 16px',
                                                border: '1px solid #e4e6ea',
                                                borderRadius: '6px',
                                                backgroundColor: '#f8f9fa',
                                                color: '#65676b',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: isSubmittingReply ? 'not-allowed' : 'pointer',
                                                opacity: isSubmittingReply ? 0.6 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) =>
                                                !isSubmittingReply && (e.target.style.backgroundColor = '#e4e6ea')
                                            }
                                            onMouseLeave={(e) =>
                                                !isSubmittingReply && (e.target.style.backgroundColor = '#f8f9fa')
                                            }
                                        >
                                            HỦY
                                        </button>
                                        <button
                                            onClick={handleReplySubmit}
                                            disabled={isSubmittingReply || replyContent.trim() === ''}
                                            style={{
                                                padding: '8px 16px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                backgroundColor:
                                                    isSubmittingReply || replyContent.trim() === ''
                                                        ? '#e4e6ea'
                                                        : '#1877f2',
                                                color:
                                                    isSubmittingReply || replyContent.trim() === ''
                                                        ? '#bcc0c4'
                                                        : '#fff',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor:
                                                    isSubmittingReply || replyContent.trim() === ''
                                                        ? 'not-allowed'
                                                        : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {isSubmittingReply ? (
                                                <>
                                                    <div
                                                        style={{
                                                            width: '12px',
                                                            height: '12px',
                                                            border: '2px solid #bcc0c4',
                                                            borderTop: '2px solid #1877f2',
                                                            borderRadius: '50%',
                                                            animation: 'spin 1s linear infinite',
                                                        }}
                                                    />
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                'GỬI'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hiển thị danh sách replies */}
                    {showReplies && (
                        <div style={{ marginTop: '16px', paddingLeft: '0' }}>
                            {loadingReplies ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px' }}>
                                    <div
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid #e4e6ea',
                                            borderTop: '2px solid #1877f2',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                        }}
                                    />
                                    <span style={{ color: '#65676b', fontSize: '14px' }}>Đang tải phản hồi...</span>
                                </div>
                            ) : (
                                replies.map((reply) => (
                                    <ReplyItem
                                        key={reply.id}
                                        reply={reply}
                                        postId={postId}
                                        currentUserId={currentUserId}
                                        onReactionUpdate={handleReactionUpdate}
                                        onRepliesUpdate={handleRepliesUpdate}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog xác nhận xóa */}
            {showDeleteConfirm && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                        }}
                        onClick={cancelDelete}
                    >
                        <div
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '8px',
                                padding: '24px',
                                maxWidth: '400px',
                                width: '90%',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3
                                style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#1c1e21',
                                }}
                            >
                                Xác nhận xóa bình luận
                            </h3>
                            <p
                                style={{
                                    margin: '0 0 24px 0',
                                    fontSize: '14px',
                                    color: '#65676b',
                                    lineHeight: '1.4',
                                }}
                            >
                                Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    style={{
                                        padding: '10px 20px',
                                        border: '1px solid #e4e6ea',
                                        borderRadius: '6px',
                                        backgroundColor: '#f8f9fa',
                                        color: '#65676b',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                        opacity: isDeleting ? 0.6 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#e4e6ea')}
                                    onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = '#f8f9fa')}
                                >
                                    HỦY
                                </button>
                                <button
                                    onClick={handleDeleteComment}
                                    disabled={isDeleting}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        backgroundColor: isDeleting ? '#e4e6ea' : '#d73502',
                                        color: isDeleting ? '#bcc0c4' : '#fff',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#b32d00')}
                                    onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = '#d73502')}
                                >
                                    {isDeleting ? (
                                        <>
                                            <div
                                                style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    border: '2px solid #bcc0c4',
                                                    borderTop: '2px solid #d73502',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                }}
                                            />
                                            Đang xóa...
                                        </>
                                    ) : (
                                        'XÓA'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* CSS animations */}
            <style jsx>{`
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default CommentItem;
