import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import type { FeliTask, TaskCategory } from '../../types';

export function TaskCard({
  task,
  onToggle,
  onEdit,
}: {
  task: FeliTask & { category?: TaskCategory };
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const isDone = task.status === 'completada';

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${
        isDone ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 mt-1 shrink-0 flex items-center justify-center ${
            isDone ? 'bg-sanctuary-teal border-sanctuary-teal text-white' : 'border-gray-300'
          }`}
        >
          {isDone && <span className="text-xs">✓</span>}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`font-semibold ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full ${criticalityBadge(task.priority)}`}>
                {t(`tasks.criticality.${task.priority}`)}
              </span>
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg text-sanctuary-teal hover:bg-sanctuary-teal/10"
                title={t('common.edit')}
              >
                <Pencil size={16} />
              </button>
            </div>
          </div>
          {task.description && (
            <p className={`text-sm mt-1 ${isDone ? 'line-through text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {task.category && (
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                {t(`tasks.category.${task.category}`)}
              </span>
            )}
            <span className="text-gray-500">
              {task.start_date ?? '—'} → {task.end_date ?? '—'}
            </span>
            <span className={`px-2 py-1 rounded-full ${isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isDone ? t('tasks.status.completed') : t('tasks.status.pending')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function criticalityBadge(priority: FeliTask['priority']) {
  if (priority === 'urgente') return 'bg-red-100 text-red-700';
  if (priority === 'prioritaria') return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-600';
}
