import React, { useState, useContext, useEffect, useCallback, memo } from 'react';
import { AppContext } from '../context/AppContext';
import { UI_STRINGS, DOCUMENT_NAMES, COURSE_DOCUMENT_CATEGORIES, LEVEL_DOCUMENT_CATEGORIES } from '../constants';
import { DocumentCategory, LevelName, ParentId, LearningPath, Course, Document, CreationType } from '../types';
import { X, ArrowLeft, ArrowRight, Check, PlusCircle, Trash2, ChevronDown, BookOpen, CheckCircle, Files, Image as ImageIcon } from 'lucide-react';
import { DocumentIcon } from './icons';

const commonInputClass = "w-full px-4 py-3 border border-gray-300/80 dark:border-gray-600/80 rounded-lg bg-gray-100 dark:bg-gray-800/80 focus:border-[#E31F26] focus:ring-0 outline-none transition";

// --- Form Field Components ---
const InputField = memo((props: {name: string, label: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, type?: string}) => (
    <div>
        <label className="block text-lg font-semibold mb-2" htmlFor={props.name}>{props.label}</label>
        <input {...props} id={props.name} value={props.value || ''} className={commonInputClass} />
    </div>
));

const TextareaField = memo((props: {name: string, label: string, value: string, onChange: any, required?: boolean}) => (
    <div>
        <label className="block text-lg font-semibold mb-2" htmlFor={props.name}>{props.label}</label>
        <textarea {...props} id={props.name} rows={5} className={`${commonInputClass} min-h-[120px]`} />
    </div>
));

const SelectField = memo((props: {name: string, label: string, value: string, onChange: any, children: React.ReactNode, required?: boolean}) => (
    <div className="relative">
        <label className="block text-lg font-semibold mb-2" htmlFor={props.name}>{props.label}</label>
        <select {...props} id={props.name} className={`${commonInputClass} appearance-none pr-10`}>
            {props.children}
        </select>
        <ChevronDown className="absolute right-3 top-12 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
));


