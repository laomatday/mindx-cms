

import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Component Skeleton là một placeholder (trình giữ chỗ) trực quan.
 * Nó hiển thị một hình dạng mô phỏng nội dung sẽ xuất hiện trong khi dữ liệu đang được tải.
 * Điều này cải thiện trải nghiệm người dùng bằng cách cung cấp phản hồi rằng trang đang hoạt động,
 * thay vì chỉ hiển thị một màn hình trắng.
 * `memo` được sử dụng để tối ưu hóa, ngăn component render lại nếu props không thay đổi.
 */
export const Skeleton: React.FC<SkeletonProps> = memo(({ className }) => {
  // `animate-shimmer` là một animation được định nghĩa trong index.html
  // để tạo hiệu ứng ánh sáng lướt qua, cho thấy trạng thái đang tải.
  return (
    <div className={`relative overflow-hidden bg-black/10 dark:bg-white/10 rounded-md animate-shimmer ${className}`} />
  );
});
