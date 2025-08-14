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
    if (imageUrl)
