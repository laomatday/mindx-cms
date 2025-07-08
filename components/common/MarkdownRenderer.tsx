import React, { useMemo } from 'react';
import { parseSimpleMarkdown } from '../../utils/text';

interface MarkdownRendererProps {
  text: string;
  className?: string;
  as?: React.ElementType; // Cho phép chỉ định thẻ container, mặc định là 'div'
}

/**
 * Component để render văn bản có hỗ trợ markdown đơn giản (đậm, nghiêng).
 * Sử dụng `dangerouslySetInnerHTML` nên chỉ dùng với nội dung đáng tin cậy.
 * Hàm `parseSimpleMarkdown` đã có bước escape HTML cơ bản để tăng an toàn.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, className, as: Component = 'div' }) => {
    const html = useMemo(() => parseSimpleMarkdown(text), [text]);

    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
