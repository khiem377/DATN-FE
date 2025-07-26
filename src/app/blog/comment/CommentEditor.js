'use client';

// components/CommentEditor.js
import { BoldOutlined, CodeOutlined, ItalicOutlined, LinkOutlined, PictureOutlined } from '@ant-design/icons';
import { Button, Input } from 'antd';
import ToolbarButton from './ToolbarButton';

const { TextArea } = Input;

const CommentEditor = ({
    value,
    onChange,
    onSubmit,
    onCancel,
    placeholder = 'Nhập bình luận...',
    submitting = false,
}) => (
    <div style={{ flex: 1 }}>
        {/* Toolbar */}
        <div
            style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '8px',
                padding: '4px 8px',
                backgroundColor: '#f7f8fc',
                borderRadius: '6px',
                border: '1px solid #e4e6ea',
            }}
        >
            <ToolbarButton icon={<BoldOutlined />} title="Bold" />
            <ToolbarButton icon={<ItalicOutlined />} title="Italic" />
            <ToolbarButton icon={<span style={{ fontFamily: 'monospace' }}></span>} title="Quote" />
            <ToolbarButton icon={<CodeOutlined />} title="Code" />
            <ToolbarButton icon={<span style={{ fontFamily: 'monospace' }}>&lt;/&gt;</span>} title="HTML" />
            <ToolbarButton icon={<PictureOutlined />} title="Image" />
            <ToolbarButton icon={<LinkOutlined />} title="Link" />
            <ToolbarButton icon={<span>🔗</span>} title="Link" />
        </div>

        {/* Text Area */}
        <TextArea
            value={value}
            onChange={onChange}
            style={{
                border: '1px solid #e4e6ea',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px',
                marginBottom: '8px',
                minHeight: '60px',
            }}
            placeholder={placeholder}
        />

        {/* Action Buttons */}
        <div
            style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
            }}
        >
            <Button
                style={{
                    borderRadius: '6px',
                    fontSize: '12px',
                    height: '32px',
                    border: '1px solid #e4e6ea',
                    backgroundColor: 'white',
                    color: '#65676b',
                }}
                onClick={onCancel}
                disabled={submitting}
            >
                HỦY
            </Button>
            <Button
                type="primary"
                style={{
                    borderRadius: '6px',
                    fontSize: '12px',
                    height: '32px',
                    backgroundColor: '#1877f2',
                    fontWeight: '600',
                }}
                onClick={onSubmit}
                loading={submitting}
            >
                BÌNH LUẬN
            </Button>
        </div>
    </div>
);

export default CommentEditor;
