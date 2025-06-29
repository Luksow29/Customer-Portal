import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { supabase, formatCurrency, formatDate, getStatusBadgeVariant } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import type { Payment, Order } from '../lib/supabase';

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [relatedOrder, setRelatedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && invoiceId) {
      fetchPayment();
    }
  }, [user, invoiceId]);

  const fetchPayment = async () => {
    if (!user || !invoiceId) return;

    try {
      // Get customer record first
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!customer) return;

      const { data: paymentData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', invoiceId)
        .eq('customer_id', customer.id)
        .single();

      if (error) throw error;
      setPayment(paymentData);

      // Fetch related order if exists
      if (paymentData.order_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', paymentData.order_id)
          .single();
        
        setRelatedOrder(orderData);
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
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

  if (!payment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Not Found</h2>
        <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist.</p>
        <Link to="/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Button>
        </Link>
      </div>
    );
  }

  const balanceAmount = payment.total_amount - payment.amount_paid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PAY-{payment.id.slice(-6)}</h1>
            <p className="text-sm text-gray-500">Payment Details</p>
          </div>
          <Badge variant={getStatusBadgeVariant(payment.status)}>
            {payment.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          {payment.status !== 'Paid' && (
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Details */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            {/* Payment Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">PrintFlow</h2>
                <div className="text-gray-600">
                  <p>456 Print Avenue</p>
                  <p>Print City, PC 67890</p>
                  <p className="mt-2">(555) 123-4567</p>
                  <p>billing@printflow.com</p>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-4xl font-bold text-blue-600 mb-2">PAYMENT</h1>
                <p className="text-lg font-semibold text-gray-900">PAY-{payment.id.slice(-6)}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium">{user?.name}</p>
                  {user?.company_name && (
                    <p className="font-medium">{user.company_name}</p>
                  )}
                  {user?.address && (
                    <div className="mt-1">
                      <p>{user.address}</p>
                    </div>
                  )}
                  <p className="mt-1">{user?.email}</p>
                  {user?.phone && <p>{user.phone}</p>}
                </div>
              </div>
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{formatDate(payment.created_at)}</span>
                  </div>
                  {payment.due_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(payment.due_date)}</span>
                    </div>
                  )}
                  {payment.payment_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Date:</span>
                      <span className="font-medium text-emerald-600">{formatDate(payment.payment_date)}</span>
                    </div>
                  )}
                  {payment.order_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Related Order:</span>
                      <Link 
                        to={`/orders/${payment.order_id}`}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        ORD-{payment.order_id}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 text-left font-semibold text-gray-900">Description</th>
                    <th className="py-3 text-right font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 text-gray-700">
                      {relatedOrder ? `${relatedOrder.order_type} - ${relatedOrder.quantity} units` : 'Payment'}
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(payment.total_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(payment.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(payment.amount_paid)}</span>
                  </div>
                  {balanceAmount > 0 && (
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Balance Due:</span>
                        <span className="text-lg font-bold text-red-600">{formatCurrency(balanceAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {payment.status === 'Paid' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center text-emerald-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Payment Completed</span>
                </div>
                {payment.payment_method && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Payment Method: {payment.payment_method}</p>
                  </div>
                )}
              </div>
            )}

            {payment.notes && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-600">{payment.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={getStatusBadgeVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold text-lg">{formatCurrency(payment.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(payment.amount_paid)}</span>
              </div>
              {balanceAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(balanceAmount)}</span>
                </div>
              )}
              {payment.status !== 'Paid' && (
                <div className="pt-3">
                  <Button className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </Button>
                </div>
              )}
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
              {payment.order_id && (
                <Link to={`/orders/${payment.order_id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    View Order
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Payment History */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Payment History
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(payment.created_at)}</span>
              </div>
              {payment.payment_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="text-emerald-600">{formatDate(payment.payment_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span>{formatDate(payment.updated_at)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}