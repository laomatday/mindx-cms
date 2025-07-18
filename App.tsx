import React, { useState, useContext, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { AppContext } from './context/AppContext';
import { CheckCircle, Plus, X, Route, Book, Layers } from 'lucide-react';
import { useSwipeBack } from './hooks/useSwipeBack';
import { CreationWizard } from './components/CreationWizard';

/**
 * Component Toast để hiển thị thông báo ngắn (ví dụ: "Lưu thành công").
 * Nó lấy thông điệp từ AppContext và tự động ẩn sau một khoảng thời gian.
 * Vị trí được đặt ở trên cùng, trung tâm màn hình.
 */
function Toast() {
  const context = useContext(AppContext);
  const { toast } = context ?? {};

  // Chỉ render khi có thông điệp toast
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
       <div className="bg-green-600/80 backdrop-blur-xl text-white rounded-xl shadow-2xl py-3 px-6 flex items-center gap-3 ring-1 ring-white/10">
          <CheckCircle size={20} />
          <p className="font-semibold text-base">{toast}</p>
        </div>
    </div>
  );
}


function FloatingActionButton() {
  const { showCreationWizard, selectedPathId, selectedCourseId } = useContext(AppContext)!;
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Lộ trình mới', icon: Route, action: () => showCreationWizard('learningPath', {}) },
    { label: 'Khóa học mới', icon: Book, action: () => showCreationWizard('course', { pathId: selectedPathId || undefined }) },
    { label: 'Cấp độ mới', icon: Layers, action: () => showCreationWizard('level', { pathId: selectedPathId || undefined, courseId: selectedCourseId || undefined }) },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      <div className="relative flex flex-col items-center gap-3">
        {isOpen && (
          <div className="flex flex-col gap-3 animate-fade-in-up">
            {menuItems.map((item, index) => (
              <div key={index} className="flex items-center justify-end gap-3 group">
                <span className="bg-white dark:bg-gray-700 text-sm font-semibold px-3 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
                <button
                  onClick={() => { item.action(); setIsOpen(false); }}
                  className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-all"
                >
                  <item.icon size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 flex items-center justify-center bg-[#E31F26] text-white rounded-full shadow-xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
          aria-label="Tạo nội dung mới"
        >
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
            <Plus size={32} />
          </div>
        </button>
      </div>
    </div>
  )
}


/**
 * Component gốc của ứng dụng.
 * Chịu trách nhiệm bố cục chính bao gồm Sidebar, Header và MainContent.
 */
function App() {
  // `md` breakpoint của Tailwind là 768px. Chúng ta sử dụng giá trị này để nhất quán.
  const MD_BREAKPOINT = 768;

  // State để quản lý trạng thái thu gọn/mở rộng của thanh bên (sidebar).
  // Mặc định thu gọn trên màn hình lớn.
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
  const context = useContext(AppContext);
  
  // Callback để bật/tắt trạng thái sidebar, được memoized để tối ưu hiệu năng.
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prevState => !prevState);
  }, []);

  // Effect để xử lý việc thay đổi kích thước cửa sổ để đảm bảo hành vi responsive.
  // Nó sẽ luôn thu gọn sidebar khi màn hình trở nên nhỏ.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < MD_BREAKPOINT) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Dọn dẹp event listener khi component unmount.
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Mảng dependency rỗng đảm bảo effect này chỉ chạy một lần khi mount và dọn dẹp khi unmount.

  const { selectedPathId, selectedCourseId, goBack, goForward, canGoBack, canGoForward, activeDocument, creationState, currentUser } = context ?? {};
  
  const handleSwipeBack = useCallback(() => {
    if(canGoBack) goBack?.();
  }, [canGoBack, goBack]);
    
  const handleSwipeForward = useCallback(() => {
    if(canGoForward) goForward?.();
  }, [canGoForward, goForward]);

  const swipeRef = useSwipeBack({
      onSwipeBack: handleSwipeBack,
      onSwipeForward: handleSwipeForward,
      enabled: !creationState // Disable swipe when wizard is open
  });

  // `animationKey` dùng để buộc React re-render `MainContent` và kích hoạt lại animation
  // mỗi khi người dùng điều hướng đến một trang khác (ví dụ: từ trang chủ sang một lộ trình,
  // hoặc từ danh sách khóa học sang chi tiết khóa học, hoặc mở một tài liệu).
  const animationKey = activeDocument ? activeDocument.url : (selectedPathId ? (selectedCourseId || selectedPathId) : 'home');

  const isAdmin = currentUser?.role === 'admin';

  if (creationState) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-950">
        <CreationWizard />
        <Toast />
      </div>
    );
  }

  return (
    <div className="flex h-screen transition-colors duration-300">
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuToggle={toggleSidebar} isSidebarOpen={!isSidebarCollapsed} />
        {/* Thuộc tính `key` ở đây rất quan trọng. Khi `key` thay đổi, React sẽ coi đây là một
            component mới, hủy component cũ và tạo một cái mới. Điều này cho phép animation
            `animate-fade-in` chạy lại mỗi khi người dùng chuyển trang. */}
        <div ref={swipeRef} key={animationKey} className="flex-1 flex flex-col overflow-y-auto animate-fade-in bg-gray-50 dark:bg-gray-950 custom-scrollbar">
          <MainContent />
        </div>
      </div>
      <Toast />
      {isAdmin && <FloatingActionButton />}
    </div>
  );
}

export default App;
