import { message } from 'antd';
import { useState } from 'react';

export const useProfile = (user, token) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['name', 'phone'].includes(name)) {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                }),
            });

            if (!res.ok) {
                throw new Error('Cập nhật thất bại');
            }

            message.success('Cập nhật thành công!');
            setEditing(false);
        } catch (err) {
            console.error(err);
            message.error('Có lỗi xảy ra khi cập nhật');
        }
    };

    return {
        editing,
        setEditing,
        formData,
        setFormData,
        handleChange,
        handleSubmit,
    };
};
