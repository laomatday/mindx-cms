

import React from 'react';
import {
  Map,
  BookOpen,
  PlayCircle,
  ClipboardList,
  BookUser,
  Presentation,
  Package,
  NotebookPen,
  Target,
  Book,
  GraduationCap,
} from 'lucide-react';
import { DocumentCategory } from '../types';

// `iconMap` là một đối tượng ánh xạ mỗi loại tài liệu (DocumentCategory)
// với một component Icon tương ứng từ thư viện `lucide-react`.
// Điều này cho phép chúng ta hiển thị một biểu tượng trực quan cho mỗi loại tài liệu.
const iconMap: Record<DocumentCategory, React.ElementType> = {
  [DocumentCategory.ROADMAP]: Map,
  [DocumentCategory.SYLLABUS]: BookOpen,
  [DocumentCategory.TRIAL]: PlayCircle,
  [DocumentCategory.LESSON_PLAN]: ClipboardList,
  [DocumentCategory.TEACHING_GUIDE]: BookUser,
  [DocumentCategory.SLIDE]: Presentation,
  [DocumentCategory.PROJECT]: Package,
  [DocumentCategory.HOMEWORK]: NotebookPen,
  [DocumentCategory.CHECKPOINT]: Target,
  [DocumentCategory.STUDENT_BOOK]: Book,
  [DocumentCategory.BAREM]: GraduationCap,
};

interface DocumentIconProps {
  category: DocumentCategory;
  className?: string;
}

/**
 * Component DocumentIcon chịu trách nhiệm hiển thị một icon
 * dựa trên loại (category) của tài liệu được truyền vào.
 * @param {DocumentCategory} category - Loại tài liệu.
 * @param {string} [className] - Các lớp CSS tùy chỉnh cho icon.
 */
export const DocumentIcon: React.FC<DocumentIconProps> = ({ category, className }) => {
  // Lấy component Icon tương ứng từ `iconMap`.
  const IconComponent = iconMap[category];
  // Render component Icon đó với các props đã cho.
  return <IconComponent className={className || 'w-5 h-5'} />;
};