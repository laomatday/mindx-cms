import React, { useContext, useCallback } from 'react';
import { Code, Palette, Bot, Route } from 'lucide-react';
import { UI_STRINGS } from '../constants';
import { DefaultLearningPathName, LearningPathName, DEFAULT_PATH_NAMES } from '../types';
import { AppContext } from '../context/AppContext';
import { MarkdownRenderer } from './common/MarkdownRenderer';

// Đối tượng chứa thông tin chi tiết (icon, mô tả, màu sắc) cho mỗi lộ trình học mặc định.
const pathDetails: Record<DefaultLearningPathName, {
    icon: React.ElementType;
    description: string;
    color: string;
    glow: string;
}> = {
    [DEFAULT_PATH_NAMES.CODING_AI]: {
        icon: Code,
        description: UI_STRINGS.codingAiDesc,
        color: 'text-blue-500 dark:text-blue-400',
        glow: 'hover:shadow-blue-500/20'
    },
    [DEFAULT_PATH_NAMES.ART_DESIGN]: {
        icon: Palette,
        description: UI_STRINGS.artDesignDesc,
        color: 'text-orange-500 dark:text-orange-400',
        glow: 'hover:shadow-orange-500/20'
    },
    [DEFAULT_PATH_NAMES.ROBOTICS]: {
        icon: Bot,
        description: UI_STRINGS.roboticsDesc,
        color: 'text-green-500 dark:text-green-400',
        glow: 'hover:shadow-green-500/20'
    }
};

const defaultPathDetails = {
    icon: Route,
    description: "Khám phá các khóa học trong lộ trình mới này.",
    color: 'text-gray-500 dark:text-gray-400',
    glow: 'hover:shadow-gray-500/20'
};


/**
 * Component HomePage là trang mặc định khi người dùng truy cập ứng dụng.
 * Nó hiển thị các "thẻ" (card) cho mỗi lộ trình học, cho phép người dùng điều hướng.
 */
export const HomePage: React.FC = () => {
    const context = useContext(AppContext);
    if(!context) return null;

    const { data, navigate, loading } = context;

    // Hàm xử lý khi người dùng click vào một thẻ lộ trình học.
    // `useCallback` để tối ưu hóa, tránh tạo lại hàm khi không cần thiết.
    const handlePathClick = useCallback((pathId: string) => {
        navigate(pathId, null); // Cập nhật lộ trình và reset khóa học.
    }, [navigate]);
    
    // Nếu đang tải dữ liệu, chỉ hiển thị một div trống để tránh lỗi.
    if (loading) {
        return <div className="flex-1 p-8" />;
    }

    return (
        <main className="flex-1 p-8 overflow-y-auto">
            <div className="text-center max-w-7xl mx-auto py-10">
                {/* Tiêu đề và phụ đề của trang chủ */}
                <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-b from-[#E31F26] to-red-800 dark:from-red-500 dark:to-[#E31F26] bg-clip-text text-transparent leading-tight md:leading-snug">
                    <span className="block">Trường học Công nghệ MindX</span>
                    <span className="block text-3xl md:text-4xl">Course Management System</span>
                </h2>
                <p className="mt-4 text-lg">Hệ thống quản lý và chia sẻ tài liệu liên quan đến Khóa học tại MindX.</p>
                
                {/* Lưới hiển thị các thẻ lộ trình học */}
                <div className="mt-12 grid gap-8" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'}}>
                    {data.map(path => {
                        const details = pathDetails[path.name as DefaultLearningPathName] || defaultPathDetails;
                        const Icon = details.icon;
                        return (
                            <button 
                                key={path.id} 
                                onClick={() => handlePathClick(path.id)} 
                                // Các lớp CSS tạo hiệu ứng khi hover và style cho thẻ, thêm flexbox để căn chỉnh nội dung
                                className={`group p-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-black/5 dark:border-white/5 rounded-2xl md:hover:-translate-y-2 transition-all duration-300 text-left shadow-lg shadow-gray-400/10 dark:shadow-black/20 ${details.glow} hover:shadow-xl flex flex-col`}
                            >
                                <div>
                                    <Icon className={`w-12 h-12 mb-4 transition-transform duration-300 group-hover:scale-110 ${details.color}`} />
                                    <h3 className="text-2xl font-bold mb-2">{path.name}</h3>
                                </div>
                                <div className="flex-grow">
                                    <MarkdownRenderer text={details.description} as="p" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
      </main>
    )
}