import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, ShoppingCart, Cross } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import {
  ShoppingItemForm,
  type ShoppingItemFormData,
} from '../components/shopping/ShoppingItemForm';
import { useAuth } from '../contexts/AuthContext';
import { mockPurchasedHistory, mockShoppingItems, mockShoppingList } from '../data/mockData';
import { isDemoMode } from '../lib/demoMode';
import { aggregateMostPurchased } from '../lib/shoppingStats';
import { getSupabase } from '../lib/supabaseClient';
import type { MostPurchasedItem, ShoppingItem, ShoppingList, ShoppingStore } from '../types';

export function ShoppingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [mostPurchased, setMostPurchased] = useState<MostPurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const loadMostPurchased = useCallback(async () => {
    if (isDemoMode) {
      setMostPurchased(aggregateMostPurchased(mockPurchasedHistory));
      return;
    }

    const { data, error } = await getSupabase()
      .from('shopping_items')
      .select('name, quantity')
      .eq('is_purchased', true);

    if (error) throw error;

    const aggregated = aggregateMostPurchased(
      (data ?? []).map((row, index) => ({
        id: String(index),
        list_id: '',
        name: row.name,
        quantity: Number(row.quantity),
        unit: 'unidad',
        store: 'supermercado' as ShoppingStore,
        category: 'supermercado',
        is_purchased: true,
        estimated_price: null,
        added_by: '',
        created_at: '',
      })),
    );
    setMostPurchased(aggregated);
  }, []);

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
        await loadMostPurchased();
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

      await loadMostPurchased();
    } catch (err) {
      console.error('Error loading shopping data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadItems, loadMostPurchased]);

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
    const payload = { ...formData, store: 'supermercado' as ShoppingStore };

    if (isDemoMode) {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        list_id: activeList.id,
        ...payload,
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
        ...payload,
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
      if (nextValue) {
        setMostPurchased(aggregateMostPurchased([...mockPurchasedHistory, { ...item, is_purchased: true }]));
      }
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
    await loadMostPurchased();
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

  const supermarketItems = grouped.supermercado;

  return (
    <>
      <TopBar title={t('shopping.title')} searchPlaceholder={t('header.searchShopping')} showSearch />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {list?.name ?? t('shopping.defaultListName')}
        </h2>
        <p className="text-sanctuary-teal font-medium mt-1">
          {t('shopping.estimatedTotal')}: ${estimatedTotal.toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          ) : (
            <>
              <StoreCard
                store="supermercado"
                items={supermarketItems}
                onToggle={(item) => void handleTogglePurchased(item)}
                onQuantityChange={(item, delta) => void handleQuantityChange(item, delta)}
                onAddToStore={() => setFormOpen(true)}
                showAddButton
              />
              {(Object.keys(grouped) as ShoppingStore[])
                .filter((store) => store !== 'supermercado')
                .map((store) => {
                  const storeItems = grouped[store];
                  if (storeItems.length === 0) return null;
                  return (
                    <StoreCard
                      key={store}
                      store={store}
                      items={storeItems}
                      onToggle={(item) => void handleTogglePurchased(item)}
                      onQuantityChange={(item, delta) => void handleQuantityChange(item, delta)}
                      onAddToStore={() => undefined}
                      showAddButton={false}
                    />
                  );
                })}
            </>
          )}
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">{t('shopping.mostPurchased')}</h3>
            {mostPurchased.length === 0 ? (
              <p className="text-sm text-gray-500">{t('shopping.noPurchasedYet')}</p>
            ) : (
              <div className="space-y-3">
                {mostPurchased.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800">{item.name}</span>
                    <span className="font-medium text-sanctuary-teal">
                      {item.totalQuantity} {t('shopping.unitsLabel')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ShoppingItemForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddItem}
        defaultStore="supermercado"
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
  showAddButton,
}: {
  store: ShoppingStore;
  items: ShoppingItem[];
  onToggle: (item: ShoppingItem) => void;
  onQuantityChange: (item: ShoppingItem, delta: number) => void;
  onAddToStore: () => void;
  showAddButton: boolean;
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
      {items.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-500">{t('shopping.emptyStore')}</div>
      ) : (
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
      )}
      {showAddButton && (
        <button
          type="button"
          onClick={onAddToStore}
          className="w-full py-3 text-sm text-sanctuary-teal border-t border-dashed border-gray-200 hover:bg-gray-50"
        >
          + {t('shopping.addToStore', { store: t(`shopping.store.${store}`) })}
        </button>
      )}
    </div>
  );
}
