import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { TaskForm } from '../components/tasks/TaskForm';
import { useAuth } from '../contexts/AuthContext';
import { mockTasks } from '../data/mockData';
import { isDemoMode } from '../lib/demoMode';
import { getSupabase } from '../lib/supabaseClient';
import { getWeeklyStats } from '../lib/taskWeek';
import { TASK_CATEGORIES, type Task, type TaskCategory, type TaskFormData } from '../types';

const FILTERS: Array<TaskCategory | 'all'> = ['all', ...TASK_CATEGORIES];

export function TasksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setTasks(mockTasks);
        return;
      }

      const { data, error } = await getSupabase()
        .from('tasks')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;
      setTasks(data ?? []);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.category === filter)),
    [tasks, filter],
  );

  const pendingCount = tasks.filter((task) => task.status === 'pendiente').length;
  const completedCount = tasks.filter((task) => task.status === 'completada').length;
  const urgentCount = tasks.filter((task) => task.priority === 'urgente').length;
  const { completed, remaining, progress } = getWeeklyStats(tasks);

  const handleSaveTask = async (formData: TaskFormData) => {
    if (!user) throw new Error(t('tasks.errorAuth'));

    const payload = {
      title: formData.title,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      category: formData.category,
      priority: formData.priority,
      status: formData.status,
      updated_at: new Date().toISOString(),
    };

    if (isDemoMode) {
      if (editingTask) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id ? { ...task, ...payload, description: formData.description } : task,
          ),
        );
      } else {
        setTasks((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            ...payload,
            description: formData.description,
            created_by: user.id,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    if (editingTask) {
      const { error } = await getSupabase().from('tasks').update(payload).eq('id', editingTask.id);
      if (error) throw error;
    } else {
      const { error } = await getSupabase().from('tasks').insert({
        ...payload,
        created_by: user.id,
      });
      if (error) throw error;
    }

    await loadTasks();
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'completada' ? 'pendiente' : 'completada';

    if (isDemoMode) {
      setTasks((prev) =>
        prev.map((row) => (row.id === task.id ? { ...row, status: nextStatus } : row)),
      );
      return;
    }

    const { error } = await getSupabase()
      .from('tasks')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) throw error;
    setTasks((prev) =>
      prev.map((row) => (row.id === task.id ? { ...row, status: nextStatus } : row)),
    );
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <>
      <TopBar title={t('tasks.title')} searchPlaceholder={t('header.searchTasks')} showSearch />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label={t('tasks.summaryTotal')} value={String(tasks.length)} />
        <SummaryCard label={t('tasks.summaryPending')} value={String(pendingCount)} />
        <SummaryCard label={t('tasks.summaryCompleted')} value={String(completedCount)} />
        <SummaryCard label={t('tasks.summaryUrgent')} value={String(urgentCount)} />
      </div>

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

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium self-start"
        >
          <Plus size={18} />
          {t('tasks.addTask')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('tasks.listTitle')}</h2>
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              {t('tasks.empty')}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => void handleToggleStatus(task)}
                onEdit={() => openEditForm(task)}
              />
            ))
          )}
        </div>

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
      </div>

      <TaskForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        initialTask={editingTask}
      />
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onEdit,
}: {
  task: Task;
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
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {t(`tasks.category.${task.category}`)}
            </span>
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

function criticalityBadge(priority: Task['priority']) {
  if (priority === 'urgente') return 'bg-red-100 text-red-700';
  if (priority === 'prioritaria') return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-600';
}
