// Định nghĩa các lộ trình học (Learning Path) dưới dạng enum để đảm bảo tính nhất quán.
export enum LearningPathName {
  CODING_AI = 'Coding & AI',
  ART_DESIGN = 'Art & Design',
  ROBOTICS = 'Robotics',
}

// Định nghĩa các cấp độ học (Level)
export enum LevelName {
  BASIC = 'Cơ bản',
  ADVANCED = 'Nâng cao',
  INTENSIVE = 'Chuyên sâu',
}

// Định nghĩa các loại tài liệu (Document Category)
export enum DocumentCategory {
  ROADMAP = 'Roadmap',
  SYLLABUS = 'Syllabus',
  TRIAL = 'Trial',
  LESSON_PLAN = 'Lesson Plan',
  TEACHING_GUIDE = 'Teaching Guide',
  SLIDE = 'Slide',
  PROJECT = 'Project',
  HOMEWORK = 'Homework',
  CHECKPOINT = 'Checkpoint',
  STUDENT_BOOK = 'Student Book',
}

// --- Các Interface cho cấu trúc dữ liệu lồng nhau (dùng cho UI) ---

// Interface cho một tài liệu
export interface Document {
  id: string;
  category: DocumentCategory;
  name: string;
  url: string;
  pathId?: string;
  courseId?: string;
  levelId?: string;
}

// Interface cho một cấp độ học
export interface Level {
  id:string;
  name: LevelName;
  content: string; // Nội dung chính của cấp độ
  objectives: string; // Mục tiêu học tập của cấp độ
  documents: Document[]; // Danh sách các tài liệu thuộc cấp độ này
}

// Interface cho một khóa học
export interface Course {
  id:string;
  name: string;
  year: number; // Thuộc năm thứ mấy trong lộ trình
  ageGroup: string; // Nhóm tuổi phù hợp
  language?: string; // Ngôn ngữ lập trình (nếu có)
  tools?: string[]; // Các công cụ sử dụng (nếu có)
  content: string; // Nội dung chính của khóa học
  objectives: string; // Mục tiêu của khóa học
  levels: Level[]; // Danh sách các cấp độ trong khóa học
  documents: Document[]; // Danh sách các tài liệu thuộc khóa học này
  imageUrl?: string; // URL hình ảnh đại diện cho khóa học
}

// Interface cho một lộ trình học
export interface LearningPath {
  id: string;
  name: LearningPathName;
  courses: Course[]; // Danh sách các khóa học trong lộ trình
  documents: Document[]; // Danh sách các tài liệu thuộc lộ trình này
}

// Interface cho thông tin người dùng
export interface User {
  username: string; // Sẽ chứa email của người dùng sau khi đăng nhập bằng Firebase
  role: 'admin' | 'user'; // Vai trò: 'admin' có quyền chỉnh sửa, 'user' chỉ có quyền xem
}


// --- Các Type hỗ trợ cho việc chỉnh sửa và quản lý state ---

// Type đại diện cho một mục có thể được chỉnh sửa (khóa học, cấp độ, tài liệu, lộ trình)
export type EditableItem = Course | Level | Document | LearningPath;
// Type xác định loại của một mục đang được chỉnh sửa
export type ItemType = 'course' | 'level' | 'document' | 'learningPath';
// Type chứa ID của các mục cha, giúp xác định vị trí của một mục trong cây dữ liệu
export type ParentId = {pathId: string, courseId?: string, levelId?: string};

// Interface cho kết quả tìm kiếm
export interface SearchResult {
  id: string;
  type: 'course' | 'document';
  name: string;
  context: string; // Ngữ cảnh hiển thị (ví dụ: "Coding & AI > Scratch Creator")
  pathId: string;
  courseId?: string;
  url?: string;
}

// --- Các Interface cho cấu trúc dữ liệu được chuẩn hóa (Normalized) ---
// Cách tiếp cận này giống như trong Redux, giúp quản lý state hiệu quả hơn.
// Dữ liệu được làm phẳng, tránh lồng nhau sâu, giúp việc cập nhật dễ dàng và hiệu suất cao hơn.

// Lộ trình học đã được chuẩn hóa: thay vì chứa mảng `courses` và `documents`, nó chứa mảng các ID.
export interface NormalizedLearningPath extends Omit<LearningPath, 'courses' | 'documents'> {
  courseIds: string[];
  documentIds: string[];
}
// Khóa học đã được chuẩn hóa
export interface NormalizedCourse extends Omit<Course, 'levels' | 'documents'> {
  pathId: string;
  levelIds: string[];
  documentIds: string[];
}
// Cấp độ đã được chuẩn hóa
export interface NormalizedLevel extends Omit<Level, 'documents'> {
  courseId: string;
  documentIds: string[];
}

// Cấu trúc tổng thể của dữ liệu CMS đã được chuẩn hóa
export interface CmsData {
  entities: {
    learningPaths: Record<string, NormalizedLearningPath>;
    courses: Record<string, NormalizedCourse>;
    levels: Record<string, NormalizedLevel>;
    documents: Record<string, Document>;
  };
  root: string[]; // Mảng chứa ID của các learningPath ở cấp cao nhất
}

// Interface định nghĩa các giá trị và hàm mà AppContext sẽ cung cấp cho toàn ứng dụng
export interface AppContextType {
  data: LearningPath[]; // Dữ liệu đã được tái cấu trúc (denormalized) để UI sử dụng
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  selectedPathId: string | null;
  selectedCourseId: string | null;
  navigate: (pathId: string | null, courseId: string | null) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;

  // Các hàm CRUD (Create, Read, Update, Delete)
  addCourse: (pathId: string, courseData: Omit<Course, 'id' | 'levels' | 'documents'>) => Promise<void>;
  updateCourse: (pathId: string, courseId: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (pathId: string, courseId: string) => Promise<void>;
  
  addLevel: (pathId: string, courseId: string, levelData: Omit<Level, 'id' | 'documents'>) => Promise<void>;
  updateLevel: (pathId: string, courseId: string, levelId: string, updates: Partial<Level>) => Promise<void>;
  deleteLevel: (pathId: string, courseId: string, levelId: string) => Promise<void>;
  
  addDocument: (parentId: ParentId, documentData: Omit<Document, 'id'>) => Promise<void>;
  updateDocument: (parentId: ParentId, documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (parentId: ParentId, documentId: string) => Promise<void>;
  reorderDocuments: (parentId: ParentId, orderedIds: string[]) => Promise<void>;

  // Chức năng thông báo (Toast)
  toast: string | null;
  showToast: (message: string) => void;
  
  // Trạng thái tải dữ liệu ban đầu của ứng dụng
  loading?: boolean;
}