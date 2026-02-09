import React from 'react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  confirmVariant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-5 w-full max-w-sm mx-auto bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-3 rtl:space-x-reverse">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;