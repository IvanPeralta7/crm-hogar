import { AlertCircle, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full mx-4">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-sanctuary-teal shrink-0" size={24} />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-2xl">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            <X size={16} />
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sanctuary-teal rounded-xl hover:bg-sanctuary-teal-dark disabled:opacity-50"
          >
            <Check size={16} />
            {isLoading ? t('common.confirming') : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
