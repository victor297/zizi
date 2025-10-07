import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, CreditCard, Star, TrendingUp, Clock } from 'lucide-react';
import { useInitializePaymentMutation } from '../../redux/api/paymentsApi';
import { addNotification } from '../../redux/slices/uiSlice';

const PaymentModal = ({ isOpen, onClose, adId, adTitle }) => {
  const dispatch = useDispatch();
  const [selectedService, setSelectedService] = useState('');
  const [initializePayment, { isLoading }] = useInitializePaymentMutation();

  const services = [
    {
      id: 'bump',
      name: 'Bump Ad',
      price: 500,
      duration: '7 days',
      description: 'Move your ad to the top of search results',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      id: 'feature',
      name: 'Feature Ad',
      price: 2000,
      duration: '30 days',
      description: 'Highlight your ad with premium placement and styling',
      icon: Star,
      color: 'yellow'
    },
    {
      id: 'urgent',
      name: 'Mark as Urgent',
      price: 1000,
      duration: '7 days',
      description: 'Add an urgent badge to attract immediate attention',
      icon: Clock,
      color: 'red'
    }
  ];

  const handlePayment = async () => {
    if (!selectedService) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select a service'
      }));
      return;
    }

    const service = services.find(s => s.id === selectedService);
    
    try {
      const result = await initializePayment({
        amount: service.price * 100, // Convert to kobo
        service: selectedService,
        ad_id: adId,
        callback_url: `${window.location.origin}/payment/callback`
      }).unwrap();

      // Redirect to Paystack payment page
      window.location.href = result.data.authorization_url;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error.data?.message || 'Payment initialization failed'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Promote Your Ad</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-1">{adTitle}</h3>
              <p className="text-sm text-gray-600">Choose a promotion option to boost your ad's visibility</p>
            </div>

            <div className="space-y-3 mb-6">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <label
                    key={service.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedService === service.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={selectedService === service.id}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-start">
                      <div className={`p-2 rounded-lg mr-3 bg-${service.color}-100`}>
                        <Icon className={`text-${service.color}-600`} size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <span className="font-bold text-green-600">₦{service.price.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{service.description}</p>
                        <p className="text-xs text-gray-500">Duration: {service.duration}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Secure payment via Paystack</li>
                <li>• Instant activation after payment</li>
                <li>• Full refund if not satisfied</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!selectedService || isLoading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard size={16} />
                <span>{isLoading ? 'Processing...' : 'Pay Now'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;