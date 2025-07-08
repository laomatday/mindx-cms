# MindX - CMS Tài liệu khóa học

Một Hệ thống Quản lý Nội dung (CMS) chuyên biệt để tổ chức và chia sẻ tài liệu các khóa học về Lập trình, Robotics và Thiết kế & Nghệ thuật.

## Giới thiệu

Ứng dụng này được thiết kế để cung cấp một nền tảng tập trung cho các nhà quản lý học thuật và giáo viên tại MindX để quản lý chương trình giảng dạy. Nó cho phép tổ chức nội dung theo các lộ trình học tập, khóa học và cấp độ, đồng thời cung cấp quyền truy cập dễ dàng vào các tài liệu liên quan như giáo trình, slide bài giảng và đề án.

## Tính năng

-   **Phân cấp nội dung có cấu trúc**:
    -   **Lộ trình học (Learning Paths)**: Các danh mục cấp cao nhất (ví dụ: Coding & AI, Art & Design, Robotics).
    -   **Khóa học (Courses)**: Các khóa học riêng lẻ trong mỗi lộ trình, với các thông tin chi tiết như nhóm tuổi, năm học, ngôn ngữ lập trình và công cụ.
    -   **Cấp độ (Levels)**: Mỗi khóa học có thể được chia thành nhiều cấp độ (ví dụ: Cơ bản, Nâng cao, Chuyên sâu).
-   **Quản lý tài liệu**: Đính kèm và quản lý các loại tài liệu khác nhau (Syllabus, Lesson Plan, Slide, Project, v.v.) ở bất kỳ cấp nào trong hệ thống phân cấp.
-   **Giao diện quản trị (Admin)**:
    -   Đăng nhập an toàn cho quản trị viên thông qua Firebase Authentication.
    -   Thực hiện các thao tác **CRUD** (Tạo, Đọc, Cập nhật, Xóa) trên tất cả các lộ trình, khóa học, cấp độ và tài liệu.
    -   Các thay đổi được lưu vào **Firebase Firestore** để duy trì và đồng bộ hóa.
-   **Chế độ xem cho người dùng (User View)**: Người dùng thông thường có thể duyệt và xem tất cả nội dung nhưng không thể thực hiện thay đổi.
-   **Thiết kế hiện đại và đáp ứng (Responsive)**:
    -   Giao diện người dùng sạch sẽ, hiện đại được xây dựng bằng Tailwind CSS.
    -   Hỗ trợ **Chế độ tối (Dark Mode)**, tự động điều chỉnh theo cài đặt hệ điều hành.
    -   Thanh bên có thể thu gọn để tối đa hóa không gian màn hình.
    -   Thiết kế đáp ứng đầy đủ cho máy tính để bàn, máy tính bảng và thiết bị di động.
-   **Tìm kiếm mạnh mẽ**: Một cửa sổ tìm kiếm cho phép người dùng nhanh chóng tìm thấy các khóa học và tài liệu trên toàn bộ hệ thống.
-   **Trải nghiệm người dùng nâng cao**:
    -   Cử chỉ **vuốt để quay lại** trên thiết bị di động để điều hướng trực quan.
    -   Biểu tượng và huy hiệu để nhận dạng trực quan các loại tài liệu và thuộc tính khóa học.
    -   Thông báo xác nhận để ngăn chặn việc xóa tình cờ.

## Hướng dẫn sử dụng

### 1. Điều hướng

-   **Trang chủ**: Cung cấp tổng quan về các Lộ trình học có sẵn.
-   **Thanh bên (Sidebar)**: Sử dụng thanh bên ở bên trái để điều hướng giữa Trang chủ và các Lộ trình học khác nhau.
    -   Trên máy tính để bàn, bạn có thể thu gọn hoặc mở rộng thanh bên bằng nút menu.
    -   Trên thiết bị di động, thanh bên hoạt động như một menu ngoài màn hình.
-   **Xem chi tiết**:
    -   Nhấp vào một Lộ trình học trên Trang chủ hoặc thanh bên để xem danh sách các khóa học của nó.
    -   Nhấp vào một thẻ khóa học để xem trang chi tiết của nó, bao gồm nội dung, mục tiêu, tài liệu và các cấp độ.

### 2. Tìm kiếm

-   Nhấp vào biểu tượng tìm kiếm ở thanh bên để mở cửa sổ tìm kiếm.
-   Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm các khóa học và tài liệu.
-   Nhấp vào một kết quả để điều hướng trực tiếp đến khóa học đó hoặc mở tài liệu trong một tab mới.

### 3. Chế độ quản trị (Admin)

Để truy cập các tính năng quản trị, bạn cần đăng nhập với tư cách quản trị viên.

-   **Đăng nhập**:
    -   Nhấp vào nút **Đăng nhập** trên thanh bên.
    -   Sử dụng thông tin đăng nhập sau đây cho mục đích demo:
        -   **Email**: `admin@test.com`
        -   **Mật khẩu**: `admin123`
-   **Thực hiện thay đổi**:
    -   Sau khi đăng nhập, các nút **Thêm**, **Chỉnh sửa** và **Xóa** sẽ xuất hiện trên toàn bộ ứng dụng.
    -   Bạn có thể thêm các khóa học mới vào một lộ trình, thêm cấp độ vào một khóa học hoặc thêm tài liệu vào bất kỳ mục nào.
    -   Nhấp vào biểu tượng bút chì để chỉnh sửa một mục hiện có hoặc biểu tượng thùng rác để xóa nó.
    -   Tất cả các thay đổi sẽ được lưu tự động vào Firebase.

## Công nghệ sử dụng

-   **Frontend**: React, TypeScript
-   **Backend & Database**: Firebase (Firestore, Authentication)
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **State Management**: React Context API
