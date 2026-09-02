import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingCart,
  Wallet,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/tareas', icon: CheckSquare, labelKey: 'nav.tasks' },
  { to: '/compras', icon: ShoppingCart, labelKey: 'nav.shopping' },
  { to: '/gastos', icon: Wallet, labelKey: 'nav.expenses' },
] as const;

export function Sidebar() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-gray-200 min-h-screen">
        <div className="p-6">
          <div>
            <div className="font-bold text-sanctuary-teal text-lg leading-tight">{t('app.name')}</div>
            <div className="text-xs text-gray-500">{t('app.subtitle')}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, labelKey }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'bg-gray-100 text-sanctuary-teal'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {t(labelKey)}
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sanctuary-teal rounded-l-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4">
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-2 pb-safe">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, labelKey }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  isActive ? 'text-sanctuary-teal' : 'text-gray-500'
                }`}
              >
                <Icon size={20} />
                <span>{t(labelKey)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
