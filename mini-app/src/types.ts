// Loyiha bo'ylab umumiy tiplar (yagona manba).
// Oldin HomeView / HistoryView / CourierView / CartContext'da
// tarqoq takrorlangan interfeyslar shu yerga yig'ilgan.

export interface Product {
  id: number;
  category_id?: number | null;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: number;
  rating?: string | null;
  prep_time?: string | null;
  quality_badge?: string | null;
  tag?: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface OrderItem {
  product_id?: number;
  product_name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'completed'
  | 'cancelled';

export interface OrderRecord {
  id: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  order_type?: string;
  address?: string;
  items?: OrderItem[];
  cancelled_by?: string;
  cancel_reason?: string;
}

export interface CourierData {
  id: number;
  telegram_id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  status: string;
  is_online: number;
}

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface ProfileBackendUser {
  id?: number;
  telegram_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string | null;
  photo_url?: string | null;
}

export interface UserProfile {
  user?: ProfileBackendUser | null;
  orders?: OrderRecord[];
}

export interface OrderSuccess {
  success?: boolean;
  order_id: number;
}
