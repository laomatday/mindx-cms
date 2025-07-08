import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { UI_STRINGS, DOCUMENT_NAMES } from '../constants';
import { AppContext } from '../context/AppContext';
import { Course, Level, Document, DocumentCategory, LevelName, EditableItem, ItemType, ParentId } from '../types';
import { X, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EditModalProps {
    item: EditableItem | null; // Dữ liệu của mục cần sửa. `null` nếu là thêm mới.
    type: ItemType; // Loại mục (course, level, document).
    parentId: ParentId; // ID của các mục cha.
    onClose: () => void; // Hàm callback khi đóng modal.
}

// Hàm helper để lấy tiêu đề cho modal (ví dụ: "Thêm khóa học", "Chỉnh sửa cấp độ").
const getTitle = (type: ItemType, isEditing: boolean): string => {
    const action = isEditing ? UI_STRINGS.edit : UI_STRINGS.add;
    switch(type) {
        case 'course': return `${action} ${UI_STRINGS.courses}`;
        case 'level': return `${action} ${UI_STRINGS.levels}`;
        case 'document': return `${action} ${UI_STRINGS.documents}`;
        default: return 'Edit';
    }
}

// Lớp CSS chung cho các trường input để đảm bảo giao diện nhất quán.
const commonInputClass = "w-full px-4 py-3 border border-gray-300/80 dark:border-gray-600/80 rounded-lg bg-gray-50/80 dark:bg-gray-700/60 focus:border-[#E31F26] focus:ring-0 outline-none transition";

// Các component con cho từng loại trường input, được tối ưu hóa bằng `memo`.
const InputField = memo((props: {name: string, label: string, value: string, onChange: any, required?: boolean, type?: string}) => {
    const { name, label, value, onChange, required = false, type = 'text' } = props;
    return (
        <div>
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              value={value || ''}
              onChange={onChange}
              className={commonInputClass}
              required={required}
            />
        </div>
    );
});
const TextareaField = memo((props: {name: string, label: string, value: string, onChange: any, required?: boolean}) => {
    const { name, label, value, onChange, required = false } = props;
    return (
        <div>
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <textarea
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`${commonInputClass} min-h-[100px]`}
                required={required}
                rows={4}
            />
        </div>
    );
});
const SelectField = memo((props: {name: string, label: string, value: string, onChange: any, options: string[], optionNames?: {[key:string]: string}, required?: boolean}) => {
    const { name, label, value, onChange, options, optionNames, required = false } = props;
    return (
        <div className="relative">
            <label className="block text-sm font-medium mb-1" htmlFor={name}>{label}</label>
            <select
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                required={required}
                className={`${commonInputClass} appearance-none pr-10`}
            >
                {options.map(option => (
                    <option key={option} value={option}>
                        {optionNames?.[option] || option}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-10 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
    );
});


/**
 * Component EditModal là một cửa sổ modal đa năng dùng để Thêm hoặc Sửa
 * các mục như Khóa học, Cấp độ, và Tài liệu.
 */
export const EditModal: React.FC<EditModalProps> = ({ item, type, parentId, onClose }) => {
    // State để lưu trữ dữ liệu của form.
    const [formData, setFormData] = useState<any>({});
    const context = useContext(AppContext);
    
    // Khóa cuộn của body khi modal mở.
    useBodyScrollLock();

    // `useEffect` để khởi tạo `formData` khi component được mount hoặc props `item`/`type` thay đổi.
    useEffect(() => {
        if (item) { // Trường hợp Sửa: điền dữ liệu từ `item` vào form.
            if (type === 'course') {
                // Chuyển đổi mảng `tools` thành chuỗi để hiển thị trong input.
                setFormData({...item, tools: (item as Course).tools?.join(', ') || ''});
            } else {
                setFormData(item);
            }
        } else { // Trường hợp Thêm: khởi tạo giá trị mặc định cho form.
            const defaults: any = { name: '', content: '', objectives: '', url: '' };
            if (type === 'document') defaults.category = DocumentCategory.LESSON_PLAN;
            if (type === 'level') defaults.name = LevelName.BASIC;
            if (type === 'course') {
                defaults.year = '';
                defaults.ageGroup = '';
                defaults.language = '';
                defaults.tools = '';
                defaults.imageUrl = '';
            }
            setFormData(defaults);
        }
    }, [item, type]);

    if (!context) return null;

    const { addCourse, updateCourse, addLevel, updateLevel, addDocument, updateDocument } = context;

    // Hàm xử lý khi người dùng thay đổi giá trị trong các trường input.
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }, []);

    // Hàm xử lý khi người dùng chọn một file ảnh.
    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                // Chuyển đổi ảnh thành chuỗi base64 và lưu vào state.
                setFormData((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    }, []);

    // Hàm xử lý khi người dùng gửi form.
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!item;
        
        const submissionData = { ...formData };

        // Xử lý dữ liệu trước khi gửi đi.
        if (type === 'course') {
            // Chuyển chuỗi `tools` trở lại thành mảng.
            if (submissionData.tools && typeof submissionData.tools === 'string') {
                submissionData.tools = submissionData.tools.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
            // Chuyển `year` sang dạng số.
            if (submissionData.year) {
                submissionData.year = parseInt(String(submissionData.year), 10);
            }
        }

        // Gọi hàm CRUD tương ứng từ context.
        switch(type) {
            case 'course':
                isEditing ? updateCourse(parentId.pathId, item!.id, submissionData) : addCourse(parentId.pathId, submissionData);
                break;
            case 'level':
                 isEditing ? updateLevel(parentId.pathId, parentId.courseId!, item!.id, submissionData) : addLevel(parentId.pathId, parentId.courseId!, submissionData);
                break;
            case 'document':
                 isEditing ? updateDocument(parentId, item!.id, submissionData) : addDocument(parentId, submissionData);
                break;
        }
        onClose(); // Đóng modal sau khi gửi.
    }, [formData, item, type, parentId, addCourse, updateCourse, addLevel, updateLevel, addDocument, updateDocument, onClose]);
    
    // Hàm render các trường của form tùy thuộc vào `type`.
    const renderFormFields = () => {
        switch(type) {
            case 'course': return (
                <>
                    <InputField name="name" label={UI_STRINGS.name} value={formData.name} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField name="year" label={UI_STRINGS.year} value={formData.year} onChange={handleChange} required type="number" />
                        <InputField name="ageGroup" label={UI_STRINGS.ageGroupLabel} value={formData.ageGroup} onChange={handleChange} required />
                    </div>
                    <InputField name="language" label={UI_STRINGS.language} value={formData.language} onChange={handleChange} />
                    <InputField name="tools" label={UI_STRINGS.toolsLabel} value={formData.tools} onChange={handleChange} />
                    <TextareaField name="content" label={UI_STRINGS.courseContent} value={formData.content} onChange={handleChange} required />
                    <TextareaField name="objectives" label={UI_STRINGS.courseObjectives} value={formData.objectives} onChange={handleChange} required />
                    <div>
                        <label className="block text-sm font-medium mb-1">{UI_STRINGS.imageUrl}</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-gray-400" />}
                            </div>
                            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600">
                                <span>Upload a file</span>
                                <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>
                </>
            );
            case 'level': return (
                <>
                    <SelectField
                        name="name"
                        label={UI_STRINGS.level}
                        value={formData.name}
                        onChange={handleChange}
                        options={Object.values(LevelName)}
                        required
                    />
                    <TextareaField name="content" label={UI_STRINGS.levelContent} value={formData.content} onChange={handleChange} required />
                    <TextareaField name="objectives" label={UI_STRINGS.levelObjectives} value={formData.objectives} onChange={handleChange} required />
                </>
            );
            case 'document': return (
                <>
                    <SelectField
                        name="category"
                        label={UI_STRINGS.category}
                        value={formData.category}
                        onChange={handleChange}
                        options={Object.values(DocumentCategory)}
                        optionNames={DOCUMENT_NAMES}
                        required
                    />
                    <InputField name="name" label={UI_STRINGS.name} value={formData.name} onChange={handleChange} required />
                    <InputField name="url" label={UI_STRINGS.url} value={formData.url} onChange={handleChange} required />
                </>
            );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in" onMouseDown={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 relative animate-fade-in-up" onMouseDown={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close modal">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-center mb-6 text-[#E31F26]">{getTitle(type, !!item)}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                        {renderFormFields()}
                    </div>
                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="py-2.5 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-bold focus:outline-none focus:ring-0">{UI_STRINGS.cancel}</button>
                        <button type="submit" className="py-2.5 px-5 rounded-lg bg-[#E31F26] text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 focus:outline-none focus:ring-0">{UI_STRINGS.save}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};