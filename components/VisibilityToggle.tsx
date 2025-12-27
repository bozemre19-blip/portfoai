/**
 * VisibilityToggle Component
 * Toggle button to share/unshare content with families
 */
import React, { useState, useEffect } from 'react';
import { getVisibility, toggleVisibility, VisibilityContentType } from '../services/api';

interface VisibilityToggleProps {
    contentType: VisibilityContentType;
    contentId: string;
    size?: 'sm' | 'md';
    showLabel?: boolean;
    onToggle?: (newValue: boolean) => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
    contentType,
    contentId,
    size = 'sm',
    showLabel = true,
    onToggle
}) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const isVisible = await getVisibility(contentType, contentId);
            setVisible(isVisible);
            setLoading(false);
        };
        load();
    }, [contentType, contentId]);

    const handleToggle = async () => {
        if (toggling) return;
        setToggling(true);

        const newValue = await toggleVisibility(contentType, contentId);

        if (newValue !== null) {
            setVisible(newValue);
            onToggle?.(newValue);
        }

        setToggling(false);
    };

    const sizeClasses = size === 'sm'
        ? 'text-xs px-2 py-1 gap-1'
        : 'text-sm px-3 py-1.5 gap-2';

    if (loading) {
        return (
            <div className={`inline-flex items-center ${sizeClasses} text-gray-400`}>
                <span className="animate-pulse">•••</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={toggling}
            className={`
        inline-flex items-center rounded-full font-medium transition-all
        ${sizeClasses}
        ${visible
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/50'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
        ${toggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
            title={visible ? 'Aileye paylaşılıyor - gizlemek için tıklayın' : 'Aileye paylaşılmıyor - paylaşmak için tıklayın'}
        >
            <span className={toggling ? 'animate-spin' : ''}>
                {visible ? '👁️' : '🔒'}
            </span>
            {showLabel && (
                <span>{visible ? 'Paylaşıldı' : 'Gizli'}</span>
            )}
        </button>
    );
};

export default VisibilityToggle;
