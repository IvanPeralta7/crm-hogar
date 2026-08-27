import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { t } = useTranslation();
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result =
      mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-sanctuary-teal text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('app.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder={t('auth.fullName')}
              className="field-input"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('auth.email')}
            className="field-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={t('auth.password')}
            className="field-input"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sanctuary-teal text-white py-3 rounded-xl font-medium hover:bg-sanctuary-teal-dark disabled:opacity-50"
          >
            {loading
              ? mode === 'login'
                ? t('auth.loggingIn')
                : t('auth.registering')
              : mode === 'login'
                ? t('auth.login')
                : t('auth.register')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full mt-4 text-sm text-sanctuary-teal hover:underline"
        >
          {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
        </button>
      </div>
    </div>
  );
}
