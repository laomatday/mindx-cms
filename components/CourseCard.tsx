
import React, { useContext, useCallback, memo } from 'react';
import { AppContext } from '../context/AppContext';
import { UI_STRINGS } from '../constants';
import { Course, ParentId, ItemType, EditableItem } from '../types';
import { Pencil, Trash2, Calendar, Users, ArrowRight } from 'lucide-react';
import { Badge } from './common/Badge';
import { MarkdownRenderer } from './common/MarkdownRenderer';

interface CourseCardProps {
  course: Course;
  pathId: string;
  onEdit: (item: EditableItem, type: ItemType, parentId: ParentId) => void;
}

/**
 * Component PlaceholderImage tạo ra một hình ảnh gradient làm ảnh đại diện mặc định
 * cho các khóa học không có `imageUrl`.
 * Màu gradient được chọn một cách ngẫu nhiên nhưng nhất quán dựa trên ID của khóa học.
 */
const PlaceholderImage = memo(({ courseId }: { courseId: string }) => {
  const gradients = [
    'from-blue-400 to-cyan-300 dark:from-blue-900/70 dark:to-cyan-800/70',
    'from-red-400 to-orange-300 dark:from-red-900/70 dark:to-orange-800/70',
    'from-green-400 to-teal-300 dark:from-green-900/70 dark:to-teal-800/70',
    'from-purple-400 to-indigo-300 dark:from-purple-900/70 dark:to-indigo-800/70',
    'from-pink-400 to-rose-300 dark:from-pink-900/70 dark:to-rose-800/70',
  ];
  // Chọn một gradient dựa trên ký tự cuối của courseId để đảm bảo mỗi card có màu khác nhau nhưng ổn định.
  const index = (courseId.charCodeAt(courseId.length - 1) || 0) % gradients.length;
  return <div className={`h-48 w-full bg-gradient-to-br ${gradients[index]}`} />;
});

export const CourseCard: React.FC<CourseCardProps> = memo(({ course, pathId, onEdit }) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { navigate, currentUser, deleteCourse } = context;
  const isAdmin = currentUser?.role === 'admin';

  const handleSelect = useCallback(() => navigate(pathId, course.id), [navigate, pathId, course.id]);
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(UI_STRINGS.deleteConfirmation)) {
      deleteCourse(pathId, course.id);
    }
  }, [deleteCourse, pathId, course.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(course, 'course', { pathId });
  }, [onEdit, course, pathId]);

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-black/5 dark:border-white/5 rounded-2xl md:hover:-translate-y-1 transition-transform duration-300 shadow-lg shadow-gray-400/10 dark:shadow-black/20 hover:shadow-xl flex flex-col h-full overflow-hidden group">
      <button onClick={handleSelect} className="relative w-full block">
        {course.imageUrl ? (
          <img src={course.imageUrl} alt={course.name} className="h-48 w-full object-cover" />
        ) : (
          <PlaceholderImage courseId={course.id} />
        )}
      </button>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold mb-2 text-[#E31F26]">
            {course.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge colorScheme="red" icon={Calendar}>Năm {course.year}</Badge>
          <Badge colorScheme="blue" icon={Users}>Tuổi {course.ageGroup}</Badge>
        </div>

        <div className="flex-grow">
            <MarkdownRenderer text={course.content} as="p" className="opacity-80" />
        </div>
        
        <div className="mt-auto pt-5 border-t border-black/5 dark:border-white/10 flex justify-between items-center">
          <button onClick={handleSelect} className="flex items-center gap-2 font-bold text-[#E31F26] group-hover:underline">
            Xem chi tiết <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button onClick={handleEdit} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" aria-label={UI_STRINGS.edit}><Pencil size={16} /></button>
              <button onClick={handleDelete} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-red-500" aria-label={UI_STRINGS.delete}><Trash2 size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
