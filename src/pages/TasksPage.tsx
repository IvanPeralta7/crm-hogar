import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskForm } from '../components/tasks/TaskForm';
import { SummaryCard, WeeklyProgressCard } from '../components/tasks/TaskSummary';
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

        <WeeklyProgressCard completed={completed} remaining={remaining} progress={progress} />
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
