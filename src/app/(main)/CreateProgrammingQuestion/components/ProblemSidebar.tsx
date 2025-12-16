'use client';

import React from 'react';

interface Category {
    id: string;
    name: string;
    subItems: any[];
}

interface ProblemSidebarProps {
    categories: Category[];
    selectedCategory: string;
    handleCategorySelect: (categoryId: string) => void;
    isEditMode: boolean;
}

const ProblemSidebar: React.FC<ProblemSidebarProps> = ({
    categories,
    selectedCategory,
    handleCategorySelect,
    isEditMode,
}) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-title">
                    問題作成カテゴリ
                </div>
                {isEditMode && (
                    <div className="edit-mode-indicator">
                        編集モード
                    </div>
                )}
            </div>

            <div className="category-section">
                <ul className="sidebar-menu">
                    {categories.map((category) => (
                        <li key={category.id} className="sidebar-item">
                            <button
                                className={`sidebar-link ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategorySelect(category.id)}
                            >
                                <div className="sidebar-link-content">
                                    <span className="sidebar-link-text">{category.name}</span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <style jsx>{`
        .sidebar { width: 280px; background: linear-gradient(180deg, #4fd1c7 0%, #38b2ac 100%); color: white; padding: 2rem 0; box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1); border-radius: 0 20px 20px 0; margin-right: 2rem; }
        .sidebar-header { padding: 0 2rem 2rem; text-align: center; }
        .sidebar-title { background: rgba(255, 255, 255, 0.2); padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 0.875rem; font-weight: 600; color: white; margin-bottom: 1.5rem; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
        .category-section { margin-bottom: 1.5rem; }
        .sidebar-menu { list-style: none; }
        .sidebar-item { margin-bottom: 0.25rem; }
        .sidebar-link { display: flex; align-items: center; padding: 1rem 2rem; color: rgba(255, 255, 255, 0.9); text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: all 0.3s ease; border-left: 4px solid transparent; position: relative; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
        .sidebar-link:hover { background: rgba(255, 255, 255, 0.1); color: white; border-left-color: rgba(255, 255, 255, 0.5); transform: translateX(4px); }
        .sidebar-link.active { background: rgba(255, 255, 255, 0.2); color: white; border-left-color: white; font-weight: 600; box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1); }
        .sidebar-link-content { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .sidebar-link-text { flex: 1; }
        .edit-mode-indicator { background: linear-gradient(135deg, #4fd1c7 0%, #19547b 100%); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; display: inline-block; margin-left: 1rem; }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .sidebar { animation: slideIn 0.4s ease-out; }
        @media (max-width: 768px) {
          .sidebar { width: 100%; border-radius: 0; margin-right: 0; margin-bottom: 1rem; }
        }
      `}</style>
        </div>
    );
};

export default ProblemSidebar;
