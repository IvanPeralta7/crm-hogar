import { useTranslation } from 'react-i18next';

export function SetupPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-14 h-14 rounded-full bg-sanctuary-teal text-white flex items-center justify-center text-2xl font-bold mb-4">
          S
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('setup.title')}</h1>
        <p className="text-gray-700 mb-4">{t('setup.description')}</p>
        <pre className="bg-gray-900 text-gray-100 text-sm rounded-xl p-4 overflow-x-auto">
          {`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key`}
        </pre>
        <p className="text-sm text-gray-600 mt-4">{t('setup.restart')}</p>
      </div>
    </div>
  );
}
