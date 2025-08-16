import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false
}) => {
  const { isArabic } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-jet-800 p-6 text-left align-middle shadow-xl transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="flex-shrink-0">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-jet-900 dark:text-white">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-jet-400 hover:text-jet-600 dark:hover:text-jet-300 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-2">
            <p className="text-sm text-jet-600 dark:text-jet-400 leading-relaxed">
              {message}
              {itemName && (
                <span className="font-semibold text-jet-900 dark:text-white">
                  {isArabic ? ' "' : ' "'}{itemName}{isArabic ? '"؟' : '"?'}
                </span>
              )}
            </p>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-2 space-x-reverse">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">
                {isArabic 
                  ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العنصر نهائياً.'
                  : 'This action cannot be undone. The item will be permanently deleted.'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-platinum-300 dark:border-jet-600 shadow-sm text-sm font-medium rounded-lg text-jet-700 dark:text-jet-300 bg-white dark:bg-jet-700 hover:bg-platinum-50 dark:hover:bg-jet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-caribbean-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isArabic ? 'حذف' : 'Delete'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
