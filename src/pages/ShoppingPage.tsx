import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Minus, Plus, ShoppingCart, Cross, Save } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import {
  ShoppingItemForm,
  type ShoppingItemFormData,
} from '../components/shopping/ShoppingItemForm';
import { useAuth } from '../contexts/AuthContext';
import {
  mockPurchasedHistory,
  mockShoppingItems,
  mockShoppingList,
  mockShoppingLists,
} from '../data/mockData';
import { formatLocalDate, todayLocalDateString } from '../lib/dates';
import { isDemoMode } from '../lib/demoMode';
import { aggregateMostPurchased } from '../lib/shoppingStats';
import { getSupabase } from '../lib/supabaseClient';
import type { MostPurchasedItem, ShoppingItem, ShoppingList, ShoppingStore } from '../types';

type DemoListsState = {
  lists: ShoppingList[];
  items: ShoppingItem[];
};

let demoListsState: DemoListsState = {
  lists: [...mockShoppingLists],
  items: [...mockShoppingItems],
};

export function ShoppingPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en-US' : 'es-AR';
  const { user } = useAuth();
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [archivedLists, setArchivedLists] = useState<ShoppingList[]>([]);
  const [viewListId, setViewListId] = useState<string | 'active'>('active');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [mostPurchased, setMostPurchased] = useState<MostPurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [totalSpentInput, setTotalSpentInput] = useState('');
  const [savingTotal, setSavingTotal] = useState(false);

  const viewingList = useMemo(() => {
    if (viewListId === 'active') return activeList;
    return archivedLists.find((row) => row.id === viewListId) ?? activeList;
  }, [activeList, archivedLists, viewListId]);

  const isReadOnly = viewingList?.status === 'completada';

  useEffect(() => {
    if (viewingList) {
      setTotalSpentInput(
        viewingList.total_spent != null ? String(viewingList.total_spent) : '',
      );
    }
  }, [viewingList?.id, viewingList?.total_spent]);

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
      setItems(demoListsState.items.filter((item) => item.list_id === listId));
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

  const loadLists = useCallback(async () => {
    if (isDemoMode) {
      const active = demoListsState.lists.find((row) => row.status === 'activa') ?? null;
      const archived = demoListsState.lists
        .filter((row) => row.status === 'completada')
        .sort((a, b) => b.list_date.localeCompare(a.list_date));
      setActiveList(active);
      setArchivedLists(archived);
      return active;
    }

    const supabase = getSupabase();
    const { data: activeRows, error: activeError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('status', 'activa')
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeError) throw activeError;

    const { data: archivedRows, error: archivedError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('status', 'completada')
      .order('list_date', { ascending: false });

    if (archivedError) throw archivedError;

    const active = activeRows?.[0] ?? null;
    setActiveList(active);
    setArchivedLists(archivedRows ?? []);
    return active;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const active = await loadLists();
      const listId =
        viewListId === 'active' ? active?.id : viewListId !== 'active' ? viewListId : active?.id;

      if (listId) {
        await loadItems(listId);
      } else {
        setItems([]);
      }

      await loadMostPurchased();
    } catch (err) {
      console.error('Error loading shopping data:', err);
    } finally {
      setLoading(false);
    }
  }, [loadItems, loadLists, loadMostPurchased, viewListId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!viewingList?.id) return;
    void loadItems(viewingList.id);
  }, [viewingList?.id, loadItems]);

  const ensureActiveList = useCallback(async (): Promise<ShoppingList> => {
    if (activeList) return activeList;
    if (!user) throw new Error(t('shopping.errorAuth'));

    const listDate = todayLocalDateString();

    if (isDemoMode) {
      const demoList: ShoppingList = {
        ...mockShoppingList,
        id: crypto.randomUUID(),
        list_date: listDate,
        total_spent: null,
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      demoListsState.lists = [demoList, ...demoListsState.lists.filter((l) => l.status !== 'activa')];
      setActiveList(demoList);
      setViewListId('active');
      return demoList;
    }

    const { data, error } = await getSupabase()
      .from('shopping_lists')
      .insert({
        name: t('shopping.defaultListName'),
        status: 'activa',
        list_date: listDate,
        total_spent: null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setActiveList(data);
    setViewListId('active');
    return data;
  }, [activeList, user, t]);

  const handleAddItem = async (formData: ShoppingItemFormData) => {
    if (!user) throw new Error(t('shopping.errorAuth'));
    if (isReadOnly) return;

    const list = await ensureActiveList();
    const payload = { ...formData, store: 'supermercado' as ShoppingStore };

    if (isDemoMode) {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        list_id: list.id,
        ...payload,
        is_purchased: false,
        added_by: user.id,
        created_at: new Date().toISOString(),
      };
      demoListsState.items = [...demoListsState.items, newItem];
      setItems((prev) => [...prev, newItem]);
      return;
    }

    const { data, error } = await getSupabase()
      .from('shopping_items')
      .insert({
        list_id: list.id,
        ...payload,
        added_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [...prev, data]);
  };

  const handleTogglePurchased = async (item: ShoppingItem) => {
    if (isReadOnly) return;
    const nextValue = !item.is_purchased;

    if (isDemoMode) {
      demoListsState.items = demoListsState.items.map((row) =>
        row.id === item.id ? { ...row, is_purchased: nextValue } : row,
      );
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, is_purchased: nextValue } : row)),
      );
      if (nextValue) {
        setMostPurchased(
          aggregateMostPurchased([...mockPurchasedHistory, { ...item, is_purchased: true }]),
        );
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
    if (isReadOnly) return;
    const nextQuantity = Math.max(Number(item.quantity) + delta, 0.01);

    if (isDemoMode) {
      demoListsState.items = demoListsState.items.map((row) =>
        row.id === item.id ? { ...row, quantity: nextQuantity } : row,
      );
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

  const handleSaveTotalSpent = async () => {
    if (!viewingList || !user) return;
    const parsed = totalSpentInput.trim() === '' ? null : parseFloat(totalSpentInput);
    if (parsed != null && Number.isNaN(parsed)) return;

    setSavingTotal(true);
    try {
      if (isDemoMode) {
        demoListsState.lists = demoListsState.lists.map((row) =>
          row.id === viewingList.id ? { ...row, total_spent: parsed } : row,
        );
        if (viewingList.id === activeList?.id) {
          setActiveList((prev) => (prev ? { ...prev, total_spent: parsed } : prev));
        } else {
          setArchivedLists((prev) =>
            prev.map((row) => (row.id === viewingList.id ? { ...row, total_spent: parsed } : row)),
          );
        }
        return;
      }

      const { data, error } = await getSupabase()
        .from('shopping_lists')
        .update({ total_spent: parsed })
        .eq('id', viewingList.id)
        .select()
        .single();

      if (error) throw error;

      if (data.status === 'activa') {
        setActiveList(data);
      } else {
        setArchivedLists((prev) => prev.map((row) => (row.id === data.id ? data : row)));
      }
    } catch (err) {
      console.error('Error saving total:', err);
    } finally {
      setSavingTotal(false);
    }
  };

  const handleNewList = async () => {
    if (!user) return;

    const listDate = todayLocalDateString();

    try {
      if (isDemoMode) {
        if (activeList) {
          demoListsState.lists = demoListsState.lists.map((row) =>
            row.id === activeList.id ? { ...row, status: 'completada' as const } : row,
          );
        }
        const newList: ShoppingList = {
          id: crypto.randomUUID(),
          name: t('shopping.defaultListName'),
          status: 'activa',
          list_date: listDate,
          total_spent: null,
          created_by: user.id,
          created_at: new Date().toISOString(),
        };
        demoListsState.lists = [newList, ...demoListsState.lists];
        setViewListId('active');
        await loadLists();
        await loadItems(newList.id);
        return;
      }

      if (activeList) {
        const { error } = await getSupabase()
          .from('shopping_lists')
          .update({ status: 'completada' })
          .eq('id', activeList.id);
        if (error) throw error;
      }

      const { data, error } = await getSupabase()
        .from('shopping_lists')
        .insert({
          name: t('shopping.defaultListName'),
          status: 'activa',
          list_date: listDate,
          total_spent: null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setViewListId('active');
      setActiveList(data);
      setItems([]);
      const archived = await getSupabase()
        .from('shopping_lists')
        .select('*')
        .eq('status', 'completada')
        .order('list_date', { ascending: false });
      if (!archived.error) setArchivedLists(archived.data ?? []);
    } catch (err) {
      console.error('Error creating new list:', err);
    }
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

  const listSelectorValue = viewListId === 'active' ? 'active' : viewListId;

  return (
    <>
      <TopBar title={t('shopping.title')} searchPlaceholder={t('header.searchShopping')} showSearch />

      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewingList?.name ?? t('shopping.defaultListName')}
          </h2>
          {viewingList?.list_date && (
            <p className="text-sm text-gray-500 mt-1">
              {t('shopping.listDate')}: {formatLocalDate(viewingList.list_date, locale)}
            </p>
          )}
          {isReadOnly && (
            <p className="text-xs text-amber-700 mt-1">{t('shopping.readOnlyList')}</p>
          )}
          <p className="text-sanctuary-teal font-medium mt-1">
            {t('shopping.estimatedTotal')}: ${estimatedTotal.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <select
            value={listSelectorValue}
            onChange={(e) => {
              const value = e.target.value;
              setViewListId(value === 'active' ? 'active' : value);
            }}
            className="field-input min-w-[220px]"
            aria-label={t('shopping.viewList')}
          >
            <option value="active">{t('shopping.currentList')}</option>
            {archivedLists.length > 0 && (
              <optgroup label={t('shopping.pastLists')}>
                {archivedLists.map((row) => (
                  <option key={row.id} value={row.id}>
                    {formatLocalDate(row.list_date, locale)} — {row.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {viewListId === 'active' && (
            <button
              type="button"
              onClick={() => void handleNewList()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium"
              title={t('shopping.newListHint')}
            >
              <Archive size={18} />
              {t('shopping.newList')}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('shopping.totalSpent')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalSpentInput}
            onChange={(e) => setTotalSpentInput(e.target.value)}
            placeholder={t('shopping.totalSpentPlaceholder')}
            className="field-input max-w-xs"
          />
        </div>
        <button
          type="button"
          disabled={savingTotal || !viewingList}
          onClick={() => void handleSaveTotalSpent()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sanctuary-teal text-sanctuary-teal text-sm font-medium disabled:opacity-50"
        >
          <Save size={18} />
          {savingTotal ? t('shopping.saving') : t('shopping.saveTotal')}
        </button>
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
                readOnly={isReadOnly}
                onToggle={(item) => void handleTogglePurchased(item)}
                onQuantityChange={(item, delta) => void handleQuantityChange(item, delta)}
                onAddToStore={() => setFormOpen(true)}
                showAddButton={!isReadOnly}
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
                      readOnly={isReadOnly}
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
  readOnly,
  onToggle,
  onQuantityChange,
  onAddToStore,
  showAddButton,
}: {
  store: ShoppingStore;
  items: ShoppingItem[];
  readOnly: boolean;
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
                disabled={readOnly}
                onChange={() => onToggle(item)}
                className="w-5 h-5 rounded accent-sanctuary-teal cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`flex-1 ${item.is_purchased ? 'line-through text-gray-500' : ''}`}>
                {item.name}
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 text-sm">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onQuantityChange(item, -1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onQuantityChange(item, 1)}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-40"
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
