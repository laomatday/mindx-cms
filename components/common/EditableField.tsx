import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface EditableFieldProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  inputComponent?: 'input' | 'textarea';
  className?: string;
  inputClassName?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  initialValue,
  onSave,
  inputComponent = 'input',
  className = '',
  inputClassName = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    // Only call onSave if the value has actually changed
    if (value.trim() !== initialValue.trim()) {
      onSave(value);
    }
  }, [value, initialValue, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Save on Enter for single-line input, or Ctrl+Enter for textarea
    if (e.key === 'Enter' && (inputComponent === 'input' || (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: `w-full p-2 border border-red-500 rounded-md bg-white dark:bg-gray-900 focus:ring-1 focus:ring-red-500 outline-none transition-all ${inputClassName}`,
    };

    return inputComponent === 'textarea' ? (
      <textarea {...commonProps} rows={Math.max(5, value.split('\n').length)} />
    ) : (
      <input type="text" {...commonProps} />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`relative group cursor-pointer p-2 -m-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors prose prose-p:my-0 prose-ul:my-0 prose-li:my-0 dark:prose-invert max-w-none ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if(e.key === 'Enter') setIsEditing(true); }}
    >
      {value.trim() ? <MarkdownRenderer text={value}/> : <span className="opacity-50 italic">Click to edit...</span>}
      <Pencil className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4" />
    </div>
  );
};
