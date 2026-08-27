import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ShoppingCart, Wallet, Plus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { getSupabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';
import { mockExpenses, mockShoppingItems, mockTasks } from '../data/mockData';
import { getTimeGreetingKey } from '../lib/getTimeGreeting';
import type { Expense, ExpenseCategory, Task } from '../types';

const CHART_COLORS = ['#006D6D', '#4CAF93', '#A78BFA'];

export function DashboardPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shoppingCount, setShoppingCount] = useState(0);
  const [listCount, setListCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (isDemoMode) {
        setTasks(mockTasks.filter((task) => task.status !== 'completada'));
        setExpenses(mockExpenses);
        setShoppingCount(mockShoppingItems.filter((item) => !item.is_purchased).length);
        setListCount(1);
        return;
      }

      const supabase = getSupabase();
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const [tasksRes, expensesRes, itemsRes, listsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .neq('status', 'completada')
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('expenses').select('*').gte('date', monthStart),
        supabase.from('shopping_items').select('id').eq('is_purchased', false),
        supabase.from('shopping_lists').select('id').eq('status', 'activa'),
      ]);

      setTasks(tasksRes.data ?? []);
      setExpenses(expensesRes.data ?? []);
      setShoppingCount(itemsRes.data?.length ?? 0);
      setListCount(listsRes.data?.length ?? 0);
    }

    void load();
  }, []);

  const pendingTasks = tasks.length;
  const highPriority = tasks.filter((task) => task.priority === 'alta').length;
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const expensesByCategory = useMemo(() => {
    const totals = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
      return acc;
    }, {});

    return Object.entries(totals)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 3)
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount: amount ?? 0,
        percent: totalExpenses > 0 ? Math.round(((amount ?? 0) / totalExpenses) * 100) : 0,
      }));
  }, [expenses, totalExpenses]);

  const latestItems = [
    { name: 'Milk', category: 'supermercado' },
    { name: 'Detergent', category: 'supermercado' },
    { name: 'Coffee Beans', category: 'supermercado' },
  ];

  const greeting = t(getTimeGreetingKey());

  return (
    <>
      <TopBar title={greeting} />
      <p className="text-gray-600 -mt-4 mb-8">{t('dashboard.subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<CheckCircle2 className="text-sanctuary-teal" size={28} />}
          label={t('dashboard.tasksPending')}
          value={String(pendingTasks)}
          sub={t('dashboard.highPriority', { count: highPriority })}
        />
        <StatCard
          icon={<ShoppingCart className="text-sanctuary-green" size={28} />}
          label={t('dashboard.itemsToBuy')}
          value={String(shoppingCount)}
          sub={t('dashboard.acrossLists', { count: listCount || 1 })}
        />
        <StatCard
          icon={<Wallet className="text-indigo-500" size={28} />}
          label={t('dashboard.totalExpenses')}
          value={`$${totalExpenses.toFixed(0)}`}
          sub={t('dashboard.thisMonth')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{t('dashboard.upcomingTasks')}</h2>
            <Link to="/tareas" className="text-sm text-sanctuary-teal hover:underline">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500">{t('common.loading')}</p>
            ) : (
              tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {t(`tasks.category.${task.category}`)} • {task.due_date ?? '—'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityClass(task.priority)}`}>
                    {t(`tasks.priority.${task.priority}`)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-lg mb-4">{t('dashboard.latestPurchases')}</h2>
          <div className="space-y-3">
            {latestItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100" />
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{t(`expenses.categories.${item.category}`)}</div>
                  </div>
                </div>
                <button type="button" className="text-sanctuary-teal">
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-lg mb-2">{t('dashboard.recentSpending')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('dashboard.spendingBreakdown')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            {expensesByCategory.map(({ category, percent }, index) => (
              <div key={category} className="flex items-center gap-3 text-sm">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index] ?? '#ccc' }}
                />
                <span className="text-gray-700">{t(`expenses.categories.${category}`)}</span>
                <span className="ml-auto font-medium">{percent}%</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-full border-[12px] border-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold">${totalExpenses.toFixed(0)}</div>
                <div className="text-xs text-gray-500">{t('dashboard.total')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="mb-3">{icon}</div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

function priorityClass(priority: Task['priority']) {
  if (priority === 'alta') return 'bg-red-100 text-red-700';
  if (priority === 'media') return 'bg-indigo-100 text-indigo-700';
  return 'bg-gray-100 text-gray-600';
}
