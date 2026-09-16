import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabase } from '../../lib/supabaseClient';
import { todayLocalDateString } from '../../lib/dates';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../../types';
import { Plus } from 'lucide-react';

interface ExpenseFormProps {
  onSuccess?: () => void;
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayLocalDateString());
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('supermercado');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await getSupabase().from('expenses').insert({
        title,
        description,
        date,
        amount: parseFloat(amount),
        category,
        user_id: user.id,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: t('expenses.success') });
      setTitle('');
      setDescription('');
      setDate(todayLocalDateString());
      setAmount('');
      setCategory('supermercado');
      onSuccess?.();
    } catch (error) {
      setMessage({ type: 'error', text: t('expenses.error') });
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('expenses.formTitle')}</h2>

        {message && (
          <div
            className={`mb-4 p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('expenses.titleLabel')} required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="field-input"
              placeholder="Ej: Compra semanal"
            />
          </Field>

          <Field label={t('expenses.descriptionLabel')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="field-input"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('expenses.dateLabel')} required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="field-input"
              />
            </Field>
            <Field label={t('expenses.amountLabel')} required>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
                className="field-input"
              />
            </Field>
          </div>

          <Field label={t('expenses.categoryLabel')} required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              required
              className="field-input"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`expenses.categories.${cat}`)}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sanctuary-teal text-white py-3 px-4 rounded-xl hover:bg-sanctuary-teal-dark disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {isSubmitting ? t('expenses.saving') : t('expenses.save')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && ' *'}
      </label>
      {children}
    </div>
  );
}
