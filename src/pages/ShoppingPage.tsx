import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Share2, ShoppingCart, Cross } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { getSupabase } from '../lib/supabaseClient';
import { isDemoMode } from '../lib/demoMode';
import { mockShoppingItems, mockShoppingList } from '../data/mockData';
import type { ShoppingItem, ShoppingList, ShoppingStore } from '../types';

const FREQUENT_ITEMS = ['Paper Towels', 'Coffee Beans', 'Dish Soap', 'Eggs', 'Bread'];
const WEEKLY_BUDGET = 500;

export function ShoppingPage() {
  const { t } = useTranslation();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    async function load() {
      if (isDemoMode) {
        setList(mockShoppingList);
        setItems(mockShoppingItems);
        return;
      }

      const supabase = getSupabase();
      const { data: lists } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('status', 'activa')
        .order('created_at', { ascending: false })
        .limit(1);

      const activeList = lists?.[0] ?? null;
      setList(activeList);

      if (activeList) {
        const { data } = await supabase
          .from('shopping_items')
          .select('*')
          .eq('list_id', activeList.id)
          .order('created_at', { ascending: true });
        setItems(data ?? []);
      }
    }

    void load();
  }, []);

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
          <h2 className="text-2xl font-bold text-gray-900">{list?.name ?? 'Weekly Restock'}</h2>
          <p className="text-sanctuary-teal font-medium mt-1">
            {t('shopping.estimatedTotal')}: ${estimatedTotal.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sanctuary-teal text-sanctuary-teal bg-white text-sm font-medium"
          >
            <Share2 size={18} />
            {t('shopping.shareList')}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sanctuary-teal text-white text-sm font-medium"
          >
            <Plus size={18} />
            {t('shopping.addItem')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {(Object.keys(grouped) as ShoppingStore[]).map((store) => {
            const storeItems = grouped[store];
            if (storeItems.length === 0) return null;
            return (
              <StoreCard
                key={store}
                store={store}
                items={storeItems}
                onToggle={() => undefined}
              />
            );
          })}
          {items.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              {t('common.loading')}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold mb-4">{t('shopping.frequentItems')}</h3>
            <div className="flex flex-wrap gap-2">
              {FREQUENT_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-sm hover:border-sanctuary-teal hover:text-sanctuary-teal"
                >
                  + {item}
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
    </>
  );
}

function StoreCard({
  store,
  items,
}: {
  store: ShoppingStore;
  items: ShoppingItem[];
  onToggle: (id: string) => void;
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
              readOnly
              className="w-5 h-5 rounded accent-sanctuary-teal"
            />
            <div className={`flex-1 ${item.is_purchased ? 'line-through text-gray-500' : ''}`}>
              {item.name}
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1 text-sm">
              <button type="button" className="text-gray-400">
                <Minus size={14} />
              </button>
              <span>{item.quantity}</span>
              <button type="button" className="text-gray-400">
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
        className="w-full py-3 text-sm text-sanctuary-teal border-t border-dashed border-gray-200 hover:bg-gray-50"
      >
        + {t('shopping.addToStore', { store: t(`shopping.store.${store}`) })}
      </button>
    </div>
  );
}
