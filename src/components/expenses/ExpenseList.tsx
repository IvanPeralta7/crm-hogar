import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, X, Save } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { isDemoMode } from '../../lib/demoMode';
import { mockExpenses } from '../../data/mockData';
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

export function ExpenseList() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const fetchExpenses = useCallback(async () => {
    if (isDemoMode) {
      setExpenses(mockExpenses);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await getSupabase()
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data ?? []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const expensesByCategory = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
    return acc;
  }, {});

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const { error } = await getSupabase().from('expenses').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      await fetchExpenses();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await getSupabase()
        .from('expenses')
        .update({
          title: editForm.title,
          description: editForm.description,
          date: editForm.date,
          amount: editForm.amount,
          category: editForm.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) throw error;
      await fetchExpenses();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">{t('expenses.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('expenses.summary')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-sanctuary-teal/10 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">{t('expenses.totalGeneral')}</div>
            <div className="text-3xl font-bold text-sanctuary-teal">${totalExpenses.toFixed(2)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">{t('expenses.byCategory')}</div>
            {EXPENSE_CATEGORIES.map((category) => {
              const amount = expensesByCategory[category] ?? 0;
              if (amount === 0) return null;
              return (
                <div key={category} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t(`expenses.categories.${category}`)}</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold">{t('expenses.listTitle')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('expenses.registered', { count: expenses.length })}
          </p>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{t('expenses.noExpenses')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">{t('expenses.dateLabel')}</th>
                  <th className="table-th">{t('expenses.titleLabel')}</th>
                  <th className="table-th">{t('expenses.categoryLabel')}</th>
                  <th className="table-th">{t('expenses.amountLabel')}</th>
                  <th className="table-th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    {editingId === expense.id ? (
                      <>
                        <td className="table-td">
                          <input
                            type="date"
                            value={editForm.date ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="edit-input"
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="text"
                            value={editForm.title ?? ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="edit-input w-full"
                          />
                        </td>
                        <td className="table-td">
                          <select
                            value={editForm.category ?? ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, category: e.target.value as ExpenseCategory })
                            }
                            className="edit-input"
                          >
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {t(`expenses.categories.${cat}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="table-td">
                          <input
                            type="number"
                            value={editForm.amount ?? ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amount: parseFloat(e.target.value) })
                            }
                            className="edit-input w-24"
                          />
                        </td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => void handleSaveEdit()} className="text-sanctuary-teal">
                              <Save size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditForm({});
                              }}
                              className="text-gray-600"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-td">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="table-td">{expense.title}</td>
                        <td className="table-td">
                          <span className="px-2 py-1 bg-sanctuary-teal/10 text-sanctuary-teal rounded-full text-xs">
                            {t(`expenses.categories.${expense.category}`)}
                          </span>
                        </td>
                        <td className="table-td font-medium">${Number(expense.amount).toFixed(2)}</td>
                        <td className="table-td">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(expense.id);
                                setEditForm(expense);
                              }}
                              className="text-sanctuary-teal"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ isOpen: true, id: expense.id })}
                              className="text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={t('common.delete')}
        message="¿Eliminar este gasto? Esta acción no se puede deshacer."
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  );
}
