import { Bell, Globe, Settings, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  title: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export function TopBar({ title, searchPlaceholder, showSearch = false }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const currentLang = i18n.language.startsWith('en') ? 'en' : 'es';

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {showSearch && searchPlaceholder && (
          <div className="hidden md:block relative">
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-64 pl-4 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sanctuary-teal/30"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setAppLanguage(currentLang === 'es' ? 'en' : 'es')}
          className="p-2 rounded-full hover:bg-white/80 text-gray-600"
          title={t('header.language')}
        >
          <Globe size={20} />
        </button>

        <button type="button" className="p-2 rounded-full hover:bg-white/80 text-gray-600 relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button type="button" className="p-2 rounded-full hover:bg-white/80 text-gray-600">
          <Settings size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-sanctuary-teal/20 flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={18} className="text-sanctuary-teal" />
          )}
        </div>
      </div>
    </header>
  );
}
