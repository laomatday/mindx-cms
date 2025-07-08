

import React, { memo } from 'react';
import type { LucideProps } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode; // Nội dung văn bản của badge.
  colorScheme?: 'gray' | 'red' | 'orange' | 'blue' | 'green' | 'yellow'; // Bảng màu để xác định màu nền và màu chữ.
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>; // Component icon tùy chọn để hiển thị bên cạnh văn bản.
}

/**
 * Component Badge là một thành phần UI tái sử dụng để hiển thị các thông tin ngắn, nổi bật
 * như trạng thái, tag, hoặc thuộc tính (ví dụ: Năm học, Độ tuổi).
 * `memo` được sử dụng để tối ưu hóa, ngăn component render lại nếu props không thay đổi.
 */
export const Badge: React.FC<BadgeProps> = memo(({ children, colorScheme = 'gray', icon: Icon }) => {
  // Map semantic color names to MindX brand colors and Tailwind classes
  const colorStyles = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    red: 'bg-[#E31F26]/20 text-[#E31F26] dark:bg-[#E31F26]/30 dark:text-[#ff8a8e]',
    yellow: 'bg-[#F3CC0B]/20 text-[#B89B08] dark:bg-[#F3CC0B]/30 dark:text-[#f7e07a]',
    orange: 'bg-[#F6931E]/20 text-[#C37418] dark:bg-[#F6931E]/30 dark:text-[#f9b168]',
    green: 'bg-[#5DBD22]/20 text-[#428A18] dark:bg-[#5DBD22]/30 dark:text-[#78d848]',
    blue: 'bg-[#27AAE1]/20 text-[#1C779D] dark:bg-[#27AAE1]/30 dark:text-[#67cbf0]',
  };
  
  const selectedStyle = colorStyles[colorScheme] || colorStyles.gray;

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${selectedStyle}`}>
      {/* Hiển thị icon nếu được cung cấp */}
      {Icon && <Icon size={14} className="opacity-80" />}
      {children}
    </span>
  );
});