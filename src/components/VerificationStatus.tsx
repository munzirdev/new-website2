import React from 'react';
import { useAuthContext } from './AuthProvider';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

const VerificationStatus: React.FC = () => {
  const { user, getVerificationStatus } = useAuthContext();
  
  if (!user) return null;
  
  const { isVerified, needsVerification } = getVerificationStatus();
  
  // If user is verified or doesn't need verification, don't show anything
  if (isVerified || !needsVerification) return null;
  
  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <div className="flex items-center space-x-1 rtl:space-x-reverse text-yellow-600 dark:text-yellow-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm font-medium">تحقق من بريدك</span>
      </div>
    </div>
  );
};

export default VerificationStatus;
