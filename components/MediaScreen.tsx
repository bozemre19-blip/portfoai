import React from 'react';
import MediaSection from './MediaSection';

interface MediaScreenProps {
  childId: string;
  navigate: (page: string, params?: any) => void;
}

const MediaScreen: React.FC<MediaScreenProps> = ({ childId, navigate }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('child-detail', { id: childId })}
          className="mr-3 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ürünler</h1>
      </div>
      <MediaSection childId={childId} />
    </div>
  );
};

export default MediaScreen;

