import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Plus } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { ExpenseList } from '../components/expenses/ExpenseList';

type View = 'form' | 'list';

export function ExpensesPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('list');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <TopBar title={t('expenses.title')} />

      <nav className="flex gap-2 mb-6">
        <TabButton active={view === 'form'} onClick={() => setView('form')} icon={<Plus size={18} />}>
          {t('expenses.register')}
        </TabButton>
        <TabButton active={view === 'list'} onClick={() => setView('list')} icon={<List size={18} />}>
          {t('expenses.viewList')}
        </TabButton>
      </nav>

      {view === 'form' ? (
        <ExpenseForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      ) : (
        <ExpenseList key={refreshKey} />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-sanctuary-teal text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
