import React, { useContext, useState, useCallback, memo } from 'react';
import { AppContext } from '../context/AppContext';
import { LearningPath, LearningPathName, DEFAULT_PATH_NAMES, DefaultLearningPathName } from '../types';
import { UI_STRINGS } from '../constants';
import { Code, Palette, Bot, Home, Phone, Mail, Menu, Search, MessageSquareText, LogIn, LogOut, Route } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { LoginModal } from './LoginModal';

// Ánh xạ từ tên lộ trình học sang component Icon tương ứng.
const pathIcons: Record<DefaultLearningPathName, React.ElementType> = {
    [DEFAULT_PATH_NAMES.CODING_AI]: Code,
    [DEFAULT_PATH_NAMES.ART_DESIGN]: Palette,
    [DEFAULT_PATH_NAMES.ROBOTICS]: Bot,
};

// Props cho một mục trong sidebar.
interface SidebarItemProps {
    onClick?: (e?: React.MouseEvent) => void;
    href?: string;
    icon: React.ElementType;
    children: React.ReactNode;
    isSelected?: boolean;
    tooltip: string; // Nội dung tooltip hiển thị khi hover.
    isCollapsed: boolean; // Sidebar đang thu gọn hay không.
}
  
// Component cho một mục đơn lẻ trong sidebar.
// Được tối ưu hóa bằng `memo` để tránh render lại không cần thiết.
const SidebarItem: React.FC<SidebarItemProps> = memo(({ onClick, href, icon: Icon, children, isSelected = false, tooltip, isCollapsed }) => {
    // Base classes for the button/link element
    const commonClasses = `flex items-center text-base font-bold transition-all duration-200 ease-in-out group`;

    // State-dependent classes for layout and shape
    const shapeClasses = isCollapsed
        ? 'w-12 h-12 rounded-full justify-center' // Collapsed state: circular button
        : 'w-full px-4 py-2.5 rounded-full text-left gap-4'; // Expanded state

    // State-dependent classes for color (keeping original colors as requested)
    const colorClasses = isSelected
        ? 'bg-red-50 dark:bg-red-900/40 text-[#E31F26]'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10';

    const finalClassName = `${commonClasses} ${shapeClasses} ${colorClasses}`;

    const content = (
      <>
        <Icon size={22} className="flex-shrink-0" />
        <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'flex-1 opacity-100'}`}>
          {children}
        </span>
      </>
    );

    const sharedProps = {
      className: finalClassName,
      onClick,
      'aria-label': tooltip,
    };
    
    // When collapsed, a wrapper is used to center the circular button within the sidebar's layout.
    if (isCollapsed) {
        return (
            <div className="flex justify-center w-full">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" {...sharedProps}>
                    {content}
                  </a>
                ) : (
                  <button type="button" {...sharedProps}>
                    {content}
                  </button>
                )}
            </div>
        );
    }
    
    // When expanded, the button itself is full-width, so no wrapper is needed.
    return (
        href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" {...sharedProps}>
            {content}
          </a>
        ) : (
          <button type="button" {...sharedProps}>
            {content}
          </button>
        )
    );
});


interface SidebarProps {
    isCollapsed: boolean; // Trạng thái thu gọn của sidebar (từ component cha).
    onToggle: () => void; // Hàm để thay đổi trạng thái thu gọn.
}

/**
 * Component Sidebar chính của ứng dụng.
 * Chứa logic điều hướng, tìm kiếm, đăng nhập/đăng xuất.
 */
export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const context = useContext(AppContext);
  // State để quản lý việc mở/đóng các modal.
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  if (!context) return null;

  const { data, selectedPathId, navigate, currentUser, logout } = context;

  // Hàm xử lý khi người dùng click vào một lộ trình học hoặc trang chủ.
  // `useCallback` để tối ưu hóa, chỉ tạo lại hàm khi các dependencies thay đổi.
  const handlePathClick = useCallback((pathId: string | null) => {
    navigate(pathId, null); // Reset lựa chọn khóa học khi đổi lộ trình.
    // Trên di động, tự động đóng sidebar sau khi chọn.
    if (window.innerWidth < 768) { // md breakpoint
        onToggle();
    }
  }, [navigate, onToggle]);

  // Hàm xử lý đăng xuất.
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);
  
  // Hàm xử lý khi click nút đăng nhập.
  const handleLoginClick = useCallback(() => {
    setLoginModalOpen(true);
  }, []);
  
  // Nội dung JSX của sidebar.
  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 border-r border-black/5 dark:border-white/5 overflow-hidden">
        {/* Phần header của sidebar */}
        <div className={`flex items-center h-[65px] flex-shrink-0
            ${isCollapsed ? 'px-4' : 'justify-between px-4'}`}>
            
            {/* Nút thu gọn/mở rộng sidebar */}
            <button 
                onClick={onToggle} 
                className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Toggle sidebar">
                <Menu size={22} />
            </button>
            
            {/* Nút tìm kiếm, chỉ hiển thị khi sidebar không thu gọn */}
            {!isCollapsed && (
                <button onClick={() => setSearchModalOpen(true)} className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10" aria-label={UI_STRINGS.searchPlaceholder}>
                    <Search size={22} />
                </button>
            )}
        </div>

        {/* Danh sách các mục điều hướng chính */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
            <SidebarItem onClick={() => handlePathClick(null)} icon={Home} isSelected={!selectedPathId} tooltip={UI_STRINGS.home} isCollapsed={isCollapsed}>
                {UI_STRINGS.home}
            </SidebarItem>

            {/* Render các lộ trình học từ dữ liệu */}
            {data.map((path: LearningPath) => {
                const Icon = pathIcons[path.name as DefaultLearningPathName] || Route;
                return (
                    <SidebarItem
                        key={path.id}
                        onClick={() => handlePathClick(path.id)}
                        icon={Icon}
                        isSelected={selectedPathId === path.id}
                        tooltip={path.name}
                        isCollapsed={isCollapsed}
                    >
                        {path.name}
                    </SidebarItem>
                )
            })}
        </nav>
        
        {/* Phần chân sidebar chứa các liên kết và nút đăng nhập/đăng xuất */}
        <div className="mt-auto p-3 space-y-1 border-t border-black/5 dark:border-white/5">
            <SidebarItem href={`tel:${UI_STRINGS.contactPhone}`} tooltip={UI_STRINGS.contactPhone} icon={Phone} isCollapsed={isCollapsed}>
                {UI_STRINGS.contactPhone}
            </SidebarItem>
            <SidebarItem href={`mailto:${UI_STRINGS.contactEmail}`} tooltip={UI_STRINGS.contactEmail} icon={Mail} isCollapsed={isCollapsed}>
                {UI_STRINGS.contactEmail}
            </SidebarItem>
            <SidebarItem href={UI_STRINGS.feedbackUrl} tooltip={UI_STRINGS.feedback} icon={MessageSquareText} isCollapsed={isCollapsed}>
                {UI_STRINGS.feedback}
            </SidebarItem>
            {/* Hiển thị nút Đăng xuất hoặc Đăng nhập tùy thuộc vào trạng thái `currentUser` */}
            {currentUser ? (
            <SidebarItem onClick={handleLogout} tooltip={UI_STRINGS.logout} icon={LogOut} isCollapsed={isCollapsed}>
                {UI_STRINGS.logout}
            </SidebarItem>
            ) : (
            <SidebarItem onClick={handleLoginClick} tooltip={UI_STRINGS.adminLogin} icon={LogIn} isCollapsed={isCollapsed}>
                {UI_STRINGS.login}
            </SidebarItem>
            )}
        </div>
    </div>
  );

  return (
    <>
      {/* Thẻ `aside` chứa nội dung sidebar. CSS class được điều khiển để xử lý việc ẩn/hiện và thay đổi kích thước. */}
      <aside className={`h-full z-40 transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0 w-72 transform ${isCollapsed ? '-translate-x-full md:w-20' : 'translate-x-0 w-72'}
        md:relative md:left-auto md:inset-y-auto md:transform-none md:flex-shrink-0
      `}>
          {sidebarContent}
      </aside>

      {/* Lớp phủ (Overlay) cho di động, khi click vào sẽ đóng sidebar. */}
      {!isCollapsed && (
          <div 
              onClick={onToggle}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
              aria-hidden="true"
          />
      )}

      {/* Render các modal nếu state tương ứng là true */}
      {isSearchModalOpen && <SearchModal onClose={() => setSearchModalOpen(false)} />}
      {isLoginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}
    </>
  );
};