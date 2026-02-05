'use client';

import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CopyOutlined,
    LoadingOutlined,
    UserOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Input,
    message,
    Radio,
    Row,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const { Title, Text } = Typography;
const API_BASE = 'http://localhost:8000/api';

const formatVND = (n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n ?? 0);

const authHeaders = () => {
    const token =
        localStorage.getItem('auth_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
    const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
};

export default function CheckoutSplitPage() {
    const router = useRouter();
    const sp = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [recalcLoading, setRecalcLoading] = useState(false);
    const [group, setGroup] = useState(null);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [gateway, setGateway] = useState('momo'); // 'momo' | 'vnpay'
    const [splitResult, setSplitResult] = useState(null);
    const [shippingFee, setShippingFee] = useState(0);

    // NEW: status + checkout info
    const [statusChecking, setStatusChecking] = useState(false);
    const [statusData, setStatusData] = useState(null); // { group_status, all_paid, unpaid, order_id }
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [checkoutInfo, setCheckoutInfo] = useState(null); // lấy từ localStorage: group_checkout_info

    // init
    useEffect(() => {
        const qToken = sp.get('token') || localStorage.getItem('group_cart_token') || '';
        const qGW = (sp.get('gateway') || 'momo').toLowerCase();
        const gw = qGW === 'vnpay' ? 'vnpay' : 'momo';
        const qShip = Number(sp.get('ship') || localStorage.getItem('group_shipping_fee') || 0);

        if (!qToken) {
            setError('Thiếu token nhóm. Hãy quay lại giỏ hàng nhóm.');
            setLoading(false);
            return;
        }

        setToken(qToken);
        setGateway(gw);
        setShippingFee(Number.isFinite(qShip) ? qShip : 0);

        localStorage.setItem('group_cart_token', qToken);
        if (Number.isFinite(qShip)) localStorage.setItem('group_shipping_fee', String(qShip));

        // đọc thông tin checkout đã lưu từ trang trước (để tạo đơn hàng sau khi all_paid)
        const savedInfo = localStorage.getItem('group_checkout_info');
        if (savedInfo) {
            try {
                setCheckoutInfo(JSON.parse(savedInfo));
            } catch {
                /* ignore */
            }
        }

        (async () => {
            await fetchGroup(qToken);
            // nếu có phí ship -> recalc trước
            if (qShip > 0) {
                await handleRecalc(qToken, qShip);
                await fetchGroup(qToken); // refetch để cập nhật totals theo BE
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchGroup = async (groupToken) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/group-orders/${groupToken}`, {
                method: 'GET',
                headers: authHeaders(),
                credentials: 'include',
            });
            if (!res.ok) {
                let msg = 'Không thể tải thông tin giỏ hàng nhóm';
                try {
                    const j = await res.json();
                    msg = j.message || msg;
                } catch {}
                throw new Error(`${msg} (${res.status})`);
            }
            const data = await res.json();
            setGroup(data);
        } catch (e) {
            setError(e.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // chuẩn hóa members
    const members = useMemo(() => {
        if (!group?.by_member) return [];
        const list = [];
        Object.keys(group.by_member).forEach((mid) => {
            const info = (group.members || []).find((m) => String(m.id) === String(mid));
            const subtotal = group.by_member[mid]?.subtotal ?? 0;
            list.push({
                id: mid,
                name: info?.name || `Thành viên #${mid}`,
                subtotal,
                items: group.by_member[mid]?.items || [],
                role: (info?.role || '').toString().toLowerCase(),
            });
        });
        return list.sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));
    }, [group]);

    const groupSubtotal = useMemo(() => members.reduce((s, m) => s + (m.subtotal || 0), 0), [members]);

    const handleBack = () => router.push('/checkout_grouporder');
    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success('Đã sao chép!');
        } catch {
            message.error('Không thể sao chép');
        }
    };

    // === RECALC API ===
    const handleRecalc = async (grpToken = token, fee = shippingFee) => {
        if (!grpToken) return message.error('Thiếu token nhóm');
        if (!Number.isFinite(Number(fee))) return message.error('Phí ship không hợp lệ');

        setRecalcLoading(true);
        try {
            const res = await fetch(`${API_BASE}/group-orders/${encodeURIComponent(grpToken)}/settlements/recalc`, {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify({ shipping_fee: Number(fee) }),
            });
            if (!res.ok) {
                let msg = 'Không thể cập nhật phí ship cho chia tiền';
                try {
                    const j = await res.json();
                    msg = j.message || msg;
                } catch {}
                throw new Error(msg);
            }
            message.success('Đã cập nhật phí ship để chia tiền');
            return true;
        } catch (e) {
            message.error(e.message || 'Cập nhật phí ship thất bại');
            return false;
        } finally {
            setRecalcLoading(false);
        }
    };

    // === PAYLINKS API ===
    const handleCreatePaylinks = async () => {
        if (!token) return message.error('Thiếu token nhóm');
        if (!members.length) return message.error('Nhóm chưa có sản phẩm');

        // bảo đảm BE đã recalc theo phí ship hiện tại
        const ok = await handleRecalc(token, shippingFee);
        if (!ok) return;

        setCreating(true);
        try {
            const res = await fetch(`${API_BASE}/group-orders/${encodeURIComponent(token)}/settlements/paylinks`, {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify({ gateway, subject: 'Thanh toán nhóm', message: 'Vui lòng thanh toán đơn nhóm.' }),
            });

            if (!res.ok) {
                let msg = 'Không thể tạo paylinks';
                try {
                    const j = await res.json();
                    msg = j.message || msg;
                } catch {}
                throw new Error(msg);
            }

            const data = await res.json();

            let paylinksRaw = data?.data?.paylinks ?? data?.paylinks ?? null;
            if (!paylinksRaw) {
                message.info('API chưa trả về paylinks. Kiểm tra BE.');
                setSplitResult(null);
                return;
            }

            let urls = {};
            if (Array.isArray(paylinksRaw)) {
                paylinksRaw.forEach((row) => {
                    if (row && (row.member_id || row.memberId) && row.url) {
                        urls[String(row.member_id ?? row.memberId)] = row.url;
                    }
                });
            } else if (typeof paylinksRaw === 'object') {
                urls = paylinksRaw;
            }

            setSplitResult({ gateway, urls });
            message.success('Đã tạo link thanh toán chia tiền!');
        } catch (e) {
            message.error(e.message || 'Tạo paylinks thất bại');
        } finally {
            setCreating(false);
        }
    };

    // === STATUS API ===
    const handleCheckStatus = async () => {
        if (!token) return message.error('Thiếu token nhóm');
        setStatusChecking(true);
        try {
            const url = `${API_BASE}/group-orders/${encodeURIComponent(token)}/status?group_status=true`;
            console.log('[STATUS] GET', url);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    // KHÔNG cần Content-Type cho GET không body
                    ...(authHeaders().Authorization ? { Authorization: authHeaders().Authorization } : {}),
                },
                credentials: 'include',
                cache: 'no-store', // tránh cache
            });

            if (!res.ok) {
                let msg = 'Không thể kiểm tra trạng thái nhóm';
                try {
                    const j = await res.json();
                    msg = j.message || msg;
                } catch {}
                throw new Error(msg);
            }

            const data = await res.json();
            console.log('[STATUS] data:', data);
            setStatusData(data);

            if (data.all_paid) {
                message.success('Tất cả thành viên đã thanh toán. Bạn có thể tạo đơn hàng!');
            } else {
                message.info('Vẫn còn thành viên chưa thanh toán.');
            }
        } catch (e) {
            console.error('[STATUS] error:', e);
            message.error(e.message || 'Lỗi kiểm tra trạng thái');
        } finally {
            setStatusChecking(false);
        }
    };

    // map unpaid ids -> tên
    const unpaidLabels = useMemo(() => {
        if (!statusData?.unpaid || !Array.isArray(statusData.unpaid)) return [];
        return statusData.unpaid.map((id) => {
            const m = members.find((mm) => String(mm.id) === String(id));
            return m ? `${m.name} (#${m.id})` : `#${id}`;
        });
    }, [statusData, members]);

    // === CHECKOUT API (tạo đơn hàng khi all_paid) ===
    const handleCreateGroupOrder = async () => {
        console.log('[CREATE ORDER] clicked', { token, statusData, checkoutInfo });
        message.destroy();
        if (!token) {
            message.error('Thiếu token nhóm');
            return;
        }

        // Lưu ý: nếu BE trả all_paid = "true" (string) vẫn coi là true
        const allPaid = String(statusData?.all_paid) === 'true' || statusData?.all_paid === true;
        if (!allPaid) {
            message.error('Chưa đủ thanh toán để tạo đơn hàng');
            return;
        }

        if (!checkoutInfo) {
            message.error('Thiếu thông tin giao hàng (checkoutInfo). Quay lại trang trước để nhập.');
            console.warn(
                '[CREATE ORDER] checkoutInfo is null. Did you save localStorage.setItem("group_checkout_info", ...)?',
            );
            return;
        }

        setCreatingOrder(true);
        const hide = message.loading('Đang tạo đơn...', 0);
        try {
            const body = {
                payment: checkoutInfo?.payment || 'cod',
                address: checkoutInfo?.address || '',
                phone: checkoutInfo?.phone || '',
                sonha: checkoutInfo?.sonha || '',
                street: checkoutInfo?.street || '',
                ward_id: checkoutInfo?.ward_id,
                ward_name: checkoutInfo?.ward_name || '',
                district_id: checkoutInfo?.district_id,
                district_name: checkoutInfo?.district_name || '',
                note: checkoutInfo?.note || '',
            };
            console.log('[CREATE ORDER] POST body', body);

            const res = await fetch(`${API_BASE}/group-orders/${encodeURIComponent(token)}/checkout`, {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            console.log('[CREATE ORDER] response', res.status, data);

            if (!res.ok) throw new Error(data?.message || 'Tạo đơn hàng thất bại');

            message.success('Tạo đơn hàng thành công!');
            localStorage.removeItem('group_checkout_info');
            router.push(`/group-orders/${token}?success=true`);
        } catch (e) {
            console.error('[CREATE ORDER] error', e);
            message.error(e.message || 'Không thể tạo đơn hàng');
        } finally {
            hide();
            setCreatingOrder(false);
        }
    };

    // ===== UI =====
    if (loading) {
        return (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <div style={{ marginTop: 12 }}>
                    <Text>Đang tải dữ liệu...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
                <Button onClick={handleBack} icon={<ArrowLeftOutlined />} style={{ marginBottom: 12 }}>
                    Quay lại checkout nhóm
                </Button>
                <Alert showIcon type="error" message="Lỗi" description={error} />
            </div>
        );
    }

    if (!group) {
        return (
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
                <Button onClick={handleBack} icon={<ArrowLeftOutlined />} style={{ marginBottom: 12 }}>
                    Quay lại checkout nhóm
                </Button>
                <Empty description="Không tìm thấy giỏ hàng nhóm" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
            <Row gutter={24}>
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <WalletOutlined />
                                <span>Chia tiền theo thành viên</span>
                            </Space>
                        }
                    >
                        <Alert
                            type="info"
                            showIcon
                            message="Chế độ chia tiền"
                            description="Mỗi thành viên tự thanh toán phần của mình. Hệ thống sẽ tạo paylink riêng."
                            style={{ marginBottom: 16 }}
                        />

                        <div style={{ marginBottom: 12 }}>
                            <Text strong>Cổng thanh toán:</Text>
                            <br />
                            <Radio.Group
                                value={gateway}
                                onChange={(e) => setGateway(e.target.value)}
                                style={{ marginTop: 8 }}
                            >
                                <Radio value="momo">MoMo</Radio>
                                <Radio value="vnpay">VNPAY</Radio>
                            </Radio.Group>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <Text strong>Phí vận chuyển dùng để chia:</Text>
                            <Space style={{ marginTop: 8 }}>
                                <Input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={shippingFee}
                                    onChange={(e) => setShippingFee(Number(e.target.value || 0))}
                                    style={{ width: 180 }}
                                />
                                <Button
                                    onClick={async () => {
                                        const ok = await handleRecalc(token, shippingFee);
                                        if (ok) fetchGroup(token);
                                    }}
                                    loading={recalcLoading}
                                >
                                    Cập nhật phí ship
                                </Button>
                            </Space>
                        </div>

                        <Divider />

                        <Title level={5} style={{ marginBottom: 12 }}>
                            Danh sách thành viên
                        </Title>
                        {!members.length ? (
                            <Alert type="warning" showIcon message="Nhóm chưa có sản phẩm" />
                        ) : (
                            members.map((m) => (
                                <Card key={m.id} size="small" style={{ marginBottom: 12 }} bodyStyle={{ padding: 12 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <Space>
                                            <UserOutlined />
                                            <Text strong>{m.name}</Text>
                                            <Tag color={m.role === 'owner' ? 'gold' : 'blue'}>
                                                {m.role === 'owner' ? 'Chủ nhóm' : 'Thành viên'}
                                            </Tag>
                                            <Tag>#{m.id}</Tag>
                                        </Space>
                                        <Text strong style={{ color: '#52c41a' }}>
                                            {formatVND(m.subtotal)}
                                        </Text>
                                    </div>

                                    {splitResult?.urls?.[m.id] && (
                                        <div style={{ marginTop: 10 }}>
                                            <Alert
                                                type="success"
                                                showIcon
                                                message={
                                                    <Space>
                                                        <CheckCircleOutlined />
                                                        <span>Link thanh toán</span>
                                                    </Space>
                                                }
                                                description={
                                                    <div style={{ marginTop: 8 }}>
                                                        <Input.Group compact>
                                                            <Input
                                                                value={splitResult.urls[m.id]}
                                                                readOnly
                                                                style={{
                                                                    width: 'calc(100% - 140px)',
                                                                    background: '#f6ffed',
                                                                }}
                                                            />
                                                            <Button
                                                                icon={<CopyOutlined />}
                                                                onClick={() => handleCopy(splitResult.urls[m.id])}
                                                                style={{ width: 140 }}
                                                            >
                                                                Sao chép link
                                                            </Button>
                                                        </Input.Group>
                                                    </div>
                                                }
                                            />
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}

                        <Divider />

                        <Space wrap>
                            <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
                                Quay lại checkout nhóm
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleCreatePaylinks}
                                loading={creating}
                                disabled={!members.length}
                            >
                                Tạo paylinks chia tiền ({gateway.toUpperCase()})
                            </Button>

                            {/* Kiểm tra trạng thái thanh toán */}
                            <Button onClick={handleCheckStatus} loading={statusChecking}>
                                Kiểm tra trạng thái thanh toán
                            </Button>

                            {Boolean(statusData?.all_paid) && (
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        console.log('[UI] click tạo đơn');
                                        handleCreateGroupOrder();
                                    }}
                                    loading={creatingOrder}
                                >
                                    Tạo đơn hàng
                                </Button>
                            )}
                        </Space>

                        {/* Hiển thị kết quả status */}
                        {statusData && (
                            <div style={{ marginTop: 12 }}>
                                <Alert
                                    type={statusData.all_paid ? 'success' : 'warning'}
                                    showIcon
                                    message={
                                        statusData.all_paid
                                            ? '✅ Tất cả thành viên đã thanh toán'
                                            : '⚠️ Vẫn còn thành viên chưa thanh toán'
                                    }
                                    description={
                                        statusData.all_paid ? (
                                            statusData.order_id ? (
                                                <>Mã đơn: {statusData.order_id}</>
                                            ) : null
                                        ) : (
                                            <div>
                                                {statusData.unpaid && statusData.unpaid.length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                        {statusData.unpaid.map((u) => (
                                                            <li key={u.member_id}>
                                                                {u.name} (#{u.member_id}) còn thiếu{' '}
                                                                <strong>
                                                                    {new Intl.NumberFormat('vi-VN').format(
                                                                        u.amount_due,
                                                                    )}
                                                                    đ
                                                                </strong>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <>Không rõ ai chưa thanh toán</>
                                                )}
                                            </div>
                                        )
                                    }
                                />
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Tóm tắt">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>Tổng thành viên:</Text>
                            <Text>{group?.members?.length || 0} người</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>Tổng tiền hàng:</Text>
                            <Text>{formatVND(groupSubtotal)}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>Trạng thái:</Text>
                            <Tag color={group?.status === 'open' ? 'green' : 'orange'}>
                                {group?.status === 'open' ? 'Đang mở' : group?.status || '—'}
                            </Tag>
                        </div>
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>Tổng chia:</Text>
                            <Text strong style={{ color: '#fa541c' }}>
                                {formatVND(groupSubtotal)}
                            </Text>
                        </div>
                    </Card>

                    <Card style={{ marginTop: 16 }} title="Thông tin nhóm">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>Mã nhóm:</Text>
                            <Text code>{token}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>Phí ship đang dùng:</Text>
                            <Text>{formatVND(shippingFee)}</Text>
                        </div>
                        {group?.expires_at && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Hết hạn:</Text>
                                <Text>{new Date(group.expires_at).toLocaleString('vi-VN')}</Text>
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
