

import React, { memo } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    message: string; // Thông điệp để hiển thị cho người dùng.
}

/**
 * Component EmptyState được sử dụng để hiển thị một thông báo
 * khi một danh sách hoặc khu vực nội dung không có dữ liệu để hiển thị.
 * (ví dụ: "Chưa có khóa học nào trong lộ trình này.").
 * `memo` được sử dụng để tối ưu hóa, ngăn component render lại nếu props không thay đổi.
 */
export const EmptyState: React.FC<EmptyStateProps> = memo(({ message }) => {
    return (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            <Inbox className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            <p className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
});
