import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { UI_STRINGS } from '../constants';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface LoginModalProps {
  onClose: () => void; // Hàm callback được gọi khi đóng modal.
}

/**
 * Component LoginModal hiển thị một cửa sổ modal cho phép người dùng đăng nhập.
 */
export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  // State để lưu trữ email, mật khẩu, thông báo lỗi và trạng thái đang đăng nhập.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const context = useContext(AppContext);
  
  // Sử dụng custom hook để khóa cuộn của trang khi modal mở.
  useBodyScrollLock();

  if (!context) {
    // Nếu không có context, không thể thực hiện hành động gì.
    return null;
  }
  
  const { login } = context;

  // Hàm xử lý sự kiện khi người dùng gửi form đăng nhập.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tải lại trang.
    setError('');
    setIsLoggingIn(true);
    login(email, password)
      .then(success => {
        if (success) {
          // Nếu đăng nhập thành công, đóng modal.
          onClose();
        } else {
          // Nếu thất bại, hiển thị thông báo lỗi.
          setError('Email hoặc mật khẩu không đúng.');
        }
      })
      .catch(() => {
        setError('Email hoặc mật khẩu không đúng.');
      })
      .finally(() => {
        // Dù thành công hay thất bại, kết thúc trạng thái "đang đăng nhập".
        setIsLoggingIn(false);
      });
  };

  return (
    // Lớp phủ nền mờ cho modal
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in" onMouseDown={onClose}>
      {/* Nội dung modal. `onMouseDown` với `e.stopPropagation()` ngăn việc click bên trong modal làm đóng nó. */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 relative animate-fade-in-up" onMouseDown={e => e.stopPropagation()}>
        {/* Nút đóng modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-[#E31F26]">{UI_STRINGS.adminLogin}</h2>
        {/* Form đăng nhập */}
        <form onSubmit={handleLogin}>
          {/* Trường nhập email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">{UI_STRINGS.username}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:border-[#E31F26] focus:ring-0 outline-none transition"
              required
              disabled={isLoggingIn}
            />
          </div>
          {/* Trường nhập mật khẩu */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="password">{UI_STRINGS.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:border-[#E31F26] focus:ring-0 outline-none transition"
              required
              disabled={isLoggingIn}
            />
          </div>
          {/* Hiển thị thông báo lỗi nếu có */}
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          {/* Nút đăng nhập */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#E31F26] text-white font-bold py-2.5 px-5 rounded-lg hover:bg-red-700 transition-colors duration-300 focus:outline-none focus:ring-0 disabled:bg-red-400 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
          >
            {isLoggingIn ? 'Đang đăng nhập...' : UI_STRINGS.login}
          </button>
        </form>
      </div>
    </div>
  );
};
