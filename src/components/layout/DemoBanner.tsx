import { useTranslation } from 'react-i18next';

export function DemoBanner() {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  return (
    <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
      {isEs
        ? 'Modo demo: datos de ejemplo. Configurá Supabase en .env para usar la app real.'
        : 'Demo mode: sample data. Configure Supabase in .env for the real app.'}
    </div>
  );
}
