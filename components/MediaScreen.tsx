import React from 'react';
import MediaSection from './MediaSection';

interface MediaScreenProps {
  childId: string;
  navigate: (page: string, params?: any) => void;
}

const MediaScreen: React.FC<MediaScreenProps> = ({ childId }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <MediaSection childId={childId} />
    </div>
  );
};

export default MediaScreen;

