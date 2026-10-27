import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Tag, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { InventoryItemForm } from './InventoryItemForm';
import { useAuth } from '../../contexts/AuthContext';
import { mockInventoryItems } from '../../data/mockData';
import { isDemoMode } from '../../lib/demoMode';
import { getSupabase } from '../../lib/supabaseClient';
import type { InventoryItem, InventoryItemFormData } from '../../types';

let demoInventoryItems: InventoryItem[] = [...mockInventoryItems];

type CategoryGroup = {
  key: string;
  label: string;
  items: InventoryItem[];
};

const categoryKey = (category: string) => category.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

export function InventorySection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setItems([...demoInventoryItems]);
        return;
      }

      const { data, error } = await getSupabase()
        .from('feli_inventory_items')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data ?? []);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const groups = useMemo<CategoryGroup[]>(() => {
    const byKey = new Map<string, CategoryGroup>();
    items.forEach((item) => {
      const key = categoryKey(item.category);
      const group = byKey.get(key);
      if (group) {
        group.items.push(item);
      } else {
        byKey.set(key, { key, label: item.category.trim(), items: [item] });
      }
    });
    return [...byKey.values()]
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [items]);

  const categoryLabels = useMemo(() => groups.map((group) => group.label), [groups]);

  const handleAdd = async (formData: InventoryItemFormData) => {
    if (!user) throw new Error(t('feli.inventory.errorAuth'));

    // Reuse the existing spelling so "ropa" and "Ropa" end up in the same group.
    const existing = groups.find((group) => group.key === categoryKey(formData.category));
    const payload = { ...formData, category: existing?.label ?? formData.category };

    if (isDemoMode) {
      const now = new Date().toISOString();
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        ...payload,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      };
      demoInventoryItems = [...demoInventoryItems, newItem];
      setItems((prev) => [...prev, newItem]);
      return;
    }

    const { data, error } = await getSupabase()
      .from('feli_inventory_items')
      .insert({ ...payload, created_by: user.id })
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [...prev, data]);
  };

  const handleQuantityChange = async (item: InventoryItem, delta: number) => {
    const nextQuantity = Math.max(item.quantity + delta, 0);
    if (nextQuantity === item.quantity) return;

    const applyLocally = () =>
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, quantity: nextQuantity } : row)),
      );

    if (isDemoMode) {
      demoInventoryItems = demoInventoryItems.map((row) =>
        row.id === item.id ? { ...row, quantity: nextQuantity } : row,
      );
      applyLocally();
      return;
    }

    const { error } = await getSupabase()
      .from('feli_inventory_items')
      .update({ quantity: nextQuantity })
      .eq('id', item.id);

    if (error) {
      console.error('Error updating quantity:', error);
      return;
    }
    applyLocally();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      if (isDemoMode) {
        demoInventoryItems = demoInventoryItems.filter((row) => row.id !== itemToDelete.id);
      } else {
        const { error } = await getSupabase()
          .from('feli_inventory_items')
          .delete()
          .eq('id', itemToDelete.id);
        if (error) throw error;
      }
      setItems((prev) => prev.filter((row) => row.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting inventory item:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <InventoryItemForm categories={categoryLabels} onSubmit={handleAdd} />

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
            {t('common.loading')}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
            {t('feli.inventory.empty')}
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.key}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <Tag className="text-sanctuary-teal" size={20} />
                <h3 className="font-semibold">{group.label}</h3>
                <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {t('feli.inventory.itemsCount', { count: group.items.length })}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 break-words">{item.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 text-sm">
                      <button
                        type="button"
                        onClick={() => void handleQuantityChange(item, -1)}
                        disabled={item.quantity === 0}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                        aria-label={t('feli.inventory.decrease')}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[2ch] text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => void handleQuantityChange(item, 1)}
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={t('feli.inventory.increase')}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={itemToDelete != null}
        title={t('common.delete')}
        message={t('feli.inventory.deleteConfirm', { name: itemToDelete?.name ?? '' })}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setItemToDelete(null)}
        isLoading={deleting}
      />
    </div>
  );
}
