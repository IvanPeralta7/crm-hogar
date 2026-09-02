import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { TASK_CATEGORIES, type Task, type TaskFormData } from '../../types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialTask?: Task | null;
}

const CRITICALITIES = ['urgente', 'prioritaria', 'pateable'] as const;

export function TaskForm({ isOpen, onClose, onSubmit, initialTask }: TaskFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState<TaskFormData['category']>('hogar');
  const [priority, setPriority] = useState<TaskFormData['priority']>('prioritaria');
  const [status, setStatus] = useState<TaskFormData['status']>('pendiente');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split('T')[0];
    setTitle(initialTask?.title ?? '');
    setDescription(initialTask?.description ?? '');
    setStartDate(initialTask?.start_date ?? today);
    setEndDate(initialTask?.end_date ?? today);
    setCategory(initialTask?.category ?? 'hogar');
    setPriority(initialTask?.priority ?? 'prioritaria');
    setStatus(initialTask?.status ?? 'pendiente');
    setError(null);
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        category,
        priority,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('tasks.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {initialTask ? t('tasks.editTask') : t('tasks.addTask')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tasks.titleLabel')} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="field-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('tasks.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="field-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tasks.startDateLabel')} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tasks.endDateLabel')} *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="field-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tasks.categoryLabel')} *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskFormData['category'])}
                className="field-input"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`tasks.category.${cat}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('tasks.criticalityLabel')} *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskFormData['priority'])}
                className="field-input"
              >
                {CRITICALITIES.map((value) => (
                  <option key={value} value={value}>
                    {t(`tasks.criticality.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={status === 'completada'}
              onChange={(e) => setStatus(e.target.checked ? 'completada' : 'pendiente')}
              className="w-5 h-5 rounded accent-sanctuary-teal"
            />
            <span className="text-sm text-gray-700">{t('tasks.completedLabel')}</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white hover:bg-sanctuary-teal-dark disabled:opacity-50"
            >
              {saving ? t('tasks.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
