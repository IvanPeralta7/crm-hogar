import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ShoppingStore } from '../../types';

export interface ShoppingItemFormData {
  name: string;
  quantity: number;
  unit: string;
  store: ShoppingStore;
  category: ExpenseCategory;
  estimated_price: number | null;
}

interface ShoppingItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShoppingItemFormData) => Promise<void>;
  defaultStore?: ShoppingStore;
  defaultName?: string;
}

const UNITS = ['unidad', 'kg', 'litro'] as const;

const STORE_DEFAULT_CATEGORY: Record<ShoppingStore, ExpenseCategory> = {
  supermercado: 'supermercado',
  farmacia: 'farmacia',
  otros: 'supermercado',
};

export function ShoppingItemForm({
  isOpen,
  onClose,
  onSubmit,
  defaultStore = 'supermercado',
  defaultName = '',
}: ShoppingItemFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<string>('unidad');
  const [store, setStore] = useState<ShoppingStore>(defaultStore);
  const [category, setCategory] = useState<ExpenseCategory>(STORE_DEFAULT_CATEGORY[defaultStore]);
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(defaultName);
    setQuantity('1');
    setUnit('unidad');
    setStore(defaultStore);
    setCategory(STORE_DEFAULT_CATEGORY[defaultStore]);
    setPrice('');
    setError(null);
  }, [isOpen, defaultStore, defaultName]);

  if (!isOpen) return null;

  const handleStoreChange = (nextStore: ShoppingStore) => {
    setStore(nextStore);
    setCategory(STORE_DEFAULT_CATEGORY[nextStore]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        quantity: Math.max(parseFloat(quantity) || 1, 0.01),
        unit,
        store,
        category,
        estimated_price: price ? parseFloat(price) : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shopping.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{t('shopping.formTitle')}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shopping.nameLabel')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field-input"
              placeholder={t('shopping.namePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('shopping.quantityLabel')} *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="field-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('shopping.unitLabel')}
              </label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="field-input">
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {t(`shopping.units.${u}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shopping.storeLabel')} *
            </label>
            <select
              value={store}
              onChange={(e) => handleStoreChange(e.target.value as ShoppingStore)}
              className="field-input"
            >
              <option value="supermercado">{t('shopping.store.supermercado')}</option>
              <option value="farmacia">{t('shopping.store.farmacia')}</option>
              <option value="otros">{t('shopping.store.otros')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shopping.categoryLabel')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="field-input"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`expenses.categories.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('shopping.priceLabel')}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="field-input"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white hover:bg-sanctuary-teal-dark disabled:opacity-50"
            >
              {saving ? t('shopping.saving') : t('shopping.saveItem')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
