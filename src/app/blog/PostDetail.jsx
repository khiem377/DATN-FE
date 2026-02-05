'use client';

import { ArrowLeftOutlined, CalendarOutlined, EyeOutlined, HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Space, Spin, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import Cmt from '../blog/comment/cmt';

const { Title, Text, Paragraph } = Typography;

const PostDetail = ({ slug, onBack }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [postId, setPostId] = useState('');

    useEffect(() => {
        if (slug) {
            fetchPostDetail(slug);
            fetchLikedPosts();
        }
    }, [slug]);

    const fetchPostDetail = async (postSlug) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/posts/${postSlug}`);
            const result = await response.json();

            if (result.success) {
                setPost(result.data);
                const topicIds = result?.data?.topics?.map((topic) => topic.id);
                setPostId(result?.data?.id);
                fetchRelatedPosts(topicIds);
            } else {
                message.error('Không thể tải chi tiết bài viết');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            message.error('Lỗi kết nối API');
        } finally {
            setLoading(false);
        }
    };

    const fetchLikedPosts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:8000/api/posts/liked', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success && result.data) {
                const likedIds = result?.data?.map((item) => item.id);
                setPost((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        has_liked: likedIds.includes(prev.id),
                    };
                });
            }
        } catch (err) {
            console.error('Lỗi khi lấy danh sách bài đã like:', err);
        }
    };

    const fetchRelatedPosts = async (topicIds, currentPostId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/posts/related/${topicIds}`);
            const result = await res.json();
            if (result.success) {
                const filtered = result.data.filter((item) => item.id !== currentPostId); // chính xác 100%
                setRelatedPosts(filtered);
            }
        } catch (err) {
            console.error('Lỗi khi tải bài liên quan:', err);
        }
    };

    const handleLike = async () => {
        if (!post) return;

        const token = localStorage.getItem('token');
        if (!token) {
            message.warning('🔒 Vui lòng đăng nhập để like bài viết!');
            return;
        }

        const isLiked = post.has_liked;
        const url = `http://localhost:8000/api/posts/${post.id}/${isLiked ? 'unlike' : 'like'}`;
        const method = isLiked ? 'DELETE' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (response.ok) {
                setPost((prev) => ({
                    ...prev,
                    has_liked: !prev.has_liked,
                    like_count: prev.has_liked ? prev.like_count - 1 : prev.like_count + 1,
                }));
                message.success(result.message || (isLiked ? 'Đã bỏ thích' : 'Đã thích bài viết'));
            } else {
                message.error(result.message || 'Thao tác thất bại');
            }
        } catch (error) {
            console.error('Lỗi khi like/unlike:', error);
            message.error('Lỗi kết nối khi thao tác');
        }
    };

    const handleShare = () => {
        if (!post) return;

        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.excerpt || post.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            message.success('Đã copy link bài viết');
        }
    };

    const getTopicColor = (name) => {
        const colors = {
            'Công nghệ': 'blue',
            'Thông báo': 'orange',
            'Hướng dẫn': 'green',
            'Sự kiện': 'purple',
        };
        return colors[name] || 'default';
    };

    if (loading) {
        return (
            <div className="post-detail-loading">
                <Spin size="large" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-detail-error">
                <Title level={3}>Không tìm thấy bài viết</Title>
                <Button type="primary" onClick={onBack} icon={<ArrowLeftOutlined />}>
                    Quay lại
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="post-detail-container">
                <Card className="post-detail-card">
                    <div className="post-detail-meta">
                        <Space>
                            <Avatar size={50} src="https://api.dicebear.com/7.x/miniavs/svg?seed=admin" />
                            <div className="post-author-info">
                                <Text strong>Admin</Text>
                                <div className="post-meta-info">
                                    <Space size={16}>
                                        <Space size={4}>
                                            <CalendarOutlined />
                                            <Text type="secondary">{post.created_at}</Text>
                                        </Space>
                                        <Space size={4}>
                                            <EyeOutlined />
                                            <Text type="secondary">{post.views} lượt xem</Text>
                                        </Space>
                                    </Space>
                                </div>
                            </div>
                        </Space>
                    </div>

                    <div className="post-detail-content">
                        <div className="post-topics">
                            {post?.topics?.map((topic) => (
                                <Tag key={topic.id} color={getTopicColor(topic?.name)}>
                                    {topic?.name}
                                </Tag>
                            ))}
                        </div>

                        {post.excerpt && (
                            <div className="post-excerpt">
                                <Paragraph className="excerpt-text">{post.excerpt}</Paragraph>
                            </div>
                        )}

                        <div className="post-content-body">
                            <div
                                className="content-html"
                                dangerouslySetInnerHTML={{
                                    __html: post.content || 'Nội dung đang được cập nhật...',
                                }}
                            />
                        </div>
                    </div>

                    <div className="post-detail-actions">
                        <Space size={16}>
                            <Button
                                type={post.has_liked ? 'primary' : 'default'}
                                icon={<HeartOutlined />}
                                onClick={handleLike}
                                className={post.has_liked ? 'liked' : ''}
                            >
                                {post.like_count} Thích
                            </Button>
                            <Button type="default" icon={<ShareAltOutlined />} onClick={handleShare}>
                                Chia sẻ
                            </Button>
                        </Space>
                    </div>
                </Card>
                <Cmt postId={postId} />

                {/* Bài viết liên quan */}
                {relatedPosts.length > 0 && (
                    <div className="related-posts" style={{ marginTop: 32 }}>
                        <Title level={4}>Bài viết liên quan</Title>
                        <div
                            className="related-list"
                            style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}
                        >
                            {relatedPosts
                                .filter((item) => item.id !== post?.id) // 👈 loại trùng id bài hiện tại
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="related-post-item"
                                        style={{
                                            display: 'flex',
                                            gap: 16,
                                            marginBottom: 24,
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #eee',
                                            paddingBottom: 16,
                                        }}
                                        onClick={() => (window.location.href = `/blog/${item.slug}`)}
                                    >
                                        <div style={{ width: 200, height: 140, flexShrink: 0 }}>
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <Text strong style={{ fontSize: 16 }}>
                                                {item.title}
                                            </Text>
                                            <div
                                                style={{
                                                    margin: '4px 0 8px',
                                                    color: '#888',
                                                    fontSize: 13,
                                                }}
                                            >
                                                Đăng bởi Admin · {item.created_at}
                                            </div>
                                            <Paragraph
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                    lineHeight: '1.6em',
                                                    display: '-webkit-box',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}
                                            >
                                                {item.excerpt}
                                            </Paragraph>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default PostDetail;
