

import React, { useContext, useState, useCallback, memo, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Course, LearningPath, Level, EditableItem, ItemType, ParentId, Document, LevelName } from '../types';
import { UI_STRINGS } from '../constants';
import { DocumentLink } from './DocumentLink';
import { Badge } from './common/Badge';
import { Pencil, Trash2, PlusCircle, Calendar, Users, Wrench, Code, ArrowLeft, BookOpen, CheckCircle, Files, List, BarChart3, Zap, FileText } from 'lucide-react';
import { MarkdownRenderer } from './common/MarkdownRenderer';

// --- Reusable Child Components ---

const levelIcons: Record<LevelName, React.ElementType> = {
    [LevelName.BASIC]: List,
    [LevelName.ADVANCED]: BarChart3,
    [LevelName.INTENSIVE]: Zap,
};

const CourseDetailHeader: React.FC<{
  course: Course;
  pathName: string;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = memo(({ course, pathName, isAdmin, onClose, onEdit, onDelete }) => (
  <>
    <div className="flex justify-between items-start gap-4 mb-4">
      <div>
        <button onClick={onClose} className="flex items-center gap-2 hover:text-[#E31F26] mb-4 font-bold transition-colors">
          <ArrowLeft size={20} />
          Trở về {pathName}
        </button>
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#E31F26]">{course.name}</h2>
      </div>
      {isAdmin && (
        <div className="flex-shrink-0 flex items-center gap-2 mt-16">
          <button onClick={onEdit} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" aria-label={UI_STRINGS.edit}><Pencil size={20} /></button>
          <button onClick={onDelete} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-red-500" aria-label={UI_STRINGS.delete}><Trash2 size={20} /></button>
        </div>
      )}
    </div>

    <div className="flex items-center flex-wrap gap-2 mb-12">
      <Badge colorScheme="red" icon={Calendar}>Năm {course.year}</Badge>
      <Badge colorScheme="blue" icon={Users}>Tuổi {course.ageGroup}</Badge>
      {course.language && <Badge colorScheme="green" icon={Code}>{course.language}</Badge>}
      {course.tools?.map(tool => <Badge key={tool} colorScheme="yellow" icon={Wrench}>{tool}</Badge>)}
    </div>
  </>
));

interface DraggableProps {
    draggedDocId: string | null;
    dragOverDocId: string | null;
    handleDragStart: (e: React.DragEvent, doc: Document, parentId: ParentId) => void;
    handleDragEnter: (e: React.DragEvent, doc: Document) => void;
    handleDragEnd: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent, parentId: ParentId) => void;
}

