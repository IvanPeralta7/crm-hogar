import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { getSupabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';
import { mockTasks } from '../data/mockData';
import type { Task, TaskCategory } from '../types';

const FILTERS: Array<TaskCategory | 'all'> = ['all', 'limpieza', 'cocina', 'jardin', 'mascotas'];

export function TasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [view, setView] = useState<'list' | 'weekly'>('list');

  useEffect(() => {
    async function load() {
      if (isDemoMode) {
        setTasks(mockTasks);
        return;
      }

      const { data } = await getSupabase()
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      setTasks(data ?? []);
    }

    void load();
  }, []);

  const filteredTasks = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.category === filter)),
    [tasks, filter],
  );

  const completed = tasks.filter((task) => task.status === 'completada').length;
  const remaining = tasks.filter((task) => task.status !== 'completada').length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <>
      <TopBar title={t('tasks.title')} searchPlaceholder={t('header.searchTasks')} showSearch />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === item
                  ? 'bg-sanctuary-teal text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {item === 'all' ? t('tasks.allTasks') : t(`tasks.category.${item}`)}
            </button>
          ))}
        </div>

        <div className="flex bg-white border border-gray-200 rounded-full p-1 self-start">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-4 py-1.5 rounded-full text-sm ${
              view === 'list' ? 'bg-sanctuary-teal text-white' : 'text-gray-600'
            }`}
          >
            {t('tasks.listView')}
          </button>
          <button
            type="button"
            onClick={() => setView('weekly')}
            className={`px-4 py-1.5 rounded-full text-sm ${
              view === 'weekly' ? 'bg-sanctuary-teal text-white' : 'text-gray-600'
            }`}
          >
            {t('tasks.weeklyView')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('tasks.today')}</h2>
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
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

          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
            <h3 className="font-semibold mb-2">{t('tasks.needHand')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('tasks.needHandDesc')}</p>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 text-sm font-medium"
            >
              <Plus size={18} />
              {t('tasks.quickAdd')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { t } = useTranslation();
  const isDone = task.status === 'completada';

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${
        isDone ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-6 h-6 rounded-full border-2 mt-1 shrink-0 flex items-center justify-center ${
            isDone ? 'bg-sanctuary-teal border-sanctuary-teal text-white' : 'border-gray-300'
          }`}
        >
          {isDone && <span className="text-xs">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`font-semibold ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${priorityBadge(task.priority)}`}>
              {t(`tasks.priority.${task.priority}`).toUpperCase()}
            </span>
          </div>
          {task.description && (
            <p className={`text-sm mt-1 ${isDone ? 'line-through text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {t(`tasks.category.${task.category}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function priorityBadge(priority: Task['priority']) {
  if (priority === 'alta') return 'bg-red-100 text-red-700';
  if (priority === 'media') return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-600';
}