// --- Document List Component for Wizards ---
const DocumentListEditor = ({ docValues, setDocValues, creationType }: {
    docValues: Record<string, { url: string; source: Document['source'] }>;
    setDocValues: (category: DocumentCategory, field: 'url' | 'source', value: string) => void;
    creationType: 'course' | 'level';
}) => {
    
    const availableCategories = creationType === 'course' ? COURSE_DOCUMENT_CATEGORIES : LEVEL_DOCUMENT_CATEGORIES;

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-3">
                <Files size={22} /> Tài liệu đính kèm
            </h3>
             <p className="text-gray-600 dark:text-gray-400">Điền URL cho các tài liệu bạn muốn thêm. Các ô trống sẽ được bỏ qua.</p>
            <div className="space-y-4">
                {availableCategories.map(category => (
                     <div key={category} className="grid grid-cols-1 md:grid-cols-[220px,180px,1fr] items-center gap-4 p-3 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg">
                        {/* Col 1: Label */}
                        <label htmlFor={`doc-url-${category}`} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            <DocumentIcon category={category} className="w-5 h-5 flex-shrink-0" />
                            <span className="truncate">{DOCUMENT_NAMES[category]}</span>
                        </label>

                        {/* Col 2: Source Select */}
                        <div className="relative">
                             <select
                                value={docValues[category]?.source || 'office_365'}
                                onChange={e => setDocValues(category, 'source', e.target.value as Document['source'])}
                                className={`${commonInputClass} appearance-none pr-10`}
                            >
                                <option value="office_365">Office 365</option>
                                <option value="google_drive_pdf">Google Drive</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Col 3: URL Input */}
                        <input
                            id={`doc-url-${category}`}
                            type="url"
                            placeholder="Dán đường dẫn (URL) vào đây"
                            value={docValues[category]?.url || ''}
                            onChange={e => setDocValues(category, 'url', e.target.value)}
                            className={commonInputClass}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Wizard Component ---
export const CreationWizard = () => {
    const { 
        creationState, hideCreationWizard, data, 
        addLearningPath, addCourse, addLevel, addDocument,
        updateLearningPath, updateCourse, updateLevel, updateDocument 
    } = useContext(AppContext)!;

    const { type, parentId, itemToEdit } = creationState!;
    const isEditing = !!itemToEdit;

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<any>({});
    
    const wizardConfig = {
        learningPath: { createTitle: 'Tạo Lộ trình học mới', editTitle: 'Chỉnh sửa Lộ trình học', steps: 1 },
        course: { createTitle: 'Tạo Khóa học mới', editTitle: 'Chỉnh sửa Khóa học', steps: isEditing ? 1 : 5 },
        level: { createTitle: 'Tạo Cấp độ mới', editTitle: 'Chỉnh sửa Cấp độ', steps: isEditing ? 1 : 4 },
        document: { createTitle: 'Thêm Tài liệu mới', editTitle: 'Chỉnh sửa Tài liệu', steps: 1 },
    };
    const { createTitle, editTitle, steps: totalSteps } = wizardConfig[type];
    const title = isEditing ? editTitle : createTitle;

    // Initialize formData
    useEffect(() => {
        if (isEditing) {
            const processedItem = type === 'course' ? {...itemToEdit, tools: (itemToEdit as Course).tools?.join(', ') || ''} : itemToEdit;
            setFormData(processedItem);
        } else {
            const defaults: any = { ...parentId };
            if (type === 'course' || type === 'level' || type === 'document') {
                defaults.documents = {};
            }
            if (type === 'course') {
                defaults.year = new Date().getFullYear();
            } else if (type === 'level') {
                defaults.name = LevelName.BASIC;
            }
            setFormData(defaults);
        }
    }, [type, parentId, itemToEdit, isEditing]);


    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

     const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const setDocValues = useCallback((category: DocumentCategory, field: 'url' | 'source', value: string) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [category]: {
                    url: '', 
                    source: 'office_365',
                    ...(prev.documents?.[category] || {}),
                    [field]: value
                }
            }
        }))
    }, []);

    const handleNextStep = () => setStep(s => Math.min(s + 1, totalSteps));
    const handlePrevStep = () => setStep(s => Math.max(1, s - 1));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submissionData = { ...formData };
        if (type === 'course') {
            if (submissionData.tools && typeof submissionData.tools === 'string') {
                submissionData.tools = submissionData.tools.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            
            const parsedYear = parseInt(String(submissionData.year), 10);
            if (!isNaN(parsedYear)) {
                submissionData.year = parsedYear;
            } else if (isEditing) {
                // If parsing fails during an edit (e.g., user cleared the field),
                // delete the key from the submission data. This prevents
                // overwriting a valid number in the database with an invalid value.
                delete submissionData.year;
            }
        }
        
        if (isEditing) {
            switch(type) {
                case 'learningPath': updateLearningPath(itemToEdit!.id, submissionData); break;
                case 'course': updateCourse(parentId.pathId!, itemToEdit!.id, submissionData); break;
                case 'level': updateLevel(parentId.pathId!, parentId.courseId!, itemToEdit!.id, submissionData); break;
                case 'document': updateDocument(parentId, itemToEdit!.id, submissionData); break;
            }
        } else {
             const documentsToSave = Object.entries(formData.documents || {})
                .map(([category, data]: [string, any]) => ({
                    category: category as DocumentCategory,
                    name: DOCUMENT_NAMES[category as DocumentCategory] || category,
                    url: data.url,
                    source: data.source || 'office_365',
                }))
                .filter(doc => doc.url && doc.url.trim() !== '');

            const finalSubmissionData = { ...submissionData, documents: documentsToSave };
            
            switch(type) {
                case 'learningPath': addLearningPath(finalSubmissionData); break;
                case 'course': addCourse(finalSubmissionData.pathId, finalSubmissionData); break;
                case 'level': addLevel(finalSubmissionData.pathId, finalSubmissionData.courseId, finalSubmissionData); break;
                case 'document': 
                    documentsToSave.forEach(doc => { addDocument(parentId, doc); });
                    break;
            }
        }
        hideCreationWizard();
    };
    
    const isNextDisabled = () => {
        switch (type) {
            case 'course':
                if (step === 1 && !formData.pathId) return true;
                if (step === 2 && (!formData.name || !formData.year || !formData.ageGroup)) return true;
                if (step === 3 && (!formData.content || !formData.objectives)) return true;
                break;
            case 'level':
                if (step === 1 && (!formData.pathId || !formData.courseId)) return true;
                if (step === 2 && (!formData.name || !formData.content || !formData.objectives)) return true;
                break;
            default:
                return false;
        }
        return false;
    };

    const renderStep = () => {
        if (isEditing) return renderEditForm();
        switch(type) {
            case 'learningPath': return <InputField name="name" label="Tên Lộ trình học" value={formData.name} onChange={handleChange} required />;
            case 'document': {
                if (parentId.levelId) return <DocumentListEditor docValues={formData.documents || {}} setDocValues={setDocValues} creationType={'level'} />;
                return <DocumentListEditor docValues={formData.documents || {}} setDocValues={setDocValues} creationType={'course'} />;
            }
            case 'course': return renderCourseSteps();
            case 'level': return renderLevelSteps();
        }
    };

    const renderEditForm = () => {
         switch(type) {
            case 'learningPath': return <InputField name="name" label="Tên Lộ trình học" value={formData.name} onChange={handleChange} required />;
            case 'course': return (
                <div className="space-y-6">
                    <InputField name="name" label="Tên khóa học" value={formData.name} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField name="year" label="Năm" value={formData.year} onChange={handleChange} required type="number" />
                        <InputField name="ageGroup" label="Độ tuổi" value={formData.ageGroup} onChange={handleChange} required />
                    </div>
                    <InputField name="language" label="Ngôn ngữ lập trình" value={formData.language} onChange={handleChange} />
                    <InputField name="tools" label="Công cụ (cách nhau bởi dấu phẩy)" value={formData.tools} onChange={handleChange} />
                    <div>
                        <label className="block text-lg font-semibold mb-2">{UI_STRINGS.imageUrl}</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-400" />}
                            </div>
                            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600">
                                <span>Tải ảnh lên</span>
                                <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                        <InputField name="imageUrl" label={`${UI_STRINGS.imageUrl} (URL)`} value={formData.imageUrl} onChange={handleChange} type="url"/>
                    </div>
                    <TextareaField name="content" label="Nội dung khóa học" value={formData.content} onChange={handleChange} required />
                    <TextareaField name="objectives" label="Mục tiêu khóa học" value={formData.objectives} onChange={handleChange} required />
                </div>
            );
            case 'level': return (
                <div className="space-y-8">
                    <SelectField name="name" label="Tên cấp độ" value={formData.name} onChange={handleChange} required>
                       {Object.values(LevelName).map(name => <option key={name} value={name}>{name}</option>)}
                    </SelectField>
                    <TextareaField name="content" label="Nội dung cấp độ" value={formData.content} onChange={handleChange} required />
                    <TextareaField name="objectives" label="Mục tiêu cấp độ" value={formData.objectives} onChange={handleChange} required />
                </div>
            );
            case 'document': return (
                 <div className="space-y-6">
                    <SelectField name="category" label="Loại tài liệu" value={formData.category} onChange={handleChange} required>
                       {Object.values(DocumentCategory).map(cat => <option key={cat} value={cat}>{DOCUMENT_NAMES[cat]}</option>)}
                    </SelectField>
                    <SelectField name="source" label="Nguồn tài liệu" value={formData.source} onChange={handleChange} required>
                        <option value="google_drive_pdf">Google Drive (PDF)</option>
                        <option value="office_365">Office 365 (Link)</option>
                    </SelectField>
                    <InputField name="name" label="Tên tài liệu" value={formData.name} onChange={handleChange} required />
                    <InputField name="url" label="Đường dẫn (URL)" value={formData.url} onChange={handleChange} required type="url" />
                </div>
            );
            default: return null;
        }
    };

    const renderCourseSteps = () => {
        switch(step) {
            case 1: return ( // Select Path
                <SelectField name="pathId" label="Chọn Lộ trình học" value={formData.pathId} onChange={handleChange} required>
                    <option value="" disabled>-- Chọn một Lộ trình --</option>
                    {data.map(path => <option key={path.id} value={path.id}>{path.name}</option>)}
                </SelectField>
            );
            case 2: return ( // Basic Info
                <div className="space-y-6">
                    <InputField name="name" label="Tên khóa học" value={formData.name} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField name="year" label="Năm" value={formData.year} onChange={handleChange} required type="number" />
                        <InputField name="ageGroup" label="Độ tuổi" value={formData.ageGroup} onChange={handleChange} required />
                    </div>
                    <InputField name="language" label="Ngôn ngữ lập trình" value={formData.language} onChange={handleChange} />
                    <InputField name="tools" label="Công cụ (cách nhau bởi dấu phẩy)" value={formData.tools} onChange={handleChange} />
                    <InputField name="imageUrl" label="URL Hình ảnh đại diện" value={formData.imageUrl} onChange={handleChange} type="url"/>
                </div>
            );
            case 3: return ( // Content
                 <div className="space-y-8">
                     <TextareaField name="content" label="Nội dung khóa học" value={formData.content} onChange={handleChange} required />
                     <TextareaField name="objectives" label="Mục tiêu khóa học" value={formData.objectives} onChange={handleChange} required />
                </div>
            );
            case 4: return ( // Documents
                <DocumentListEditor docValues={formData.documents || {}} setDocValues={setDocValues} creationType="course" />
            );
            case 5: return <ReviewPanel data={formData} type="course" />;
        }
    };

    const renderLevelSteps = () => {
        switch(step) {
            case 1: // Select Path & Course
                const selectedPathCourses = formData.pathId ? data.find(p => p.id === formData.pathId)?.courses : [];
                return (
                    <div className="space-y-6">
                         <SelectField name="pathId" label="Chọn Lộ trình học" value={formData.pathId} onChange={handleChange} required>
                            <option value="" disabled>-- Chọn một Lộ trình --</option>
                            {data.map(path => <option key={path.id} value={path.id}>{path.name}</option>)}
                        </SelectField>
                        {formData.pathId && (
                             <SelectField name="courseId" label="Chọn Khóa học" value={formData.courseId} onChange={handleChange} required>
                                <option value="" disabled>-- Chọn một Khóa học --</option>
                                {selectedPathCourses?.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                            </SelectField>
                        )}
                    </div>
                );
            case 2: // Level info
                return(
                    <div className="space-y-8">
                         <SelectField name="name" label="Tên cấp độ" value={formData.name} onChange={handleChange} required>
                            {Object.values(LevelName).map(name => <option key={name} value={name}>{name}</option>)}
                        </SelectField>
                        <TextareaField name="content" label="Nội dung cấp độ" value={formData.content} onChange={handleChange} required />
                        <TextareaField name="objectives" label="Mục tiêu cấp độ" value={formData.objectives} onChange={handleChange} required />
                    </div>
                );
            case 3: // Documents
                 return <DocumentListEditor docValues={formData.documents || {}} setDocValues={setDocValues} creationType="level" />;
            case 4: return <ReviewPanel data={formData} type="level" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-50 flex flex-col animate-fade-in">
             <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
                <h2 className="text-xl font-bold text-[#E31F26]">{title}</h2>
                <button onClick={hideCreationWizard} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-full"><X/></button>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                       {totalSteps > 1 && !isEditing && (
                            <div className="flex items-center justify-center gap-4 mb-8">
                                {Array.from({ length: totalSteps }).map((_, i) => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i < step ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                                ))}
                            </div>
                        )}
                        {renderStep()}
                    </div>
                </main>
                <footer className="flex-shrink-0 flex justify-end gap-4 p-4 bg-white dark:bg-gray-800 border-t border-black/10 dark:border-white/10">
                     <button type="button" onClick={hideCreationWizard} className="py-2.5 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-bold">{UI_STRINGS.cancel}</button>
                    {step > 1 && !isEditing && <button type="button" onClick={handlePrevStep} className="py-2.5 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-bold flex items-center gap-2"><ArrowLeft size={16}/> Quay lại</button>}
                    {step < totalSteps && !isEditing && <button type="button" onClick={handleNextStep} disabled={isNextDisabled()} className="py-2.5 px-5 rounded-lg bg-[#E31F26] text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:bg-red-400 disabled:cursor-not-allowed">Tiếp theo <ArrowRight size={16}/></button>}
                    {!isEditing && step === totalSteps && <button type="submit" className="py-2.5 px-5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2"><Check size={16}/> {UI_STRINGS.save}</button>}
                    {isEditing && <button type="submit" className="py-2.5 px-5 rounded-lg bg-[#E31F26] text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">{UI_STRINGS.save}</button>}
                </footer>
            </form>
        </div>
    );
};

