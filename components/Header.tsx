
import React, { memo } from 'react';
import { Menu } from 'lucide-react';
import { Logo } from './common/Logo';

interface HeaderProps {
  onMenuToggle: () => void; // Hàm callback để bật/tắt sidebar trên di động.
  isSidebarOpen: boolean; // Trạng thái hiện tại của sidebar (mở hay đóng).
}

/**
 * Component Header hiển thị ở đầu trang.
 * Bao gồm nút menu trên di động, tiêu đề và logo.
 * `memo` được sử dụng để tối ưu hóa, ngăn component render lại nếu props không thay đổi.
 */
export const Header: React.FC<HeaderProps> = memo(({ onMenuToggle, isSidebarOpen }) => {
  return (
    <header className="bg-gray-50 dark:bg-gray-950 px-4 flex items-center sticky top-0 z-30 border-gray-50 border-black/5 dark:border-gray-950 h-[65px]">
      {/* Bên trái: Nút bật/tắt Menu trên di động. flex-none ngăn nó co lại. */}
      <div className="flex-none">
          <button 
            onClick={onMenuToggle} 
            className={`p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
      </div>

      {/* Ở giữa: Tiêu đề. flex-1 cho phép nó chiếm không gian còn lại. min-w-0 cần thiết để truncate hoạt động đúng. */}
      <div className="flex-1 min-w-0 px-2">
          
      </div>

      {/* Bên phải: Logo. flex-none ngăn nó co lại. */}
      <div className="flex-none">
        <Logo className="h-9" />
      </div>
    </header>
  );
});
