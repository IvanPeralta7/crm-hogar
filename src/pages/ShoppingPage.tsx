import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Share2, ShoppingCart, Cross } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import {
  ShoppingItemForm,
  type ShoppingItemFormData,
} from '../components/shopping/ShoppingItemForm';
import { useAuth } from '../contexts/AuthContext';
import { mockShoppingItems, mockShoppingList } from '../data/mockData';
import { isDemoMode } from '../lib/demoMode';
import { getSupabase } from '../lib/supabaseClient';
import type { ShoppingItem, ShoppingList, ShoppingStore } from '../types';

const WEEKLY_BUDGET = 500;

const FREQUENT_ITEM_KEYS = [
  'paperTowels',
  'coffeeBeans',
  'dishSoap',
  'eggs',
  'bread',
] as const;

export function ShoppingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formStore, setFormStore] = useState<ShoppingStore>('supermercado');
  const [formDefaultName, setFormDefaultName] = useState('');

  const loadItems = useCallback(async (listId: string) => {
    if (isDemoMode) {
      setItems(mockShoppingItems.filter((item) => item.list_id === listId));
      return;
    }

    const { data, error } = await getSupabase()
      .from('shopping_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setItems(data ?? []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoMode) {
        setList(mockShoppingList);
        setItems(mockShoppingItems);
        return;
      }

      const supabase = getSupabase();
      const { data: lists, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('status', 'activa')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const activeList = lists?.[0] ?? null;
      setList(activeList);

      if (activeList) {
        await loadItems(activeList.id);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error loading shopping data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const ensureActiveList = useCallback(async (): Promise<ShoppingList> => {
    if (list) return list;
    if (!user) throw new Error(t('shopping.errorAuth'));

    if (isDemoMode) {
      const demoList: ShoppingList = {
        ...mockShoppingList,
        id: crypto.randomUUID(),
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      setList(demoList);
      return demoList;
    }

    const { data, error } = await getSupabase()
      .from('shopping_lists')
      .insert({
        name: t('shopping.defaultListName'),
        status: 'activa',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setList(data);
    return data;
  }, [list, user, t]);

  const handleAddItem = async (formData: ShoppingItemFormData) => {
    if (!user) throw new Error(t('shopping.errorAuth'));

    const activeList = await ensureActiveList();

    if (isDemoMode) {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        list_id: activeList.id,
        ...formData,
        is_purchased: false,
        added_by: user.id,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      return;
    }

    const { data, error } = await getSupabase()
      .from('shopping_items')
      .insert({
        list_id: activeList.id,
        ...formData,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [...prev, data]);
  };

  const handleTogglePurchased = async (item: ShoppingItem) => {
    const nextValue = !item.is_purchased;

    if (isDemoMode) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, is_purchased: nextValue } : row)),
      );
      return;
    }

    const { error } = await getSupabase()
      .from('shopping_items')
      .update({ is_purchased: nextValue })
      .eq('id', item.id);

    if (error) throw error;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, is_purchased: nextValue } : row)),
    );
  };

  const handleQuantityChange = async (item: ShoppingItem, delta: number) => {
    const nextQuantity = Math.max(Number(item.quantity) + delta, 0.01);

    if (isDemoMode) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, quantity: nextQuantity } : row)),
      );
      return;
    }

    const { error } = await getSupabase()
      .from('shopping_items')
      .update({ quantity: nextQuantity })
      .eq('id', item.id);

    if (error) throw error;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, quantity: nextQuantity } : row)),
    );
  };

  const openForm = (store: ShoppingStore = 'supermercado', defaultName = '') => {
    setFormStore(store);
    setFormDefaultName(defaultName);
    setFormOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: list?.name ?? t('shopping.title'), url });
      return;
    }
    await navigator.clipboard.writeText(url);
    alert(t('shopping.linkCopied'));
  };

  const estimatedTotal = items.reduce(
    (sum, item) => sum + (item.estimated_price ?? 0) * item.quantity,
    0,
  );

  const grouped = useMemo(() => {
    const groups: Record<ShoppingStore, ShoppingItem[]> = {
      supermercado: [],
      farmacia: [],
      otros: [],
    };
    items.forEach((item) => {
      groups[item.store].push(item);
    });
    return groups;
  }, [items]);

  const budgetUsed = Math.min(Math.round((estimatedTotal / WEEKLY_BUDGET) * 100), 100);
  const budgetLeft = Math.max(WEEKLY_BUDGET - estimatedTotal, 0);

  return (
    <>
      <TopBar title={t('shopping.title')} searchPlaceholder={t('header.searchShopping')} showSearch />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {list?.name ?? t('shopping.defaultListName')}
          </h2>
          <p className="text-sanctuary-teal font-medium mt-1">
            {t('shopping.estimatedTotal')}: ${estimatedTotal.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sanctuary-teal text-sanctuary-teal bg-white text-sm font-medium"
          >
            <Share2 size={18} />
            {t('shopping.shareList')}
          </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium"
          >
            <Plus size={18} />
            {t('shopping.addItem')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 mb-4">{t('shopping.emptyList')}</p>
              <button
                type="button"
                onClick={() => openForm()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium"
              >
                <Plus size={18} />
                {t('shopping.addItem')}
              </button>
            </div>
          ) : (
            (Object.keys(grouped) as ShoppingStore[]).map((store) => {
              const storeItems = grouped[store];
              if (storeItems.length === 0) return null;
              return (
                <StoreCard
                  key={store}
                  store={store}
                  items={storeItems}
                  onToggle={(item) => void handleTogglePurchased(item)}
                  onQuantityChange={(item, delta) => void handleQuantityChange(item, delta)}
                  onAddToStore={() => openForm(store)}
                />
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">{t('shopping.frequentItems')}</h3>
            <div className="flex flex-wrap gap-2">
              {FREQUENT_ITEM_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => openForm('supermercado', t(`shopping.frequent.${key}`))}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm hover:border-sanctuary-teal hover:text-sanctuary-teal"
                >
                  + {t(`shopping.frequent.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-sanctuary-teal rounded-2xl p-6 text-white">
            <div className="text-sm opacity-90 mb-1">{t('shopping.budgetStatus')}</div>
            <div className="text-2xl font-bold mb-4">
              {t('shopping.leftThisWeek', { amount: `$${budgetLeft.toFixed(2)}` })}
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-sanctuary-mint rounded-full transition-all"
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
            <div className="text-sm opacity-90">{t('shopping.used', { percent: budgetUsed })}</div>
          </div>
        </div>
      </div>

      <ShoppingItemForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddItem}
        defaultStore={formStore}
        defaultName={formDefaultName}
      />
    </>
  );
}

function StoreCard({
  store,
  items,
  onToggle,
  onQuantityChange,
  onAddToStore,
}: {
  store: ShoppingStore;
  items: ShoppingItem[];
  onToggle: (item: ShoppingItem) => void;
  onQuantityChange: (item: ShoppingItem, delta: number) => void;
  onAddToStore: () => void;
}) {
  const { t } = useTranslation();
  const icon =
    store === 'farmacia' ? (
      <Cross className="text-green-600" size={20} />
    ) : (
      <ShoppingCart className="text-sanctuary-teal" size={20} />
    );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        {icon}
        <h3 className="font-semibold">{t(`shopping.store.${store}`)}</h3>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
          {t('shopping.items', { count: items.length })}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 px-6 py-4 ${item.is_purchased ? 'opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={item.is_purchased}
              onChange={() => onToggle(item)}
              className="w-5 h-5 rounded accent-sanctuary-teal cursor-pointer"
            />
            <div className={`flex-1 ${item.is_purchased ? 'line-through text-gray-500' : ''}`}>
              {item.name}
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 text-sm">
              <button
                type="button"
                onClick={() => onQuantityChange(item, -1)}
                className="text-gray-400 hover:text-gray-700"
              >
                <Minus size={14} />
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(item, 1)}
                className="text-gray-400 hover:text-gray-700"
              >
                <Plus size={14} />
              </button>
            </div>
            {item.estimated_price != null && (
              <span className="text-sm font-medium w-16 text-right">
                ${(item.estimated_price * item.quantity).toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddToStore}
        className="w-full py-3 text-sm text-sanctuary-teal border-t border-dashed border-gray-200 hover:bg-gray-50"
      >
        + {t('shopping.addToStore', { store: t(`shopping.store.${store}`) })}
      </button>
    </div>
  );
}
