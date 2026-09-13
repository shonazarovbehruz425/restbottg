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
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
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
  telegram_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string | null;
}

export interface UserProfile {
  user?: ProfileBackendUser | null;
  orders?: OrderRecord[];
}

export interface OrderSuccess {
  success?: boolean;
  order_id: number;
}
