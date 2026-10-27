import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { TaskCard } from '../tasks/TaskCard';
import { TaskForm } from '../tasks/TaskForm';
import { SummaryCard, WeeklyProgressCard } from '../tasks/TaskSummary';
import { useAuth } from '../../contexts/AuthContext';
import { mockFeliTasks } from '../../data/mockData';
import { isDemoMode } from '../../lib/demoMode';
import { getSupabase } from '../../lib/supabaseClient';
import { getWeeklyStats } from '../../lib/taskWeek';
import type { FeliTask, FeliTaskFormData } from '../../types';

let demoFeliTasks: FeliTask[] = [...mockFeliTasks];

export function FeliTasksSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<FeliTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FeliTask | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setTasks([...demoFeliTasks]);
        return;
      }

      const { data, error } = await getSupabase()
        .from('feli_tasks')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;
      setTasks(data ?? []);
    } catch (err) {
      console.error('Error loading Feli tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const pendingCount = tasks.filter((task) => task.status === 'pendiente').length;
  const completedCount = tasks.filter((task) => task.status === 'completada').length;
  const urgentCount = tasks.filter((task) => task.priority === 'urgente').length;
  const { completed, remaining, progress } = getWeeklyStats(tasks);

  const handleSaveTask = async (formData: FeliTaskFormData) => {
    if (!user) throw new Error(t('tasks.errorAuth'));

    const payload = {
      title: formData.title,
      description: formData.description || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      priority: formData.priority,
      status: formData.status,
      updated_at: new Date().toISOString(),
    };

    if (isDemoMode) {
      if (editingTask) {
        demoFeliTasks = demoFeliTasks.map((task) =>
          task.id === editingTask.id ? { ...task, ...payload } : task,
        );
      } else {
        demoFeliTasks = [
          ...demoFeliTasks,
          {
            id: crypto.randomUUID(),
            ...payload,
            created_by: user.id,
            created_at: new Date().toISOString(),
          },
        ];
      }
      setTasks([...demoFeliTasks]);
      return;
    }

    if (editingTask) {
      const { error } = await getSupabase()
        .from('feli_tasks')
        .update(payload)
        .eq('id', editingTask.id);
      if (error) throw error;
    } else {
      const { error } = await getSupabase().from('feli_tasks').insert({
        ...payload,
        created_by: user.id,
      });
      if (error) throw error;
    }

    await loadTasks();
  };

  const handleToggleStatus = async (task: FeliTask) => {
    const nextStatus = task.status === 'completada' ? 'pendiente' : 'completada';

    if (isDemoMode) {
      demoFeliTasks = demoFeliTasks.map((row) =>
        row.id === task.id ? { ...row, status: nextStatus } : row,
      );
      setTasks([...demoFeliTasks]);
      return;
    }

    const { error } = await getSupabase()
      .from('feli_tasks')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', task.id);

    if (error) {
      console.error('Error updating Feli task:', error);
      return;
    }
    setTasks((prev) =>
      prev.map((row) => (row.id === task.id ? { ...row, status: nextStatus } : row)),
    );
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEditForm = (task: FeliTask) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label={t('tasks.summaryTotal')} value={String(tasks.length)} />
        <SummaryCard label={t('tasks.summaryPending')} value={String(pendingCount)} />
        <SummaryCard label={t('tasks.summaryCompleted')} value={String(completedCount)} />
        <SummaryCard label={t('tasks.summaryUrgent')} value={String(urgentCount)} />
      </div>

      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium"
        >
          <Plus size={18} />
          {t('tasks.addTask')}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-900">{t('feli.tasks.listTitle')}</h2>
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              {t('tasks.empty')}
            </div>
          ) : (
            tasks.map((task) => (
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
        showCategory={false}
      />
    </>
  );
}
