import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { InventoryItemFormData } from '../../types';

interface InventoryItemFormProps {
  categories: string[];
  onSubmit: (data: InventoryItemFormData) => Promise<void>;
}

const NEW_CATEGORY = '__new__';

const normalizeCategory = (value: string) => value.trim().replace(/\s+/g, ' ');

export function InventoryItemForm({ categories, onSubmit }: InventoryItemFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCategories = categories.length > 0;
  const isNewCategory = !hasCategories || selectedCategory === NEW_CATEGORY;
  const selectValue =
    selectedCategory === NEW_CATEGORY
      ? NEW_CATEGORY
      : (categories.find(
          (cat) =>
            cat.toLocaleLowerCase('es') === selectedCategory.toLocaleLowerCase('es'),
        ) ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = normalizeCategory(isNewCategory ? newCategory : selectValue);
    if (!category) return;

    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        quantity: Math.max(parseInt(quantity, 10) || 0, 0),
        category,
      });
      setName('');
      setDescription('');
      setQuantity('1');
      setSelectedCategory(category);
      setNewCategory('');
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
          {hasCategories && (
            <select
              value={selectValue}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="field-input"
            >
              <option value="" disabled>
                {t('feli.inventory.categorySelectPlaceholder')}
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ {t('feli.inventory.newCategory')}</option>
            </select>
          )}
          {isNewCategory && (
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
              autoFocus={hasCategories}
              className={`field-input ${hasCategories ? 'mt-2' : ''}`}
              placeholder={t('feli.inventory.newCategoryPlaceholder')}
            />
          )}
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
