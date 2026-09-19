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

export type TaskStatus = 'pendiente' | 'completada';
export type TaskCriticality = 'urgente' | 'prioritaria' | 'pateable';

export const TASK_CATEGORIES = [
  'hogar',
  'compras',
  'tramites',
  'aviva',
  'bebi',
  'personales_ivan',
  'personales_juli',
  'trabajo_ivan',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

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
  priority: TaskCriticality;
  category: TaskCategory;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category: TaskCategory;
  priority: TaskCriticality;
  status: TaskStatus;
}

export type ShoppingListStatus = 'activa' | 'completada';
export type ShoppingStore = 'supermercado' | 'farmacia' | 'otros';

/** Categorías de productos en la lista de compras (orden alfabético por etiqueta en español). */
export const SHOPPING_ITEM_CATEGORIES = [
  'almacen',
  'bebidas',
  'congelados',
  'extraordinario',
  'lacteos',
  'limpieza',
] as const;

export type ShoppingItemCategory = (typeof SHOPPING_ITEM_CATEGORIES)[number];

const LEGACY_SHOPPING_CATEGORY: Record<string, ShoppingItemCategory> = {
  supermercado: 'almacen',
  carniceria: 'almacen',
  verduleria: 'almacen',
  delivery: 'extraordinario',
  gastos_personales: 'extraordinario',
  extraordinarios: 'extraordinario',
  farmacia: 'extraordinario',
  servicios: 'extraordinario',
  mantenimiento: 'limpieza',
};

export function normalizeShoppingItemCategory(value: string): ShoppingItemCategory {
  if ((SHOPPING_ITEM_CATEGORIES as readonly string[]).includes(value)) {
    return value as ShoppingItemCategory;
  }
  return LEGACY_SHOPPING_CATEGORY[value] ?? 'almacen';
}

export interface ShoppingList {
  id: string;
  name: string;
  status: ShoppingListStatus;
  list_date: string;
  total_spent: number | null;
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
  category: ShoppingItemCategory;
  is_purchased: boolean;
  estimated_price: number | null;
  added_by: string;
  created_at: string;
}

export interface MostPurchasedItem {
  name: string;
  totalQuantity: number;
}
