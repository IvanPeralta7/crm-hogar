import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { InventoryItemFormData } from '../../types';

interface InventoryItemFormProps {
  categories: string[];
  onSubmit: (data: InventoryItemFormData) => Promise<void>;
}

export function InventoryItemForm({ categories, onSubmit }: InventoryItemFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        quantity: Math.max(parseInt(quantity, 10) || 0, 0),
        category: category.trim().replace(/\s+/g, ' '),
      });
      setName('');
      setDescription('');
      setQuantity('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('feli.inventory.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
    >
      <h3 className="font-semibold text-gray-900">{t('feli.inventory.formTitle')}</h3>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('feli.inventory.nameLabel')} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field-input"
            placeholder={t('feli.inventory.namePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('feli.inventory.categoryLabel')} *
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            list="feli-inventory-categories"
            className="field-input"
            placeholder={t('feli.inventory.categoryPlaceholder')}
          />
          <datalist id="feli-inventory-categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('feli.inventory.descriptionLabel')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="field-input"
            placeholder={t('feli.inventory.descriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('feli.inventory.quantityLabel')} *
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            min="0"
            step="1"
            className="field-input"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium hover:bg-sanctuary-teal-dark disabled:opacity-50"
        >
          <Plus size={18} />
          {saving ? t('feli.inventory.saving') : t('feli.inventory.save')}
        </button>
      </div>
    </form>
  );
}
