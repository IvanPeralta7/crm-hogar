import { useTranslation } from 'react-i18next';

export function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export function WeeklyProgressCard({
  completed,
  remaining,
  progress,
}: {
  completed: number;
  remaining: number;
  progress: number;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center h-fit">
      <h3 className="font-semibold mb-4">{t('tasks.weeklyProgress')}</h3>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#006D6D"
            strokeWidth="8"
            strokeDasharray={`${progress * 2.64} 264`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="text-xs text-gray-500">{t('tasks.complete')}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-6 text-sm">
        <div>
          <div className="font-semibold">{completed}</div>
          <div className="text-gray-500">{t('tasks.tasksDone')}</div>
        </div>
        <div>
          <div className="font-semibold text-sanctuary-teal">{remaining}</div>
          <div className="text-gray-500">{t('tasks.remaining')}</div>
        </div>
      </div>
    </div>
  );
}
