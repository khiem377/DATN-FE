'use client';
import {
    ClockCircleOutlined,
    CopyOutlined,
    DeleteOutlined,
    LoadingOutlined,
    LockOutlined,
    LogoutOutlined,
    MinusOutlined,
    PlusOutlined,
    ShareAltOutlined,
    ShoppingCartOutlined,
    UserAddOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Image,
    Input,
    InputNumber,
    message,
    Row,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import '../cart/Cart.css';

const { Title, Text } = Typography;

const POLL_INTERVAL_MS = 5000;

/* =========================
 * Custom Confirm Dialog
 * ========================= */
const ConfirmDialog = ({
    open,
    title = 'Xác nhận',
    content = '',
    onOk,
    onCancel,
    okText = 'Đồng ý',
    cancelText = 'Hủy',
    okDanger = false,
    loading = false,
}) => {
    if (!open) return null;
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 16,
            }}
            role="dialog"
            aria-modal="true"
        >
            <div
                style={{
                    width: 'min(520px, 100%)',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                    <Text strong style={{ fontSize: 16 }}>
                        {title}
                    </Text>
                </div>
                <div style={{ padding: 20, lineHeight: 1.6, color: '#444' }}>{content}</div>
                <div
                    style={{
                        padding: 16,
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                    }}
                >
                    <Button onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button type={okDanger ? 'primary' : 'default'} danger={okDanger} onClick={onOk} loading={loading}>
                        {okText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

/* ===== Helpers ===== */
const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price ?? 0);

/** lấy userId từ localStorage với nhiều key khác nhau */
const getLocalUserId = () =>
    localStorage.getItem('user_id') ||
    localStorage.getItem('uid') ||
    localStorage.getItem('auth_user_id') ||
    localStorage.getItem('id') ||
    localStorage.getItem('userId');

/** chuẩn hóa role owner: chấp nhận 'owner' | true | 1 | 'Owner' */
const isOwnerRole = (m) => {
    const r = (m?.role ?? '').toString().toLowerCase();
    return r === 'owner' || m?.is_owner === true || String(m?.role) === '1';
};

/** Chuẩn hóa lấy số lượng từ item (hỗ trợ cả qty/quantity/pivot.quantity) */
const getQty = (item) => {
    const raw = item?.qty ?? item?.quantity ?? (item?.pivot ? item.pivot.quantity : undefined);
    const q = Number(raw);
    return Number.isFinite(q) && q > 0 ? q : 1;
};

const API_BASE = 'http://localhost:8000/api';

const CartGroup = () => {
    const router = useRouter();
    const [groupData, setGroupData] = useState(null);
    const [joinUrl, setJoinUrl] = useState('');
    const [timeRemaining, setTimeRemaining] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [actionLoading, setActionLoading] = useState({
        lock: false,
        leave: false,
        kick: {}, // { [userId]: boolean }
        quantityUpdate: {}, // { [itemId]: boolean }
        deleteItem: {}, // { [itemId]: boolean }
    });

    // custom confirms state
    const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, itemId: null, itemTitle: '' });
    const [kickConfirm, setKickConfirm] = useState({ open: false, userId: null, userName: '' });

    // headers + tokens
    const getAuthHeaders = () => {
        const authToken =
            localStorage.getItem('auth_token') || localStorage.getItem('access_token') || localStorage.getItem('token');

        const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
        if (authToken) headers.Authorization = `Bearer ${authToken}`;
        return headers;
    };

    const getGroupToken = () => localStorage.getItem('group_cart_token');

    // current user id
    const loadCurrentUserId = async () => {
        const localId = getLocalUserId();
        if (localId) {
            setCurrentUserId(String(localId));
            return;
        }

        try {
            const res = await fetch('http://localhost:8000/api/me', {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (res.ok) {
                const me = await res.json();
                if (me?.id || me?.user?.id) {
                    setCurrentUserId(String(me.id ?? me.user.id));
                }
            }
        } catch {
            // ignore
        }
    };

    // fetch group
    const fetchGroupData = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            const groupToken = getGroupToken();
            if (!groupToken) throw new Error('Không tìm thấy token giỏ hàng nhóm. Vui lòng tạo giỏ hàng nhóm mới.');

            const response = await fetch(`${API_BASE}/group-orders/${groupToken}`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                let errorMessage = 'Không thể tải thông tin giỏ hàng nhóm';
                if (response.status === 404) errorMessage = 'Giỏ hàng nhóm không tồn tại hoặc đã hết hạn';
                else if (response.status === 401) errorMessage = 'Bạn không có quyền truy cập giỏ hàng nhóm này';
                else {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                    }
                }
                throw new Error(`${errorMessage} (${response.status})`);
            }

            const data = await response.json();

            // build membersWithItems + totals (dùng getQty để chuẩn)
            let totalItems = 0;
            const membersWithItems = [];

            if (data.by_member) {
                Object.keys(data.by_member).forEach((memberId) => {
                    const memberData = data.by_member[memberId];
                    const memberInfo = data.members?.find((m) => String(m.id) === String(memberId));

                    const items = Array.isArray(memberData?.items) ? memberData.items : [];
                    const itemCount = items.reduce((sum, it) => sum + getQty(it), 0);
                    totalItems += itemCount;

                    if (memberInfo) {
                        membersWithItems.push({
                            ...memberInfo,
                            subtotal: memberData.subtotal ?? 0,
                            items,
                            itemCount,
                        });
                    }
                });
            }

            // lấy owner chắc cú
            const ownerMember = (data.members || []).find((m) => isOwnerRole(m));

            const transformedData = {
                id: getGroupToken(),
                join_token: getGroupToken(),
                owner_user_id: ownerMember?.user_id ?? ownerMember?.id ?? null,
                allow_guest: true,
                expires_at: data.expires_at,
                created_at: data.created_at ?? new Date().toISOString(),
                status: data.status,
                members: data.members || [],
                membersWithItems,
                by_member: data.by_member || {},
                total_items: totalItems,
                total_amount: data.total || 0,
            };

            setGroupData(transformedData);
            setJoinUrl(data.join_url || '');
        } catch (err) {
            if (!silent) setError(err.message);
            if (!silent) {
                if (err.message.includes('token')) {
                    toast.error(err.message);
                    setTimeout(() => router.push('/cart'), 3000);
                } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
                    toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    toast.error(err.message || 'Có lỗi xảy ra khi tải giỏ hàng nhóm');
                }
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleRefresh = () => fetchGroupData({ silent: false });

    // time remaining
    const updateTimeRemaining = () => {
        if (!groupData?.expires_at) return;
        const now = new Date();
        const expiry = new Date(groupData.expires_at);
        const diff = expiry.getTime() - now.getTime();
        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining(`${hours}h ${minutes}m`);
        } else setTimeRemaining('Đã hết hạn');
    };

    // === quantity + delete ===
    /** Cập nhật SỐ LƯỢNG MỚI (không phải delta) */
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            setActionLoading((s) => ({ ...s, quantityUpdate: { ...s.quantityUpdate, [itemId]: true } }));
            const token = groupData?.join_token || getGroupToken();

            const res = await fetch(`${API_BASE}/group-orders/${token}/items/${itemId}/quantity`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ quantity: newQuantity }),
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || 'Không thể cập nhật số lượng');
            }
            const result = await res.json();
            if (result?.success === false) throw new Error(result.message || 'Cập nhật thất bại');

            message.success('Đã cập nhật số lượng thành công');
            await fetchGroupData({ silent: true });
        } catch (e) {
            toast.error(e.message || 'Có lỗi xảy ra khi cập nhật số lượng');
        } finally {
            setActionLoading((s) => ({ ...s, quantityUpdate: { ...s.quantityUpdate, [itemId]: false } }));
        }
    };

    const openDeleteConfirm = (itemId, itemTitle) => setDeleteConfirm({ open: true, itemId, itemTitle });

    const handleDeleteConfirmed = async () => {
        const { itemId, itemTitle } = deleteConfirm;
        if (!itemId) return;
        try {
            setActionLoading((s) => ({ ...s, deleteItem: { ...s.deleteItem, [itemId]: true } }));
            const token = groupData?.join_token || getGroupToken();

            const res = await fetch(`${API_BASE}/group-orders/${token}/items/${itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || 'Không thể xóa sản phẩm');
            }

            message.success(`Đã xóa sản phẩm "${itemTitle}" thành công`);
            await fetchGroupData({ silent: true });
        } catch (e) {
            toast.error(e.message || 'Có lỗi xảy ra khi xóa sản phẩm');
        } finally {
            setActionLoading((s) => ({ ...s, deleteItem: { ...s.deleteItem, [deleteConfirm.itemId]: false } }));
            setDeleteConfirm({ open: false, itemId: null, itemTitle: '' });
        }
    };

    // lock / leave / kick
    const handleLockGroup = async () => {
        try {
            setActionLoading((s) => ({ ...s, lock: true }));
            const token = groupData?.join_token || getGroupToken();

            const res = await fetch(`${API_BASE}/group-orders/${token}/lock`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || 'Không thể lock nhóm');
            }

            toast.success('Đã khóa nhóm (lock) thành công');
            await fetchGroupData({ silent: false });
        } catch (e) {
            toast.error(e.message);
        } finally {
            setActionLoading((s) => ({ ...s, lock: false }));
            setLockConfirmOpen(false);
        }
    };

    const isOwner = useMemo(
        () => currentUserId && String(groupData?.owner_user_id) === String(currentUserId),
        [currentUserId, groupData?.owner_user_id],
    );
    const otherMembersExist = useMemo(
        () => groupData?.members?.some((m) => String(m.user_id ?? m.id) !== String(currentUserId)),
        [groupData?.members, currentUserId],
    );

    const handleLeaveGroup = async () => {
        // client guard cho UX
        if (isOwner && otherMembersExist) {
            toast.error(
                'Chủ phòng không thể rời khi vẫn còn thành viên khác. Hãy chuyển quyền chủ hoặc giải tán phòng.',
            );
            return;
        }

        try {
            setActionLoading((s) => ({ ...s, leave: true }));
            const token = groupData?.join_token || getGroupToken();

            // ✅ dùng route mới: DELETE /{token}/leave
            const res = await fetch(`${API_BASE}/group-orders/${token}/leave`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!res.ok) {
                // parse BE messages (409, 401, 403, 422…)
                let msg = 'Không thể thoát nhóm';
                const raw = await res.text().catch(() => '');
                try {
                    const j = JSON.parse(raw);
                    msg = j.message || msg;
                } catch {
                    if (res.status === 409) msg = 'Phòng không ở trạng thái open, không thể rời.';
                    if (res.status === 401) msg = 'Vui lòng đăng nhập để rời phòng.';
                    if (res.status === 403) msg = 'Bạn chưa tham gia phòng này.';
                }
                throw new Error(msg);
            }

            const data = await res.json().catch(() => ({}));
            toast.success(data?.message || 'Bạn đã rời nhóm');
            router.push('/cart');
        } catch (e) {
            toast.error(e.message || 'Thoát nhóm thất bại');
        } finally {
            setActionLoading((s) => ({ ...s, leave: false }));
        }
    };

    const openKickConfirm = (userId, userName = '') => setKickConfirm({ open: true, userId, userName });

    const handleKickConfirmed = async () => {
        const { userId } = kickConfirm;
        if (!userId) return;

        // === Client-side custom guard & message ===
        const targetMember = (groupData?.members || []).find((m) => String(m.user_id ?? m.id) === String(userId));
        const targetIsOwner = targetMember && isOwnerRole(targetMember);
        const isSelfTarget = String(userId) === String(currentUserId);

        if (targetIsOwner) {
            toast.error('Không thể kick Chủ nhóm. Vui lòng chuyển quyền hoặc giải tán nhóm.');
            setKickConfirm({ open: false, userId: null, userName: '' });
            return;
        }
        if (isSelfTarget) {
            toast.error('Không thể kick chính mình. Hãy dùng nút "Rời nhóm".');
            setKickConfirm({ open: false, userId: null, userName: '' });
            return;
        }
        if (!isOwner) {
            toast.error('Chỉ Chủ nhóm mới có quyền kick thành viên.');
            setKickConfirm({ open: false, userId: null, userName: '' });
            return;
        }

        try {
            setActionLoading((s) => ({ ...s, kick: { ...s.kick, [userId]: true } }));
            const token = groupData?.join_token || getGroupToken();

            // ✅ route mới ưu tiên
            let res = await fetch(`${API_BASE}/group-orders/${token}/kick/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            // fallback sang alias cũ nếu route mới không tồn tại
            if (res.status === 404) {
                try {
                    res = await fetch(`${API_BASE}/group-orders/${token}/users/${userId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                    });
                } catch {
                    /* ignore */
                }
            }

            if (!res.ok) {
                let msg = 'Kick thất bại';
                const txt = await res.text().catch(() => '');
                try {
                    const j = JSON.parse(txt);
                    if (j.code === 'self_kick_forbidden') msg = 'Không thể kick chính mình. Hãy dùng "Rời nhóm".';
                    else if (j.code === 'owner_kick_forbidden' || j.message?.toLowerCase().includes('chủ')) {
                        msg = 'Không thể kick Chủ nhóm.';
                    } else if (j.code === 'not_owner') {
                        msg = 'Chỉ chủ phòng mới có quyền kick thành viên.';
                    } else if (j.code === 'group_not_open') {
                        msg = 'Phòng không ở trạng thái open.';
                    } else if (j.code === 'target_not_in_group') {
                        msg = 'Người dùng này không thuộc phòng.';
                    } else if (res.status === 401) {
                        msg = 'Vui lòng đăng nhập để thực hiện.';
                    } else if (res.status === 403) {
                        msg = 'Bạn không có quyền kick thành viên.';
                    } else {
                        msg = j.message || msg;
                    }
                } catch {
                    if (res.status === 401) msg = 'Vui lòng đăng nhập để thực hiện.';
                    else if (res.status === 403) msg = 'Bạn không có quyền kick thành viên.';
                    else if (res.status === 409) msg = 'Phòng không ở trạng thái open.';
                }
                throw new Error(msg);
            }

            toast.success(`Đã kick thành viên ${userId}`);
            await fetchGroupData({ silent: true });
        } catch (e) {
            toast.error(e.message || 'Kick thất bại');
        } finally {
            setActionLoading((s) => ({ ...s, kick: { ...s.kick, [kickConfirm.userId]: false } }));
            setKickConfirm({ open: false, userId: null, userName: '' });
        }
    };

    const handleCopyJoinUrl = () => {
        if (joinUrl) {
            navigator.clipboard
                .writeText(joinUrl)
                .then(() => message.success('Đã copy đường link!'))
                .catch(() => message.error('Không thể copy đường link'));
        }
    };

    const handleShareGroup = () => {
        if (navigator.share && joinUrl) {
            navigator
                .share({
                    title: 'Tham gia giỏ hàng nhóm',
                    text: 'Tham gia cùng tôi mua hàng với giá tốt hơn!',
                    url: joinUrl,
                })
                .catch(() => handleCopyJoinUrl());
        } else handleCopyJoinUrl();
    };

    const handleBackToCart = () => router.push('/cart');
    const handleAddProducts = () => router.push('/search?type=paper&sort=popular&page=1&limit=12');

    // mount
    useEffect(() => {
        loadCurrentUserId();
        fetchGroupData({ silent: false });
    }, []);

    // polling
    useEffect(() => {
        let cancelled = false;
        let timer = null;
        const tick = async () => {
            if (cancelled) return;
            await fetchGroupData({ silent: true });
            if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
        };
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, []);

    // time remaining every minute
    useEffect(() => {
        if (groupData?.expires_at) {
            updateTimeRemaining();
            const interval = setInterval(updateTimeRemaining, 60000);
            return () => clearInterval(interval);
        }
    }, [groupData?.expires_at]);

    const isExpired = useMemo(() => {
        if (!groupData?.expires_at) return false;
        return new Date(groupData.expires_at).getTime() <= Date.now();
    }, [groupData?.expires_at]);

    const effectiveOpen = groupData?.status === 'open' && !isExpired;

    // UI states
    if (loading) {
        return (
            <div className="cart-loading" style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <div style={{ marginTop: 16 }}>
                    <Text>Đang tải thông tin giỏ hàng nhóm...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cart-container">
                <div className="cart-header">
                    <Title level={2}>
                        <UserAddOutlined /> Giỏ hàng nhóm
                    </Title>
                </div>
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Alert
                        message="Lỗi tải dữ liệu"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 20 }}
                        action={
                            <Space>
                                <Button size="small" onClick={handleRefresh}>
                                    Thử lại
                                </Button>
                                <Button size="small" onClick={handleBackToCart}>
                                    Quay lại giỏ hàng
                                </Button>
                            </Space>
                        }
                    />
                </div>
            </div>
        );
    }

    if (!groupData) {
        return (
            <div className="cart-container">
                <div className="cart-header">
                    <Title level={2}>
                        <UserAddOutlined /> Giỏ hàng nhóm
                    </Title>
                </div>
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Empty description="Không tìm thấy thông tin giỏ hàng nhóm" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <Space>
                            <Button onClick={handleRefresh}>Thử lại</Button>
                            <Button type="primary" onClick={handleBackToCart}>
                                Quay lại giỏ hàng
                            </Button>
                        </Space>
                    </Empty>
                </div>
            </div>
        );
    }

    const handleCheckout = async () => {
        router.push('/checkout_grouporder');
    };

    return (
        <div className="cart-container">
            <div className="cart-header">
                <Title level={2}>
                    <UserAddOutlined /> Giỏ hàng nhóm #{groupData.join_token}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <Text type="secondary">Mời bạn bè cùng mua hàng để được giá tốt hơn!</Text>
                    <Button size="small" onClick={handleRefresh} loading={loading}>
                        Làm mới
                    </Button>

                    {/* Owner controls */}
                    {isOwner && (
                        <>
                            <Button
                                size="small"
                                icon={<LockOutlined />}
                                onClick={() => setLockConfirmOpen(true)}
                                loading={actionLoading.lock}
                                disabled={!effectiveOpen}
                            >
                                Khóa nhóm
                            </Button>

                            {otherMembersExist ? (
                                <Tag color="red" style={{ marginLeft: 4 }}>
                                    Không thể rời phòng do còn thành viên khác
                                </Tag>
                            ) : (
                                <Button
                                    size="small"
                                    danger
                                    icon={<LogoutOutlined />}
                                    onClick={handleLeaveGroup}
                                    loading={actionLoading.leave}
                                >
                                    Chủ nhóm thoát
                                </Button>
                            )}
                        </>
                    )}

                    {!isOwner && (
                        <Button
                            size="small"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={handleLeaveGroup}
                            loading={actionLoading.leave}
                        >
                            Rời nhóm
                        </Button>
                    )}
                </div>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={16}>
                    {/* Group Info */}
                    <Card
                        className="cart-items-card"
                        title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <UserAddOutlined />
                                <span>Thông tin nhóm</span>
                                <Tag color={effectiveOpen ? 'green' : 'red'}>
                                    {effectiveOpen ? 'Đang mở' : isExpired ? 'Hết hạn' : 'Đã đóng'}
                                </Tag>
                            </div>
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong>Thành viên:</Text>
                                    <Tag color="blue" style={{ marginLeft: 8 }}>
                                        <UserOutlined /> {groupData.members.length} người
                                    </Tag>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong>Thời gian còn lại:</Text>
                                    <Tag
                                        color={timeRemaining.includes('hết hạn') ? 'red' : 'green'}
                                        style={{ marginLeft: 8 }}
                                    >
                                        <ClockCircleOutlined /> {timeRemaining || '—'}
                                    </Tag>
                                </div>
                            </Col>

                            {/* BỎ vận chuyển theo yêu cầu */}
                            <Col xs={24} sm={12}>
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong>Cho phép khách:</Text>
                                    <Tag color={groupData.allow_guest ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                                        {groupData.allow_guest ? 'Có' : 'Không'}
                                    </Tag>
                                </div>
                            </Col>
                        </Row>

                        <Divider />

                        <div>
                            <Text strong>Chia sẻ nhóm:</Text>
                            <div style={{ marginTop: 8 }}>
                                <Input.Group compact>
                                    <Input
                                        value={joinUrl}
                                        readOnly
                                        style={{ width: 'calc(100% - 160px)', backgroundColor: '#f6ffed' }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<CopyOutlined />}
                                        onClick={handleCopyJoinUrl}
                                        style={{ width: 80 }}
                                    >
                                        Copy
                                    </Button>
                                    <Button
                                        icon={<ShareAltOutlined />}
                                        onClick={handleShareGroup}
                                        style={{ width: 80 }}
                                    >
                                        Chia sẻ
                                    </Button>
                                </Input.Group>
                            </div>
                        </div>
                    </Card>

                    {/* Members + Items */}
                    <Card
                        className="cart-items-card"
                        title="Danh sách thành viên và sản phẩm"
                        style={{ marginBottom: 16 }}
                    >
                        <div className="cart-items-list">
                            {groupData.membersWithItems.map((member) => {
                                const memberUserId = String(member.user_id ?? member.id);
                                const memberIsOwner = isOwnerRole(member);
                                const isSelf = memberUserId === String(currentUserId);

                                return (
                                    <div
                                        key={memberUserId}
                                        className="cart-item"
                                        style={{
                                            padding: 16,
                                            marginBottom: 16,
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 8,
                                        }}
                                    >
                                        {/* HEADER mỗi member: tên + tổng + action (Kick/Leave) */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: 12,
                                            }}
                                        >
                                            {/* Trái */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                                <div>
                                                    <Text strong>{member.name}</Text>
                                                    <Tag
                                                        color={memberIsOwner ? 'gold' : 'blue'}
                                                        style={{ marginLeft: 8 }}
                                                    >
                                                        {memberIsOwner ? 'Chủ nhóm' : 'Thành viên'}
                                                    </Tag>
                                                    {/* KHÔNG hiển thị ID user */}
                                                </div>
                                            </div>

                                            {/* Phải: tổng + actions gọn */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ textAlign: 'right', marginRight: 8 }}>
                                                    <Text strong>{member.itemCount} sản phẩm</Text>
                                                    <br />
                                                    <Text style={{ color: '#52c41a' }}>
                                                        {formatPrice(member.subtotal)}
                                                    </Text>
                                                </div>

                                                {/* Rời nhóm nếu là mình và không phải chủ */}
                                                {isSelf && !memberIsOwner && (
                                                    <Button
                                                        size="small"
                                                        danger
                                                        icon={<LogoutOutlined />}
                                                        onClick={handleLeaveGroup}
                                                        loading={actionLoading.leave}
                                                    >
                                                        Rời
                                                    </Button>
                                                )}

                                                {/* LUÔN hiện nút Kick – chặn bằng thông báo custom trong handleKickConfirmed */}
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => openKickConfirm(memberUserId, member.name)}
                                                    loading={!!actionLoading.kick[memberUserId]}
                                                >
                                                    Kick
                                                </Button>
                                            </div>
                                        </div>

                                        {/* ITEMS */}
                                        {member.items && member.items.length > 0 && (
                                            <div style={{ paddingLeft: 36, marginTop: 12 }}>
                                                <Text
                                                    strong
                                                    style={{ fontSize: 14, marginBottom: 8, display: 'block' }}
                                                >
                                                    Sản phẩm:
                                                </Text>
                                                {member.items.map((item) => {
                                                    const qty = getQty(item);
                                                    const unitPrice = parseFloat(item.price) || 0;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'flex-start',
                                                                padding: 12,
                                                                backgroundColor: '#fafafa',
                                                                borderRadius: 8,
                                                                marginBottom: 12,
                                                                gap: 16,
                                                                border: '1px solid #f0f0f0',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: 16,
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                {/* Cover */}
                                                                {item.cover_image ? (
                                                                    <div style={{ flexShrink: 0 }}>
                                                                        <Image
                                                                            src={item.cover_image}
                                                                            alt={item.title || 'Book cover'}
                                                                            style={{
                                                                                width: 60,
                                                                                height: 80,
                                                                                objectFit: 'cover',
                                                                                borderRadius: 6,
                                                                                border: '2px solid #e8e8e8',
                                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                                            }}
                                                                            preview={{ mask: 'Xem ảnh' }}
                                                                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        style={{
                                                                            width: 60,
                                                                            height: 80,
                                                                            backgroundColor: '#f5f5f5',
                                                                            border: '2px dashed #d9d9d9',
                                                                            borderRadius: 6,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                        }}
                                                                    >
                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                            No Image
                                                                        </Text>
                                                                    </div>
                                                                )}

                                                                {/* Info */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ marginBottom: 4 }}>
                                                                        <Text
                                                                            strong
                                                                            style={{
                                                                                fontSize: 14,
                                                                                display: 'block',
                                                                                wordBreak: 'break-word',
                                                                                lineHeight: 1.4,
                                                                            }}
                                                                        >
                                                                            {item.title || 'Untitled Book'}
                                                                        </Text>
                                                                    </div>

                                                                    <div style={{ marginBottom: 8 }}>
                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                            Đơn giá:{' '}
                                                                            <Text style={{ color: '#1890ff' }}>
                                                                                {formatPrice(unitPrice)}
                                                                            </Text>
                                                                        </Text>
                                                                    </div>

                                                                    {/* Controls */}
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 8,
                                                                            marginBottom: 8,
                                                                        }}
                                                                    >
                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                            Số lượng:
                                                                        </Text>
                                                                        <Button
                                                                            size="small"
                                                                            icon={<MinusOutlined />}
                                                                            onClick={() =>
                                                                                handleUpdateQuantity(
                                                                                    item.id,
                                                                                    Math.max(1, qty - 1),
                                                                                )
                                                                            }
                                                                            loading={
                                                                                actionLoading.quantityUpdate[item.id]
                                                                            }
                                                                            disabled={qty <= 1 || !effectiveOpen}
                                                                        />
                                                                        <InputNumber
                                                                            size="small"
                                                                            min={1}
                                                                            max={999}
                                                                            value={qty}
                                                                            style={{ width: 60 }}
                                                                            readOnly
                                                                        />
                                                                        <Button
                                                                            size="small"
                                                                            icon={<PlusOutlined />}
                                                                            onClick={() =>
                                                                                handleUpdateQuantity(item.id, qty + 1)
                                                                            }
                                                                            loading={
                                                                                actionLoading.quantityUpdate[item.id]
                                                                            }
                                                                            disabled={!effectiveOpen}
                                                                        />
                                                                        <Button
                                                                            size="small"
                                                                            danger
                                                                            icon={<DeleteOutlined />}
                                                                            onClick={() =>
                                                                                openDeleteConfirm(item.id, item.title)
                                                                            }
                                                                            loading={actionLoading.deleteItem[item.id]}
                                                                            title="Xóa sản phẩm"
                                                                            disabled={!effectiveOpen}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Total */}
                                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                <Text
                                                                    strong
                                                                    style={{
                                                                        color: '#52c41a',
                                                                        fontSize: 15,
                                                                        display: 'block',
                                                                    }}
                                                                >
                                                                    {formatPrice(unitPrice * qty)}
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                                    Thành tiền
                                                                </Text>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    {/* Summary */}
                    <Card className="cart-summary-card" title="Tổng kết nhóm">
                        <div className="cart-summary">
                            {effectiveOpen ? (
                                <Alert
                                    message="Thông báo"
                                    description={
                                        groupData.total_amount > 0
                                            ? `Tổng giá trị đơn hàng nhóm: ${formatPrice(groupData.total_amount)}`
                                            : 'Giỏ hàng nhóm hiện chưa có sản phẩm nào. Thêm sản phẩm hoặc mời thêm bạn bè để bắt đầu mua hàng cùng nhau!'
                                    }
                                    type={groupData.total_amount > 0 ? 'success' : 'info'}
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            ) : isExpired ? (
                                <Alert
                                    message="Giỏ hàng nhóm đã hết hạn"
                                    description="Giỏ hàng này đã hết hạn. Không thể thêm/sửa sản phẩm và không thể thanh toán."
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            ) : (
                                <Alert
                                    message="Giỏ hàng nhóm đã đóng"
                                    description="Giỏ hàng nhóm này đã đóng. Không thể thêm sản phẩm mới."
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}

                            <div className="cart-summary-section">
                                <Title level={4}>Thông tin thanh toán</Title>

                                <div className="cart-summary-row">
                                    <Text>Tổng thành viên:</Text>
                                    <Text>{groupData.members.length} người</Text>
                                </div>

                                <div className="cart-summary-row">
                                    <Text>Tổng sản phẩm:</Text>
                                    <Text>{groupData.total_items} sản phẩm</Text>
                                </div>

                                <div className="cart-summary-row">
                                    <Text>Trạng thái:</Text>
                                    <Tag color={effectiveOpen ? 'green' : 'red'}>
                                        {effectiveOpen ? 'Đang mở' : isExpired ? 'Hết hạn' : 'Đã đóng'}
                                    </Tag>
                                </div>

                                <Divider />

                                <div className="cart-summary-row cart-total">
                                    <Text strong>Tổng số tiền:</Text>
                                    <Text strong className="cart-total-price">
                                        {formatPrice(groupData.total_amount)}
                                    </Text>
                                </div>

                                {/* Thanh toán: nếu hết hạn/đóng -> disable + đổi label */}
                                {effectiveOpen ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        className="cart-checkout-btn"
                                        disabled={groupData.total_amount === 0}
                                        style={{ marginTop: 16 }}
                                        onClick={() => handleCheckout()} // ✅ thêm onClick
                                    >
                                        Thanh toán ({groupData.total_items} sản phẩm)
                                    </Button>
                                ) : (
                                    <Button size="large" block disabled style={{ marginTop: 16 }}>
                                        Giỏ hàng đã hết hạn
                                    </Button>
                                )}

                                {effectiveOpen && (
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Button
                                                block
                                                onClick={handleAddProducts}
                                                icon={<ShoppingCartOutlined />}
                                                disabled={!effectiveOpen}
                                            >
                                                Thêm sản phẩm
                                            </Button>
                                            <Button
                                                block
                                                onClick={handleShareGroup}
                                                icon={<UserAddOutlined />}
                                                disabled={!effectiveOpen}
                                            >
                                                Mời thêm bạn bè
                                            </Button>

                                            {/* Member (không phải owner) có thể rời từ đây */}
                                            {String(groupData.owner_user_id) !== String(currentUserId) ? (
                                                <Button
                                                    block
                                                    danger
                                                    icon={<LogoutOutlined />}
                                                    onClick={handleLeaveGroup}
                                                    loading={actionLoading.leave}
                                                >
                                                    Rời nhóm
                                                </Button>
                                            ) : (
                                                otherMembersExist && (
                                                    <Tag color="red" style={{ display: 'block', textAlign: 'center' }}>
                                                        Không thể rời phòng do còn thành viên khác
                                                    </Tag>
                                                )
                                            )}
                                        </Space>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Stats */}
                    <Card title="Thống kê nhóm" style={{ marginTop: 16 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Thời gian tạo:</Text>
                                <Text>{new Date(groupData.created_at).toLocaleString('vi-VN')}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Hết hạn:</Text>
                                <Text>{new Date(groupData.expires_at).toLocaleString('vi-VN')}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Mã tham gia:</Text>
                                <Text code>{groupData.join_token}</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* ===== Custom Confirms ===== */}
            <ConfirmDialog
                open={lockConfirmOpen}
                title="Khóa nhóm & dọn item?"
                content="Thao tác này sẽ gọi API lock phòng và xóa item theo luật của phòng. Bạn chắc chưa?"
                onOk={handleLockGroup}
                onCancel={() => setLockConfirmOpen(false)}
                okText="Khóa ngay"
                cancelText="Hủy"
                okDanger
                loading={actionLoading.lock}
            />

            <ConfirmDialog
                open={deleteConfirm.open}
                title="Xóa sản phẩm?"
                content={
                    <>
                        Bạn có chắc muốn xóa <b>{deleteConfirm.itemTitle}</b> khỏi giỏ hàng nhóm?
                    </>
                }
                onOk={handleDeleteConfirmed}
                onCancel={() => setDeleteConfirm({ open: false, itemId: null, itemTitle: '' })}
                okText="Xóa"
                cancelText="Hủy"
                okDanger
                loading={!!deleteConfirm.itemId && !!actionLoading.deleteItem?.[deleteConfirm.itemId]}
            />

            <ConfirmDialog
                open={kickConfirm.open}
                title="Kick thành viên"
                content={
                    <>
                        Bạn sẽ xóa thành viên <b>{kickConfirm.userName || kickConfirm.userId}</b> khỏi nhóm.
                    </>
                }
                onOk={handleKickConfirmed}
                onCancel={() => setKickConfirm({ open: false, userId: null, userName: '' })}
                okText="Kick"
                cancelText="Hủy"
                okDanger
                loading={!!kickConfirm.userId && !!actionLoading.kick?.[kickConfirm.userId]}
            />
        </div>
    );
};

export default CartGroup;
