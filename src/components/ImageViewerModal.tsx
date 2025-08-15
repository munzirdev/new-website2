import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string | null;
  imageName: string | null;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, imageName, isOpen, onClose, isDarkMode }) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-jet-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-platinum-200 dark:border-jet-700">
          <h3 className="text-lg font-semibold text-jet-800 dark:text-white">
            {imageName || 'Image Viewer'}
          </h3>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleDownload}
              className="p-2 text-jet-600 dark:text-platinum-400 hover:text-caribbean-600 dark:hover:text-caribbean-400 hover:bg-caribbean-50 dark:hover:bg-caribbean-900/20 rounded-lg transition-all duration-300"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-jet-600 dark:text-platinum-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Image */}
        <div className="p-4">
          <img
            src={imageUrl}
            alt={imageName || 'Image'}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageViewerModal;
