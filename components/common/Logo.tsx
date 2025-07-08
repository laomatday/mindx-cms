

import React, { memo } from 'react';

interface LogoProps {
  className?: string;
}

// URL của logo cho chế độ sáng và tối
const LOGO_LIGHT_URL = 'https://w.ladicdn.com/s400x350/5cefbc1ed062e8345a24dfe8/logo-mau-20220824105222.png';
const LOGO_DARK_URL = 'https://w.ladicdn.com/s450x400/5cefbc1ed062e8345a24dfe8/logo-trang-20220824105223.png';

/**
 * Component Logo hiển thị logo của MindX.
 * Nó tự động chuyển đổi giữa logo cho chế độ sáng (light mode) và tối (dark mode)
 * bằng cách sử dụng các lớp CSS của Tailwind CSS (`dark:hidden` và `hidden dark:block`).
 * `memo` được sử dụng để tối ưu hóa, ngăn component này render lại một cách không cần thiết
 * nếu props của nó không thay đổi.
 */
export const Logo: React.FC<LogoProps> = memo(({ className }) => {
  return (
    <div className={className}>
      {/* Logo cho chế độ sáng, sẽ bị ẩn đi khi ở dark mode */}
      <img 
        src={LOGO_LIGHT_URL}
        alt="MindX Technology School Logo" 
        className="h-full w-auto dark:hidden"
      />
      {/* Logo cho chế độ tối, sẽ được hiển thị khi ở dark mode */}
      <img 
        src={LOGO_DARK_URL}
        alt="MindX Technology School Logo" 
        className="h-full w-auto hidden dark:block"
      />
    </div>
  );
});
