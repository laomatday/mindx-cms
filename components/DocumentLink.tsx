import React, { useContext, useCallback, memo } from 'react';
import { Document, ParentId, LevelName } from '../types';
import { DocumentIcon } from './icons';
import { DOCUMENT_NAMES, UI_STRINGS } from '../constants';
import { AppContext } from '../context/AppContext';
import { Pencil, Trash2, GripVertical } from 'lucide-react';

interface DocumentLinkProps {
  document: Document;
  parentId: ParentId;
  onEdit: (doc: Document) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

// A regex to robustly identify Google Drive file links
const isGoogleDriveFileRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)/;

/**
 * Component DocumentLink hiển thị một liên kết đến một tài liệu.
 * Nó cũng bao gồm các nút điều khiển (sửa, xóa) cho quản trị viên (admin)
 * và một tay cầm để kéo-thả.
 */
export const DocumentLink: React.FC<DocumentLinkProps> = memo(({ document, parentId, onEdit, isDragging, isDragOver, onDragStart, onDragEnter, onDragEnd }) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { currentUser, deleteDocument, viewDocument, data } = context;
  const isAdmin = currentUser?.role === 'admin';

  // Hàm xử lý khi admin nhấn nút xóa.
  // `useCallback` để tối ưu hóa, tránh tạo lại hàm không cần thiết.
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn thẻ `<a>` điều hướng.
    e.stopPropagation(); // Ngăn sự kiện click lan ra các phần tử cha.
    if (window.confirm(UI_STRINGS.deleteConfirmation)) {
        deleteDocument(parentId, document.id);
    }
  }, [deleteDocument, parentId, document.id]);
  
  // Hàm xử lý khi admin nhấn nút sửa.
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(document);
  }, [onEdit, document]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAdmin && isDragging) {
        e.preventDefault();
        return;
    }
    // Check if the URL is a Google Drive file link, regardless of the stored `source`.
    // This makes the behavior more consistent even if data is saved incorrectly.
    if (isGoogleDriveFileRegex.test(document.url)) {
      e.preventDefault();
      
      let pathName: string | undefined;
      let courseName: string | undefined;
      let levelName: LevelName | undefined;

      if (parentId.pathId && data) {
          const path = data.find(p => p.id === parentId.pathId);
          pathName = path?.name;
          if (parentId.courseId) {
              const course = path?.courses.find(c => c.id === parentId.courseId);
              courseName = course?.name;
              if (parentId.levelId) {
                  const level = course?.levels.find(l => l.id === parentId.levelId);
                  levelName = level?.name;
              }
          }
      }

      viewDocument({ 
          url: document.url, 
          name: DOCUMENT_NAMES[document.category] || document.name,
          pathName,
          courseName,
          levelName,
      });
    }
    // For other links, the default behavior of the anchor tag will apply.
  }, [isAdmin, isDragging, document, viewDocument, parentId, data]);

  // Determine if the link should open in a new tab. It should if it's not a Google Drive link that we intend to embed.
  const openInNewTab = !isGoogleDriveFileRegex.test(document.url);

  // Các lớp CSS cho container bọc ngoài, xử lý UI cho việc kéo-thả
  const wrapperClasses = [
    'relative group',
    isDragOver ? 'pl-1' : '',
  ].join(' ');

  // Các lớp CSS cho thẻ `<a>` chính, được tạo kiểu như một thẻ tab/badge.
  const linkClasses = [
      "relative flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-inner",
      "bg-gray-100 dark:bg-gray-700",
      "text-[#313131] dark:text-gray-200",
      "hover:bg-gray-200 dark:hover:bg-gray-600",
      isDragging ? "opacity-40 shadow-lg" : "opacity-100",
      isDragOver ? "border-l-2 border-[#E31F26]" : ""
  ].join(" ");
  
  return (
    <div 
      className={wrapperClasses}
      draggable={isAdmin}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
    >
      <a
        href={document.url}
        target={openInNewTab ? '_blank' : undefined}
        rel="noopener noreferrer"
        onClick={handleClick}
        className={linkClasses}
      >
        {/* Biểu tượng kéo-thả, chỉ hiển thị cho admin */}
        {isAdmin && <GripVertical size={16} className="opacity-60 flex-shrink-0 cursor-grab" />}
        
        {/* Biểu tượng của loại tài liệu */}
        <DocumentIcon category={document.category} className="w-5 h-5 opacity-80 flex-shrink-0" />
        
        {/* Tên tài liệu */}
        <span className="truncate flex-1 min-w-0">
          {DOCUMENT_NAMES[document.category] || document.name}
        </span>
        
        {/* Các nút điều khiển Sửa/Xóa, chỉ hiển thị cho admin và khi hover */}
        {isAdmin && (
          <div className="absolute top-1/2 -translate-y-1/2 right-1.5 flex items-center gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full p-0.5 z-10">
            <button onClick={handleEdit} className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-current" aria-label={UI_STRINGS.edit}>
              <Pencil size={12} />
            </button>
            <button onClick={handleDelete} className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full text-current" aria-label={UI_STRINGS.delete}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </a>
    </div>
  );
});