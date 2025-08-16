import React, { useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import './FileUploadModal.css';

interface FileUploadModalProps {
  isVisible: boolean;
  isSuccess: boolean;
  message: string;
  onClose: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isVisible,
  isSuccess,
  message,
  onClose
}) => {
  const { isArabic } = useLanguage();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-modal rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out animate-slide-in">
        {/* Success Icon */}
        {isSuccess ? (
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center success-icon">
              <svg 
                className="w-8 h-8 text-green-500 success-check" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center error-icon">
              <svg 
                className="w-8 h-8 text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold mb-2 ${isSuccess ? 'text-green-600' : 'text-red-600'} animate-fade-in`}>
            {isSuccess 
              ? (isArabic ? 'تم رفع الملف بنجاح' : 'File Uploaded Successfully')
              : (isArabic ? 'فشل في رفع الملف' : 'File Upload Failed')
            }
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed animate-fade-in-delay">
            {message}
          </p>
        </div>
        


        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200/50 rounded-full h-1 overflow-hidden">
            <div 
              className={`h-1 rounded-full progress-bar ${
                isSuccess ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        


        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FileUploadModal;
