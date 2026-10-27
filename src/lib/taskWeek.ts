import type { Task } from '../types';

export function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

type WeekTask = Pick<Task, 'start_date' | 'end_date' | 'created_at' | 'status'>;

export function isTaskInWeek(task: WeekTask, weekStart: string, weekEnd: string) {
  const dates = [task.start_date, task.end_date, task.created_at.split('T')[0]].filter(
    Boolean,
  ) as string[];
  return dates.some((value) => value >= weekStart && value <= weekEnd);
}

export function getWeeklyStats<T extends WeekTask>(tasks: T[]) {
  const { start, end } = getWeekRange();
  const weeklyTasks = tasks.filter((task) => isTaskInWeek(task, start, end));
  const completed = weeklyTasks.filter((task) => task.status === 'completada').length;
  const remaining = weeklyTasks.length - completed;
  const progress =
    weeklyTasks.length > 0 ? Math.round((completed / weeklyTasks.length) * 100) : 0;

  return { weeklyTasks, completed, remaining, progress };
}
