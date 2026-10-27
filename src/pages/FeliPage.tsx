import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Package } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { FeliTasksSection } from '../components/feli/FeliTasksSection';
import { InventorySection } from '../components/feli/InventorySection';

type View = 'inventory' | 'tasks';

export function FeliPage() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('inventory');

  return (
    <>
      <TopBar title={t('feli.title')} />

      <nav className="flex gap-2 mb-6">
        <TabButton
          active={view === 'inventory'}
          onClick={() => setView('inventory')}
          icon={<Package size={18} />}
        >
          {t('feli.tabs.inventory')}
        </TabButton>
        <TabButton
          active={view === 'tasks'}
          onClick={() => setView('tasks')}
          icon={<CheckSquare size={18} />}
        >
          {t('feli.tabs.tasks')}
        </TabButton>
      </nav>

      {view === 'inventory' ? <InventorySection /> : <FeliTasksSection />}
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
