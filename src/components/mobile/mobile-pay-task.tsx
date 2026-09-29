"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Shield, 
  Check,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadTask, updateTask } from '@/lib/task-store';
import type { Task } from '@/lib/task-store';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { LoadingPage, LoadingSpinner } from '@/components/ui/loading-spinner';

interface MobilePayTaskProps {
  taskId: string;
}

const paymentMethods = [
  { 
    id: 'upi', 
    label: 'UPI', 
    icon: Smartphone, 
    description: 'Pay with UPI apps like GPay, PhonePe, Paytm',
    recommended: true 
  },
  { 
    id: 'card', 
    label: 'Card', 
    icon: CreditCard, 
    description: 'Credit or Debit Card' 
  },
  { 
    id: 'wallet', 
    label: 'Wallet', 
    icon: Wallet, 
    description: 'Paytm, Mobikwik, Freecharge' 
  },
];

export function MobilePayTask({ taskId }: MobilePayTaskProps) {
  const router = useRouter();
  const { handleAsyncError } = useErrorHandler();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadTaskData() {
      await handleAsyncError(async () => {
        const taskData = await loadTask(taskId);
        if (!taskData) {
          throw new Error('Task not found');
        }
        setTask(taskData);
      }, {
        title: 'Failed to load task',
        description: 'The task could not be found',
        action: {
          label: 'Go back',
          onClick: () => router.back()
        }
      });
      setLoading(false);
    }
    loadTaskData();
  }, [taskId, router, handleAsyncError]);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!task) return;

    setProcessing(true);

    await handleAsyncError(async () => {
      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Wysa',
        description: task.title,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          await handleAsyncError(async () => {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: task.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: selectedMethod,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}));
              throw new Error(errorData.error || 'Payment verification failed');
            }
            
            toast.success('Payment successful!');
            router.push(`/mobile/task-posted/${task.id}`);
          }, {
            title: 'Payment verification failed',
            description: 'Please contact support if money was deducted'
          });
        },
        prefill: {
          name: '', // User name if available
          email: '', // User email if available
        },
        theme: {
          color: '#0D9488', // Teal color
        },
        method: {
          upi: selectedMethod === 'upi',
          card: selectedMethod === 'card',
          wallet: selectedMethod === 'wallet',
        },
      };

      const rzp = new window.Razorpay(options);
      
      if (rzp.on) {
        rzp.on('payment.failed', function (response: any) {
          toast.error('Payment failed. Please try again.');
          console.error('Payment failed:', response.error);
        });
      }

      rzp.open();
    }, {
      title: 'Payment failed',
      description: 'Unable to process payment. Please try again.'
    });
    
    setProcessing(false);
  };

  if (loading) {
    return <LoadingPage message="Loading task details..." />;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Task not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Task Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Task Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-3">{task.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {task.date ? new Date(task.date).toLocaleDateString() : 'Flexible'}
              </div>
              {task.area && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {task.area}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-gray-600">Budget</span>
              <Badge className="bg-green-100 text-green-700">
                ₹{task.budget}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Choose Payment Method</h3>
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'ring-2 ring-teal-600 bg-teal-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedMethod === method.id ? 'bg-teal-600' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          selectedMethod === method.id ? 'text-white' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{method.label}</p>
                          {method.recommended && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                    {selectedMethod === method.id && (
                      <Check className="h-5 w-5 text-teal-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Summary */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Task budget</span>
                <span>₹{task.budget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform fee</span>
                <span>₹{task.platformFee}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-base">
                <span>Total amount</span>
                <span>₹{task.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 text-sm">Secure Payment</p>
                <p className="text-blue-700 text-xs">
                  Your payment is held securely and only released when the task is completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">How it works</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <p className="text-sm text-gray-600">Your payment is held securely</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <p className="text-sm text-gray-600">Wysas can see and apply for your task</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <p className="text-sm text-gray-600">Payment is released when task is completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Payment Button */}
      <div className="p-4 bg-white border-t">
        <Button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
        >
          {processing ? (
            <div className="flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pay ₹{task.total}
            </div>
          )}
        </Button>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}