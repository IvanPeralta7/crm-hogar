export type ExpenseCategory =
  | 'supermercado'
  | 'carniceria'
  | 'verduleria'
  | 'delivery'
  | 'gastos_personales'
  | 'extraordinarios'
  | 'farmacia'
  | 'servicios'
  | 'mantenimiento';

export interface Expense {
  id: string;
  title: string;
  description: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface NewExpense {
  title: string;
  description: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'supermercado',
  'carniceria',
  'verduleria',
  'delivery',
  'gastos_personales',
  'extraordinarios',
  'farmacia',
  'servicios',
  'mantenimiento',
];

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';
export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskCategory = 'limpieza' | 'cocina' | 'jardin' | 'mascotas' | 'finanzas' | 'exterior';
export type TaskRecurrence = 'diaria' | 'semanal' | 'mensual';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assigned_to: string | null;
  due_date: string | null;
  is_recurring: boolean;
  recurrence: TaskRecurrence | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
}

export type ShoppingListStatus = 'activa' | 'completada';
export type ShoppingStore = 'supermercado' | 'farmacia' | 'otros';

export interface ShoppingList {
  id: string;
  name: string;
  status: ShoppingListStatus;
  created_by: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string;
  store: ShoppingStore;
  category: ExpenseCategory;
  is_purchased: boolean;
  estimated_price: number | null;
  added_by: string;
  created_at: string;
}