// --- Main Component ---
interface CourseDetailViewProps {
    course: Course;
    path: LearningPath;
    onEdit: (item: EditableItem | null, type: ItemType, parentId: ParentId) => void;
    onClose: () => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, path, onEdit, onClose }) => {
    const context = useContext(AppContext);
    
    // State and handlers for drag & drop functionality
    const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
    const [dragOverDocId, setDragOverDocId] = useState<string | null>(null);
    const draggedParentIdRef = useRef<ParentId | null>(null);

    const { currentUser, deleteCourse, deleteLevel, reorderDocuments } = context ?? {};
    const isAdmin = currentUser?.role === 'admin';
    
    const sortedLevels = [...course.levels].sort((a,b) => Object.values(LevelName).indexOf(a.name) - Object.values(LevelName).indexOf(b.name));
    
    const [activeLevelId, setActiveLevelId] = useState<string | null>(sortedLevels[0]?.id || null);
    const [activeInfoTab, setActiveInfoTab] = useState<'overview' | 'documents'>('overview');


    useEffect(() => {
        // Reset active level if the course changes or levels are updated
        if (sortedLevels.length > 0 && !sortedLevels.find(l => l.id === activeLevelId)) {
            setActiveLevelId(sortedLevels[0].id);
        } else if (sortedLevels.length === 0) {
            setActiveLevelId(null);
        }
    }, [course.id, sortedLevels, activeLevelId]);


    const handleDragStart = useCallback((e: React.DragEvent, doc: Document, parentId: ParentId) => {
        setDraggedDocId(doc.id);
        draggedParentIdRef.current = parentId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', doc.id);
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent, doc: Document) => {
        e.preventDefault();
        setDragOverDocId(doc.id);
    }, []);
    
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDraggedDocId(null);
        setDragOverDocId(null);
        draggedParentIdRef.current = null;
    }, []);
    
    const handleDrop = useCallback((e: React.DragEvent, targetParentId: ParentId) => {
        e.preventDefault();
        const draggedId = draggedDocId;
        const targetId = dragOverDocId;
        const sourceParentId = draggedParentIdRef.current;

        if (!draggedId || !targetId || !sourceParentId || !reorderDocuments) return;
        if (JSON.stringify(sourceParentId) !== JSON.stringify(targetParentId)) {
            // Drag and drop between different parents is not supported in this implementation
            return;
        }

        const findParentDocs = (parentId: ParentId): Document[] | undefined => {
            if(parentId.levelId) return course.levels.find(l => l.id === parentId.levelId)?.documents;
            if(parentId.courseId) return course.documents;
            return path.documents;
        }

        const documents = findParentDocs(targetParentId);
        if (!documents) return;

        const originalIds = documents.map(d => d.id);
        const draggedIndex = originalIds.indexOf(draggedId);
        const targetIndex = originalIds.indexOf(targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newIds = [...originalIds];
        const [movedItem] = newIds.splice(draggedIndex, 1);
        newIds.splice(targetIndex, 0, movedItem);

        reorderDocuments(targetParentId, newIds);
        setDraggedDocId(null);
        setDragOverDocId(null);
    }, [draggedDocId, dragOverDocId, reorderDocuments, course, path]);

    const handleDeleteCourse = useCallback(() => {
        if (window.confirm(UI_STRINGS.deleteConfirmation) && deleteCourse) {
            deleteCourse(path.id, course.id);
            onClose(); // Navigate back after deletion
        }
    }, [deleteCourse, path.id, course.id, onClose]);
    
    const handleDeleteLevel = useCallback((levelId: string) => {
        if (window.confirm(UI_STRINGS.deleteConfirmation) && deleteLevel) {
            deleteLevel(path.id, course.id, levelId);
        }
    }, [deleteLevel, path.id, course.id]);

    const dragProps: DraggableProps = {
        draggedDocId, dragOverDocId, handleDragStart, handleDragEnter, handleDragEnd, handleDrop
    };

    const activeLevel = sortedLevels.find(l => l.id === activeLevelId);

    return (
        <main className="flex-1 p-4 sm:p-8 lg:p-12 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto">
                <CourseDetailHeader
                    course={course}
                    pathName={path.name}
                    isAdmin={!!isAdmin}
                    onClose={onClose}
                    onEdit={() => onEdit(course, 'course', { pathId: path.id })}
                    onDelete={handleDeleteCourse}
                />
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Left Card: Course Info with Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 flex flex-col shadow-lg">
                        <div className="flex border-b border-black/10 dark:border-white/10 p-2 gap-2">
                             <button 
                                key="overview" 
                                onClick={() => setActiveInfoTab('overview')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                                    ${activeInfoTab === 'overview' ? 'bg-red-50 dark:bg-red-900/40 text-[#E31F26] shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                            >
                                <BookOpen size={16} />
                                <span>Tổng quan khóa học</span>
                            </button>
                            {(course.documents.length > 0 || isAdmin) && (
                                <button 
                                    key="documents" 
                                    onClick={() => setActiveInfoTab('documents')}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                                        ${activeInfoTab === 'documents' ? 'bg-red-50 dark:bg-red-900/40 text-[#E31F26] shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                >
                                    <Files size={16} />
                                    <span>Tài liệu liên quan</span>
                                </button>
                            )}
                        </div>

                        <div className="p-8 flex-grow">
                            {activeInfoTab === 'overview' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                            <BookOpen size={22} /> {UI_STRINGS.courseContent}
                                        </h3>
                                        <MarkdownRenderer text={course.content} as="p" className="mt-2" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                            <CheckCircle size={22} /> {UI_STRINGS.courseObjectives}
                                        </h3>
                                        <MarkdownRenderer text={course.objectives} as="p" className="mt-2" />
                                    </div>
                                </div>
                            )}
                             {activeInfoTab === 'documents' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                            <Files size={22} /> {UI_STRINGS.documents}
                                        </h3>
                                        {isAdmin && (
                                            <button onClick={() => onEdit(null, 'document', { pathId: path.id, courseId: course.id })} className="flex items-center gap-1 text-sm text-[#E31F26] hover:underline">
                                                <PlusCircle size={16}/>{UI_STRINGS.addDocument}
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid gap-3" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(192px, 1fr))'}} onDrop={(e) => dragProps.handleDrop(e, { pathId: path.id, courseId: course.id })} onDragOver={(e) => e.preventDefault()}>
                                        {course.documents.map(doc => (
                                            <DocumentLink 
                                                key={doc.id}
                                                document={doc}
                                                parentId={{ pathId: path.id, courseId: course.id }}
                                                onEdit={(d) => onEdit(d, 'document', { pathId: path.id, courseId: course.id })}
                                                isDragging={dragProps.draggedDocId === doc.id}
                                                isDragOver={dragProps.dragOverDocId === doc.id}
                                                onDragStart={(e) => dragProps.handleDragStart(e, doc, { pathId: path.id, courseId: course.id })}
                                                onDragEnter={(e) => dragProps.handleDragEnter(e, doc)}
                                                onDragEnd={dragProps.handleDragEnd}
                                            />
                                        ))}
                                    </div>
                                    {course.documents.length === 0 && <p className="text-sm opacity-60">Chưa có tài liệu nào cho khóa học này.</p>}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Right Card: Levels Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-black/5 dark:border-white/10 flex flex-col shadow-lg">
                        {/* Level Tabs */}
                        <div className="flex border-b border-black/10 dark:border-white/10 p-2 gap-2">
                             {sortedLevels.map(level => {
                                const Icon = levelIcons[level.name] || FileText;
                                const isActive = activeLevelId === level.id;
                                return (
                                    <button 
                                        key={level.id} 
                                        onClick={() => setActiveLevelId(level.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                                            ${isActive ? 'bg-red-50 dark:bg-red-900/40 text-[#E31F26] shadow-inner' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                    >
                                        <Icon size={16} />
                                        <span>{level.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Active Level Content */}
                        <div className="p-8 flex-grow">
                            {activeLevel ? (
                                <div className="space-y-8">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                                <BookOpen size={20} />
                                                {UI_STRINGS.levelContent}
                                            </h3>
                                            {isAdmin && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => onEdit(activeLevel, 'level', {pathId: path.id, courseId: course.id})} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" aria-label={UI_STRINGS.edit}><Pencil size={16} /></button>
                                                    <button onClick={() => handleDeleteLevel(activeLevel.id)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-red-500" aria-label={UI_STRINGS.delete}><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </div>
                                        <MarkdownRenderer text={activeLevel.content} as="p" className="mt-2" />
                                    </div>
                                    
                                    <div>
                                      <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                          <CheckCircle size={20} />
                                          {UI_STRINGS.levelObjectives}
                                      </h3>
                                      <MarkdownRenderer text={activeLevel.objectives} as="p" className="mt-2" />
                                    </div>

                                    {(activeLevel.documents.length > 0 || isAdmin) && (
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-xl flex items-center gap-3 text-[#E31F26]">
                                                    <Files size={20} /> {UI_STRINGS.documents}
                                                </h3>
                                                {isAdmin && (
                                                    <button onClick={() => onEdit(null, 'document', { pathId: path.id, courseId: course.id, levelId: activeLevel.id })} className="flex items-center gap-1 text-sm text-[#E31F26] hover:underline">
                                                        <PlusCircle size={16}/>{UI_STRINGS.addDocument}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid gap-3" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(192px, 1fr))'}} onDrop={(e) => dragProps.handleDrop(e, { pathId: path.id, courseId: course.id, levelId: activeLevel.id })} onDragOver={(e) => e.preventDefault()}>
                                                {activeLevel.documents.map(doc => (
                                                    <DocumentLink
                                                        key={doc.id}
                                                        document={doc}
                                                        parentId={{ pathId: path.id, courseId: course.id, levelId: activeLevel.id }}
                                                        onEdit={(d) => onEdit(d, 'document', { pathId: path.id, courseId: course.id, levelId: activeLevel.id })}
                                                        isDragging={dragProps.draggedDocId === doc.id}
                                                        isDragOver={dragProps.dragOverDocId === doc.id}
                                                        onDragStart={(e) => dragProps.handleDragStart(e, doc, { pathId: path.id, courseId: course.id, levelId: activeLevel.id })}
                                                        onDragEnter={(e) => dragProps.handleDragEnter(e, doc)}
                                                        onDragEnd={dragProps.handleDragEnd}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-center opacity-70">Chưa có cấp độ nào cho khóa học này.</p>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="p-4 border-t border-black/10 dark:border-white/10">
                                <button onClick={() => onEdit(null, 'level', { pathId: path.id, courseId: course.id })} className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold py-2.5 px-5 rounded-lg transition-colors">
                                    <PlusCircle size={20}/>
                                    {UI_STRINGS.addLevel}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};