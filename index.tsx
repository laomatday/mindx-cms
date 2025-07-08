
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// Lấy phần tử DOM có id là 'root'. Đây là nơi ứng dụng React sẽ được gắn vào.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Tạo một "root" cho ứng dụng React.
// Đây là điểm khởi đầu cho việc render cây component của React.
const root = ReactDOM.createRoot(rootElement);

// Render component App, được bọc bởi StrictMode và AppProvider.
// - React.StrictMode: Kích hoạt các kiểm tra và cảnh báo bổ sung cho các component con, giúp phát hiện các vấn đề tiềm ẩn.
// - AppProvider: Component Context Provider, cung cấp state và các hàm cho toàn bộ ứng dụng.
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
