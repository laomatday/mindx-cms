import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { UI_STRINGS } from '../constants';
import { Course, ParentId, ItemType, EditableItem } from '../types';
import { DocumentLink } from './DocumentLink';
import { PlusCircle, ArrowLeft, Files, Pencil, Trash2 } from 'lucide-react';
import { HomePage } from './HomePage';
import { EmptyState } from './common/EmptyState';
import { CourseCard } from './CourseCard';
import { CourseDetailView } from './CourseDetailView';
import { Skeleton } from './common/Skeleton';
import { PDFViewer } from './PDFViewer';

// Component hiển thị khung xương (skeleton) cho danh sách khóa học khi đang tải dữ liệu.
// Cung cấp trải nghiệm người dùng tốt hơn thay vì một màn hình trắng.
const CourseListSkeleton = () => (
    <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col">
          <Skeleton className="h-48" />
          <div className="p-6 flex flex-col flex-grow">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <div className="mt-auto pt-5 border-t border-black/5 dark:border-white/10">
                <Skeleton className="h-6 w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

// Component chính hiển thị nội dung, thay đổi tùy theo lựa chọn của người dùng.
// Nó hoạt động như một "router" đơn giản, quyết định hiển thị trang chủ,
// danh sách khóa học, hoặc chi tiết một khóa học.
export const MainContent: React.FC = () => {
  const context = useContext(AppContext);
  
  // Lấy các giá trị cần thiết từ context. Các hooks phải được gọi ở cấp cao nhất.
  const { navigate, data, loading, selectedPathId, selectedCourseId, currentUser, goBack, showCreationWizard, deleteLearningPath, activeDocument, closeDocument } = context ?? {};
  
  // Hàm callback để quay về trang chủ.
  const handleBackToHome = useCallback(() => {
    if (navigate) {
      navigate(null, null);
    }
  }, [navigate]);

  if (!context) return null; // Guard clause

  const isAdmin = currentUser?.role === 'admin';

  // Hàm để mở wizard TẠO MỚI hoặc CHỈNH SỬA.
  const handleEdit = useCallback((item: EditableItem, type: ItemType, parentId: ParentId = {}) => {
      if (showCreationWizard) {
        showCreationWizard(type, parentId, item);
      }
  }, [showCreationWizard]);

  const handleDeletePath = useCallback((pathId: string) => {
    if (window.confirm(UI_STRINGS.deleteConfirmation) && deleteLearningPath) {
      deleteLearningPath(pathId);
    }
  }, [deleteLearningPath]);

  // --- Logic hiển thị theo thứ tự ưu tiên ---
  
  // 1. Hiển thị PDF Viewer nếu một tài liệu đang được xem.
  if (activeDocument) {
    return (
        <PDFViewer 
            url={activeDocument.url} 
            name={activeDocument.name} 
            onClose={closeDocument!}
            pathName={activeDocument.pathName}
            courseName={activeDocument.courseName}
            levelName={activeDocument.levelName}
        />
    );
  }

  // 2. Hiển thị skeleton khi đang tải dữ liệu lần đầu.
  if (loading) {
    return (
      <main className="flex-1 p-6 sm:p-10 lg:p-14">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-12 w-3/5 mb-10" />
          <CourseListSkeleton />
        </div>
      </main>
    );
  }

  // 3. Hiển thị trang chủ nếu không có lộ trình nào được chọn.
  if (!selectedPathId) {
    return <HomePage />;
  }
  
  const selectedPath = data.find(p => p.id === selectedPathId);

  // 4. Xử lý trường hợp ID lộ trình không hợp lệ (ví dụ: đã bị xóa nhưng còn trong localStorage).
  if (!selectedPath) {
    // Điều này có thể xảy ra nếu ID trong localStorage đã cũ.
    // Effect trong context sẽ xóa nó, nhưng điều này ngăn chặn crash trước khi effect chạy.
    return (
      <main className="flex-1 p-6 sm:p-10 lg:p-14">
        <EmptyState message="Lộ trình học không tồn tại hoặc đã bị xóa." />
      </main>
    );
  }
  
  const selectedCourse = selectedPath.courses.find(c => c.id === selectedCourseId);

  // 5. Hiển thị chi tiết khóa học nếu một khóa học được chọn.
  if (selectedCourse) {
    return (
      <CourseDetailView 
        course={selectedCourse} 
        path={selectedPath}
        onEdit={handleEdit}
        onClose={goBack}
      />
    );
  }
  
  // 6. Mặc định: Hiển thị danh sách các khóa học trong lộ trình đã chọn.
  const courses = selectedPath.courses;

  return (
    <main className="flex-1 p-6 sm:p-10 lg:p-14">
      <div className="max-w-7xl mx-auto">
        {/* Header của trang danh sách khóa học */}
        <div className="mb-10">
            {/* Nút quay lại */}
            <button onClick={handleBackToHome} className="flex items-center gap-2 hover:text-[#E31F26] mb-4 font-bold transition-colors">
              <ArrowLeft size={20} />
              Trở về {UI_STRINGS.home}
            </button>
            {/* Tiêu đề và nút "Thêm khóa học" cho admin */}
            <div className="flex flex-wrap justify-between items-start gap-4">
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#E31F26]">{selectedPath.name}</h2>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(selectedPath, 'learningPath')} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" aria-label={UI_STRINGS.edit}><Pencil size={20} /></button>
                        <button onClick={() => handleDeletePath(selectedPath.id)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-red-500" aria-label={UI_STRINGS.delete}><Trash2 size={20} /></button>
                    </div>
                )}
            </div>
        </div>
        
        {/* Hiển thị tài liệu của lộ trình */}
        { (selectedPath.documents.length > 0 || isAdmin) &&
          <section className="mb-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl flex items-center gap-3">
                    <Files size={22} /> Tài liệu lộ trình
                </h3>
                {isAdmin && (
                    <button onClick={() => showCreationWizard!('document', {pathId: selectedPath.id})} className="flex items-center gap-1 text-sm text-[#E31F26] hover:underline">
                        <PlusCircle size={16}/>{UI_STRINGS.addDocument}
                    </button>
                )}
              </div>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(192px,1fr))]">
                  {selectedPath.documents.map(doc => <DocumentLink key={doc.id} document={doc} parentId={{pathId: selectedPath.id}} onEdit={(d) => handleEdit(d, 'document', {pathId: selectedPath.id})}/>)}
              </div>
          </section>
        }

        {/* Danh sách các thẻ khóa học */}
        {courses.length > 0 ? (
        <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {courses.map((course) => <CourseCard key={course.id} course={course} pathId={selectedPath.id} onEdit={handleEdit} />)}
        </div>
        ) : (
        <EmptyState message="Chưa có khóa học nào trong lộ trình này." />
        )}
      </div>
    </main>
  );
};