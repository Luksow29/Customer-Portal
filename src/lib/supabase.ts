import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types based on your schema
export interface UserProfile {
  id: string; // auth.users.id
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company_name?: string;
  joined_date?: string;
  total_orders: number;
  total_spent: number;
  last_interaction?: string;
  billing_address?: string;
  shipping_address?: string;
  birthday?: string;
  secondary_phone?: string;
  tags?: string[];
}

export interface Order {
  id: number; // bigint from orders table
  date: string;
  customer_name: string;
  customer_phone?: string;
  order_type: string;
  quantity: number;
  design_needed: boolean;
  delivery_date?: string;
  amount_received?: number;
  payment_method?: string;
  notes?: string;
  rate?: number;
  total_amount: number;
  balance_amount?: number;
  customer_id: string; // UUID
  user_id: string; // UUID
  created_at: string;
  is_deleted: boolean;
  designer_id?: string;
}

export interface Payment {
  id: string; // UUID from payments table
  customer_id: string;
  order_id?: number;
  total_amount: number;
  amount_paid: number;
  due_date?: string;
  status: 'Paid' | 'Partial' | 'Due';
  created_at: string;
  payment_date?: string;
  created_by?: string;
  notes?: string;
  payment_method?: string;
  updated_at: string;
}

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  email?: string;
  address?: string;
  joined_date?: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_interaction?: string;
  updated_at: string;
  billing_address?: string;
  shipping_address?: string;
  birthday?: string;
  secondary_phone?: string;
  company_name?: string;
  tags?: string[];
  user_id: string; // Links to auth.users.id
}

// Helper functions
export const getStatusBadgeVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'paid':
      return 'success';
    case 'printing':
    case 'design':
    case 'partial':
      return 'info';
    case 'pending':
    case 'due':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};