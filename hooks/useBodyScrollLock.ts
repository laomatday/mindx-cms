
import { useEffect } from 'react';

/**
 * Custom hook `useBodyScrollLock` được sử dụng để ngăn người dùng cuộn trang
 * khi một thành phần (ví dụ: modal) đang được hiển thị.
 *
 * Cách hoạt động:
 * - Khi hook được gọi (component sử dụng nó được mount), nó sẽ lưu lại giá trị `overflow`
 *   hiện tại của `document.body`.
 * - Sau đó, nó đặt `document.body.style.overflow` thành 'hidden' để vô hiệu hóa thanh cuộn.
 * - Khi component bị unmount (ví dụ: modal đóng lại), hàm dọn dẹp (cleanup function)
 *   trong `useEffect` sẽ được gọi. Hàm này sẽ khôi phục lại giá trị `overflow` ban đầu,
 *   trả lại thanh cuộn cho trang.
 */
export const useBodyScrollLock = () => {
    useEffect(() => {
        // Lưu lại style overflow gốc
        const originalStyle = window.getComputedStyle(document.body).overflow;
        // Vô hiệu hóa cuộn
        document.body.style.overflow = 'hidden';

        // Hàm dọn dẹp sẽ được gọi khi component unmount
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []); // Mảng rỗng `[]` đảm bảo effect này chỉ chạy một lần khi mount và dọn dẹp khi unmount.
};
