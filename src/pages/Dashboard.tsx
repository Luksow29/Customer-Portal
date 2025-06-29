import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, Clock, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { supabase, formatCurrency, formatDate, getStatusBadgeVariant } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import type { Order, Payment } from '../lib/supabase';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
  thisMonth: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    thisMonth: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Get customer record
      const { data: customer } = await supabase
        .from('customers')
        .select('id, total_orders, total_spent')
        .eq('user_id', user.id)
        .single();

      if (!customer) return;

      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }) || [];

      const thisMonthSpent = thisMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const pendingCount = orders?.filter(order => 
        order.date && ['pending', 'design'].includes(order.date.toLowerCase())
      ).length || 0;

      setStats({
        totalOrders: customer.total_orders || 0,
        pendingOrders: pendingCount,
        totalSpent: customer.total_spent || 0,
        thisMonth: thisMonthSpent
      });

      setRecentOrders(orders || []);
      setRecentPayments(payments || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsData = [
    { 
      name: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      change: '+12%', 
      icon: Package, 
      color: 'text-blue-600' 
    },
    { 
      name: 'Pending Orders', 
      value: stats.pendingOrders.toString(), 
      change: '-2%', 
      icon: Clock, 
      color: 'text-amber-600' 
    },
    { 
      name: 'Total Spent', 
      value: formatCurrency(stats.totalSpent), 
      change: '+18%', 
      icon: DollarSign, 
      color: 'text-emerald-600' 
    },
    { 
      name: 'This Month', 
      value: formatCurrency(stats.thisMonth), 
      change: '+24%', 
      icon: TrendingUp, 
      color: 'text-purple-600' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your orders.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.name} className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <span className={`ml-2 text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link
              to="/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">ORD-{order.id}</h4>
                    <Badge variant={getStatusBadgeVariant(order.date || 'pending')}>
                      {order.date || 'pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{order.order_type} • {order.quantity} units</p>
                  <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <Link
              to="/invoices"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">PAY-{payment.id.slice(-6)}</h4>
                    <Badge variant={getStatusBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(payment.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.total_amount)}</p>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex-col">
            <Package className="h-6 w-6 mb-2" />
            <span>New Order</span>
          </Button>
          <Link to="/invoices" className="block">
            <Button variant="outline" className="w-full h-24 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>View Payments</span>
            </Button>
          </Link>
          <Link to="/orders" className="block">
            <Button variant="outline" className="w-full h-24 flex-col">
              <Clock className="h-6 w-6 mb-2" />
              <span>Track Orders</span>
            </Button>
          </Link>
          <Link to="/support" className="block">
            <Button variant="outline" className="w-full h-24 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              <span>Get Support</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}