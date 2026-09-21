import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Pencil, Trash2, X, Save } from 'lucide-react';
import { getSupabase } from '../../lib/supabaseClient';
import { isDemoMode } from '../../lib/demoMode';
import { mockExpenses } from '../../data/mockData';
import {
  formatLocalDate,
  formatMonthLabel,
  getCurrentMonthKey,
  getMonthRange,
  listMonthKeysFromDates,
} from '../../lib/dates';
import {
  EXPENSE_CATEGORIES,
  normalizeExpenseCategory,
  type Expense,
  type ExpenseCategory,
} from '../../types';
import { ConfirmModal } from '../ConfirmModal';

export function ExpenseList() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en-US' : 'es-AR';
  const currentMonthKey = getCurrentMonthKey();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });

  const loadAvailableMonths = useCallback(async () => {
    if (isDemoMode) {
      setAvailableMonths(listMonthKeysFromDates(mockExpenses.map((e) => e.date)));
      return;
    }

    const { data, error } = await getSupabase().from('expenses').select('date').order('date', { ascending: false });
    if (error) throw error;
    setAvailableMonths(listMonthKeysFromDates((data ?? []).map((row) => row.date)));
  }, []);

  const fetchExpensesForMonth = useCallback(async (monthKey: string) => {
    const { start, end } = getMonthRange(monthKey);

    const mapExpense = (expense: Expense): Expense => ({
      ...expense,
      category: normalizeExpenseCategory(expense.category),
    });

    if (isDemoMode) {
      return mockExpenses
        .filter((expense) => expense.date >= start && expense.date <= end)
        .map(mapExpense);
    }

    const { data, error } = await getSupabase()
      .from('expenses')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapExpense);
  }, []);

  const refreshCurrentMonth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExpensesForMonth(currentMonthKey);
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonthKey, fetchExpensesForMonth]);

  useEffect(() => {
    void loadAvailableMonths();
    void refreshCurrentMonth();
  }, [loadAvailableMonths, refreshCurrentMonth]);

  const pastMonths = useMemo(
    () => availableMonths.filter((month) => month !== currentMonthKey),
    [availableMonths, currentMonthKey],
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const expensesByCategory = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
    return acc;
  }, {});

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      if (!isDemoMode) {
        const { error } = await getSupabase().from('expenses').delete().eq('id', deleteConfirm.id);
        if (error) throw error;
      }
      await refreshCurrentMonth();
      await loadAvailableMonths();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      if (!isDemoMode) {
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
      }
      await refreshCurrentMonth();
      await loadAvailableMonths();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t('expenses.currentMonthTitle')}</h2>
          <p className="text-sm text-gray-500 capitalize">{formatMonthLabel(currentMonthKey, locale)}</p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-sanctuary-teal text-sanctuary-teal bg-white text-sm font-medium"
        >
          <Calendar size={18} />
          {t('expenses.viewByMonth')}
        </button>
      </div>

      <ExpenseTableSection
        expenses={expenses}
        totalExpenses={totalExpenses}
        expensesByCategory={expensesByCategory}
        editingId={editingId}
        editForm={editForm}
        setEditingId={setEditingId}
        setEditForm={setEditForm}
        onSaveEdit={() => void handleSaveEdit()}
        onDelete={(id) => setDeleteConfirm({ isOpen: true, id })}
        locale={locale}
        readOnly={false}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={t('common.delete')}
        message={t('expenses.deleteConfirm')}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />

      {historyOpen && (
        <MonthHistoryModal
          locale={locale}
          pastMonths={pastMonths}
          fetchExpensesForMonth={fetchExpensesForMonth}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}

function ExpenseTableSection({
  expenses,
  totalExpenses,
  expensesByCategory,
  editingId,
  editForm,
  setEditingId,
  setEditForm,
  onSaveEdit,
  onDelete,
  locale,
  readOnly,
}: {
  expenses: Expense[];
  totalExpenses: number;
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
  editingId: string | null;
  editForm: Partial<Expense>;
  setEditingId: (id: string | null) => void;
  setEditForm: (form: Partial<Expense>) => void;
  onSaveEdit: () => void;
  onDelete: (id: string) => void;
  locale: string;
  readOnly: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
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
          <ExpenseTable
            expenses={expenses}
            editingId={readOnly ? null : editingId}
            editForm={editForm}
            setEditingId={setEditingId}
            setEditForm={setEditForm}
            onSaveEdit={onSaveEdit}
            onDelete={onDelete}
            locale={locale}
            readOnly={readOnly}
          />
        )}
      </div>
    </>
  );
}

function ExpenseTable({
  expenses,
  editingId,
  editForm,
  setEditingId,
  setEditForm,
  onSaveEdit,
  onDelete,
  locale,
  readOnly,
}: {
  expenses: Expense[];
  editingId: string | null;
  editForm: Partial<Expense>;
  setEditingId: (id: string | null) => void;
  setEditForm: (form: Partial<Expense>) => void;
  onSaveEdit: () => void;
  onDelete: (id: string) => void;
  locale: string;
  readOnly: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-th">{t('expenses.dateLabel')}</th>
            <th className="table-th">{t('expenses.titleLabel')}</th>
            <th className="table-th">{t('expenses.categoryLabel')}</th>
            <th className="table-th">{t('expenses.amountLabel')}</th>
            {!readOnly && <th className="table-th" />}
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
                      <button type="button" onClick={onSaveEdit} className="text-sanctuary-teal">
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
                  <td className="table-td">{formatLocalDate(expense.date, locale)}</td>
                  <td className="table-td">{expense.title}</td>
                  <td className="table-td">
                    <span className="px-2 py-1 bg-sanctuary-teal/10 text-sanctuary-teal rounded-full text-xs">
                      {t(`expenses.categories.${expense.category}`)}
                    </span>
                  </td>
                  <td className="table-td font-medium">${Number(expense.amount).toFixed(2)}</td>
                  {!readOnly && (
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
                          onClick={() => onDelete(expense.id)}
                          className="text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthHistoryModal({
  locale,
  pastMonths,
  fetchExpensesForMonth,
  onClose,
}: {
  locale: string;
  pastMonths: string[];
  fetchExpensesForMonth: (monthKey: string) => Promise<Expense[]>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [historyMonth, setHistoryMonth] = useState(pastMonths[0] ?? '');
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!historyMonth) {
      setMonthExpenses([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      const data = await fetchExpensesForMonth(historyMonth);
      setMonthExpenses(data);
      setLoading(false);
    }

    void load();
  }, [historyMonth, fetchExpensesForMonth]);

  const total = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const byCategory = monthExpenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + Number(expense.amount);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{t('expenses.historyTitle')}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {pastMonths.length === 0 ? (
            <p className="text-sm text-gray-500">{t('expenses.noPastMonths')}</p>
          ) : (
            <>
              <select
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="field-input max-w-xs capitalize"
              >
                {pastMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month, locale)}
                  </option>
                ))}
              </select>

              {loading ? (
                <p className="text-sm text-gray-500">{t('common.loading')}</p>
              ) : (
                <>
                  <div className="text-sm text-gray-600 capitalize">
                    {formatMonthLabel(historyMonth, locale)} — {t('expenses.monthTotal')}:{' '}
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <ExpenseTableSection
                    expenses={monthExpenses}
                    totalExpenses={total}
                    expensesByCategory={byCategory}
                    editingId={null}
                    editForm={{}}
                    setEditingId={() => undefined}
                    setEditForm={() => undefined}
                    onSaveEdit={() => undefined}
                    onDelete={() => undefined}
                    locale={locale}
                    readOnly
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
