import { LearningPath, LevelName, DocumentCategory, LearningPathName } from './types';

// Đối tượng chứa các chuỗi văn bản (UI strings) được sử dụng trong toàn bộ ứng dụng.
// Việc tập trung các chuỗi ở đây giúp dễ dàng quản lý, thay đổi và dịch thuật sau này.
export const UI_STRINGS = {
  appName: "MindX - CMS",
  home: "Trang chủ",
  learningPaths: "Lộ trình học",
  courses: "Các khóa học",
  levels: "Cấp độ",
  filterBy: "Lọc theo",
  ageGroup: "Độ tuổi",
  programmingLanguage: "Ngôn ngữ lập trình",
  tools: "Công cụ",
  login: "Đăng nhập",
  logout: "Đăng xuất",
  adminLogin: "Đăng nhập Admin",
  username: "Email",
  password: "Mật khẩu",
  welcomeMessage: "MindX - CMS",
  selectPathHint: "Chọn một lộ trình học từ thanh bên để xem chi tiết.",
  courseContent: "Nội dung khóa học", 
  courseObjectives: "Mục tiêu khóa học",
  levelContent: "Nội dung cấp độ",
  levelObjectives: "Mục tiêu cấp độ",
  documents: "Tài liệu",
  all: "Tất cả",
  edit: "Chỉnh sửa",
  delete: "Xóa",
  add: "Thêm",
  save: "Lưu",
  cancel: "Hủy",
  addCourse: "Thêm khóa học",
  addLevel: "Thêm cấp độ",
  addDocument: "Thêm tài liệu",
  deleteConfirmation: "Bạn có chắc chắn muốn xóa mục này không? Hành động này không thể hoàn tác.",
  name: "Tên",
  content: "Nội dung",
  objectives: "Mục tiêu",
  url: "Đường dẫn (URL)",
  year: "Năm",
  ageGroupLabel: "Độ tuổi",
  language: "Ngôn ngữ lập trình",
  toolsLabel: "Công cụ (phân cách bởi dấu phẩy)",
  imageUrl: "Hình ảnh đại diện",
  category: "Tài liệu",
  level: "Cấp độ",
  homeTitle: "MindX Technology School - CMS",
  homeSubtitle: "Hệ thống quản lý và chia sẻ tài liệu liên quan đến Khóa học tại MindX.",
  codingAiDesc: "Lộ trình Coding & AI giúp học sinh chinh phục *thế giới số* từ nền tảng đến nâng cao. Các em được học lập trình ứng dụng, phát triển website, khám phá trí tuệ nhân tạo và rèn luyện tư duy logic, sáng tạo. Không học để chạy theo công nghệ, học để **làm chủ** và ứng dụng nó vào cuộc sống.",
  artDesignDesc: "Art & Design là nơi học sinh phát triển óc thẩm mỹ và khả năng sáng tạo thị giác thông qua mỹ thuật truyền thống, thiết kế đồ họa, digital painting và UI/UX. Tích hợp công cụ số và ứng dụng AI, lộ trình giúp các em thể hiện **cá tính sáng tạo** và tạo nên sản phẩm nghệ thuật mang *dấu ấn cá nhân*.",
  roboticsDesc: "Với Robotics, học sinh được trải nghiệm công nghệ theo cách sinh động nhất: lắp ráp, lập trình và điều khiển robot giải quyết vấn đề thực tiễn. Khơi dậy đam mê khám phá và đưa **tư duy kỹ thuật** vào hành động.",
  searchPlaceholder: "Tìm kiếm khóa học, tài liệu...",
  contact: "Liên hệ",
  contactPhone: "0944.022.507",
  contactEmail: "academic@mindx.vn",
  feedback: "Gửi phản hồi",
  feedbackUrl: "#",
  searching: "Đang tìm kiếm...",
  searchError: "Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại.",
  noResults: "Không tìm thấy kết quả phù hợp.",
};

// Ánh xạ từ enum DocumentCategory sang tên hiển thị bằng tiếng Việt.
// Giúp hiển thị tên loại tài liệu một cách thân thiện với người dùng.
export const DOCUMENT_NAMES: { [key in DocumentCategory]: string } = {
  [DocumentCategory.ROADMAP]: 'Roadmap',
  [DocumentCategory.SYLLABUS]: 'Syllabus',
  [DocumentCategory.TRIAL]: 'Kịch bản Trial',
  [DocumentCategory.LESSON_PLAN]: 'Lesson Plan',
  [DocumentCategory.TEACHING_GUIDE]: 'Teaching Guide',
  [DocumentCategory.SLIDE]: 'Slide',
  [DocumentCategory.PROJECT]: 'Project/Sample',
  [DocumentCategory.HOMEWORK]: 'Homework',
  [DocumentCategory.CHECKPOINT]: 'Checkpoint',
  [DocumentCategory.STUDENT_BOOK]: 'Student Book',
  [DocumentCategory.BAREM]: 'Barem',
};

// Các loại tài liệu chỉ được phép cho Khóa học
export const COURSE_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  DocumentCategory.SYLLABUS,
  DocumentCategory.TRIAL,
];

// Các loại tài liệu chỉ được phép cho Cấp độ
export const LEVEL_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  DocumentCategory.LESSON_PLAN,
  DocumentCategory.TEACHING_GUIDE,
  DocumentCategory.SLIDE,
  DocumentCategory.PROJECT,
  DocumentCategory.HOMEWORK,
  DocumentCategory.CHECKPOINT,
  DocumentCategory.BAREM,
  DocumentCategory.STUDENT_BOOK,
];