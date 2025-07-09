import React, { useState, useMemo } from 'react';
import { LoaderCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { LevelName } from '../types';

/**
 * Chuyển đổi URL Google Drive thành định dạng nhúng (embed) `/preview`.
 * Đây là cách đáng tin cậy để hiển thị các tệp PDF, ngay cả khi chúng bị hạn chế tải xuống.
 * Phiên bản `/preview` mặc định thường có hành vi thu phóng tốt nhất.
 * @param url - URL gốc của Google Drive.
 * @returns - URL nhúng hoặc null nếu URL không hợp lệ.
 */
const getGoogleDriveEmbedUrl = (url: string): string | null => {
  const googleDriveRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  const match = url.match(googleDriveRegex);
  
  if (match && match[1]) {
    const fileId = match[1];
    // Sử dụng URL /preview đơn giản. Tham số `?embedded=true` có thể thay đổi hành vi thu phóng mặc định
    // một cách không mong muốn. Chế độ xem /preview mặc định thường có chế độ tự động vừa với chiều rộng tốt hơn.
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return null;
};


export const PDFViewer: React.FC<{ url: string; name: string; onClose: () => void; pathName?: string; courseName?: string; levelName?: LevelName }> = ({ url, name, onClose, pathName, courseName, levelName }) => {
    const [isLoading, setIsLoading] = useState(true);
    const embedUrl = useMemo(() => getGoogleDriveEmbedUrl(url), [url]);

    const pageTitle = useMemo(() => {
        // Tên tài liệu đã là tên danh mục, ví dụ: "Student Book"
        // Nếu có cấp độ, hãy nối nó vào.
        return levelName ? `${name} - ${levelName}` : name;
    }, [name, levelName]);

    const backButtonText = useMemo(() => {
        if (courseName) return `Trở về ${courseName}`;
        if (pathName) return `Trở về ${pathName}`;
        return 'Trở về';
    }, [courseName, pathName]);

    return (
        <main className="flex-1 p-6 sm:p-10 lg:p-14">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <button onClick={onClose} className="flex items-center gap-2 hover:text-[#E31F26] mb-4 font-bold transition-colors">
                        <ArrowLeft size={20} />
                        {backButtonText}
                    </button>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#E31F26] truncate" title={pageTitle}>
                        {pageTitle}
                    </h2>
                </div>

                {/* Iframe Container */}
                <div className="relative w-full h-[75vh] bg-gray-200 dark:bg-black/20 rounded-lg shadow-lg overflow-hidden border border-black/5 dark:border-white/10">
                    {embedUrl ? (
                        <>
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 z-10">
                                    <LoaderCircle className="animate-spin" size={48} />
                                    <p className="mt-4 text-lg font-semibold">Đang tải tài liệu...</p>
                                </div>
                            )}
                            <iframe
                                src={embedUrl}
                                className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setIsLoading(false)}
                                title={pageTitle}
                                allow="autoplay"
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                            <AlertTriangle className="mb-4" size={48} />
                            <p className="text-lg font-semibold">URL không hợp lệ</p>
                            <p className="text-sm mt-2">Trình xem này chỉ hỗ trợ các liên kết tệp PDF từ Google Drive.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};