// --- Review Panel Component ---
const ReviewPanel = ({data, type}: {data: any, type: 'course' | 'level'}) => {
    // Transform the documents object back into a readable array for the review panel
    const documentsForReview = Object.entries(data.documents || {})
        .map(([category, docData]: [string, any]) => ({
            category,
            ...docData
        }))
        .filter(doc => doc.url && doc.url.trim() !== '');

    return (
        <div className="space-y-6 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-2xl font-bold border-b pb-2 dark:border-gray-600">Xem lại thông tin</h3>
            {type === 'course' && (
                <div className="space-y-2 text-lg">
                    <p><strong>Tên khóa học:</strong> {data.name}</p>
                    <p><strong>Năm:</strong> {data.year}</p>
                    <p><strong>Độ tuổi:</strong> {data.ageGroup}</p>
                    <p><strong>Ngôn ngữ:</strong> {data.language || 'N/A'}</p>
                    <p><strong>Công cụ:</strong> {(Array.isArray(data.tools) ? data.tools.join(', ') : data.tools) || 'N/A'}</p>
                </div>
            )}
             {type === 'level' && (
                <div className="space-y-2 text-lg">
                    <p><strong>Tên cấp độ:</strong> {data.name}</p>
                </div>
            )}
            <div className="space-y-4">
                 <h4 className="font-bold text-xl flex items-center gap-2"><BookOpen/> Nội dung</h4>
                 <p className="pl-6 opacity-80 whitespace-pre-wrap">{data.content}</p>
                 <h4 className="font-bold text-xl flex items-center gap-2"><CheckCircle/> Mục tiêu</h4>
                 <p className="pl-6 opacity-80 whitespace-pre-wrap">{data.objectives}</p>
                 <h4 className="font-bold text-xl flex items-center gap-2"><Files/> Tài liệu ({documentsForReview.length || 0})</h4>
                 <ul className="pl-6 list-disc list-inside space-y-1">
                    {documentsForReview.map((doc: any, index: number) => <li key={index}>{DOCUMENT_NAMES[doc.category as DocumentCategory]}</li>)}
                 </ul>
            </div>
        </div>
    );
};
