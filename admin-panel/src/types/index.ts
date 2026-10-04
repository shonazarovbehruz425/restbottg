export interface Category {
  id: number | string;
  name: string;
}

export interface Product {
  id: number | string;
  category_id?: number | string;
  category_name?: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: number | boolean;
  rating?: string;
  prep_time?: string;
  quality_badge?: string;
  tag?: string;
}

export interface ProductFormData {
  name: string;
  category_id: number | string;
  description: string;
  price: number | string;
  image_url: string;
  is_available?: number | boolean;
  rating?: string;
  prep_time?: string;
  quality_badge?: string;
  tag?: string;
}

export interface OrderItem {
  id?: number | string;
  product_id?: number | string;
  product_name?: string;
  name?: string;
  price: number;
  quantity: number;
  total?: number;
}

export interface Order {
  id: number | string;
  user_id?: number | string;
  user_name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  delivery_type: 'delivery' | 'pickup' | string;
  delivery_address?: string;
  payment_method?: string;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled' | string;
  total_amount: number;
  items?: OrderItem[];
  items_json?: string;
  comment?: string;
  channel_message_id?: number | null;
  courier_id?: number | null;
  courier_name?: string;
  courier_phone?: string;
  cancelled_by?: string;
  cancel_reason?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface UserItem {
  id: number | string;
  telegram_id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  total_orders?: number;
  cancelled_orders?: number;
  total_spent?: number;
  created_at?: string;
  is_blocked?: number;
  warnings_count?: number;
}

export interface Courier {
  id: number | string;
  telegram_id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  status: 'active' | 'blocked' | string;
  is_online: number | boolean;
  completed_orders?: number;
  created_at: string;
}

export interface CourierInvite {
  id: number | string;
  token: string;
  created_by?: string;
  created_at: string;
  expires_at?: string;
  is_used?: number | boolean;
  used_by_telegram_id?: number | string;
  invite_url?: string;
}

export interface SettingsData {
  restaurant_name?: string;
  delivery_fee?: number | string;
  channel_id?: string;
  backup_channel_id?: string;
  admin_username?: string;
  admin_password?: string;
  [key: string]: any;
}

export interface StatsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: Order[];
}

export interface ToastItem {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmState {
  title?: string;
  message?: string;
  confirmText?: string;
  onConfirm: () => void | Promise<void>;
}
