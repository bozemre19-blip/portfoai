import React, { createContext, useContext, useState, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ImageViewerContextType {
    openImage: (url: string, title?: string) => void;
    closeImage: () => void;
}

const ImageViewerContext = createContext<ImageViewerContextType | undefined>(undefined);

export const ImageViewerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [title, setTitle] = useState<string | undefined>(undefined);

    const openImage = (url: string, imageTitle?: string) => {
        setImageUrl(url);
        setTitle(imageTitle);
    };

    const closeImage = () => {
        setImageUrl(null);
        setTitle(undefined);
    };

    return (
        <ImageViewerContext.Provider value={{ openImage, closeImage }}>
            {children}
            {imageUrl && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={closeImage}
                >
                    <button
                        onClick={closeImage}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="w-8 h-8" />
                    </button>

                    <div
                        className="relative max-w-full max-h-full flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={imageUrl}
                            alt={title || 'Full size view'}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        {title && (
                            <p className="mt-4 text-white text-lg font-medium text-center bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                {title}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </ImageViewerContext.Provider>
    );
};

export const useImageViewer = () => {
    const context = useContext(ImageViewerContext);
    if (!context) {
        throw new Error('useImageViewer must be used within an ImageViewerProvider');
    }
    return context;
};
