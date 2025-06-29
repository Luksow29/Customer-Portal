import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, Package, CheckCircle } from 'lucide-react';
import { supabase, formatCurrency, formatDate, getStatusBadgeVariant } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import type { Order } from '../lib/supabase';

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    if (!user || !orderId) return;

    try {
      // Get customer record first
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customer) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', parseInt(orderId))
        .eq('customer_id', customer.id)
        .eq('is_deleted', false)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
        <Link to="/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  // Create a simple timeline based on order status
  const getOrderTimeline = (status: string) => {
    const allSteps = [
      { status: 'Order Placed', completed: true },
      { status: 'Design Review', completed: ['design', 'printing', 'delivered'].includes(status?.toLowerCase()) },
      { status: 'Printing', completed: ['printing', 'delivered'].includes(status?.toLowerCase()) },
      { status: 'Delivered', completed: status?.toLowerCase() === 'delivered' }
    ];
    return allSteps;
  };

  const timeline = getOrderTimeline(order.date || 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ORD-{order.id}</h1>
            <p className="text-sm text-gray-500">Order Details</p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.date || 'pending')}>
            {order.date || 'pending'}
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Product Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{order.order_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{order.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Design Needed:</span>
                    <span className="font-medium">{order.design_needed ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.balance_amount && order.balance_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-medium text-red-600">{formatCurrency(order.balance_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{formatDate(order.date)}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Date:</span>
                      <span className="font-medium">{formatDate(order.delivery_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            {order.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                <p className="text-gray-600">{order.notes}</p>
              </div>
            )}
          </Card>

          {/* Payment Information */}
          {(order.amount_received || order.payment_method) && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.amount_received && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Amount Received:</span>
                    <span className="font-medium">{formatCurrency(order.amount_received)}</span>
                  </div>
                )}
                {order.payment_method && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{order.payment_method}</span>
                  </div>
                )}
                {order.rate && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-medium">{formatCurrency(order.rate)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Progress */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Order Progress
            </h3>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}>
                    {item.completed && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className={`text-sm font-medium ${
                      item.completed ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Reorder
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}