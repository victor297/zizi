import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useVerifyPaymentQuery } from '../redux/api/paymentsApi';
import { addNotification } from '../redux/slices/uiSlice';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('verifying');

  const reference = searchParams.get('reference');
  const { data: verificationResult, error, isLoading } = useVerifyPaymentQuery(reference, {
    skip: !reference
  });

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      dispatch(addNotification({
        type: 'error',
        message: 'Invalid payment reference'
      }));
      return;
    }

    if (verificationResult) {
      if (verificationResult.success) {
        setStatus('success');
        dispatch(addNotification({
          type: 'success',
          message: 'Payment successful! Your ad has been promoted.'
        }));
        
        // Redirect to ad or dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('error');
        dispatch(addNotification({
          type: 'error',
          message: 'Payment verification failed'
        }));
      }
    }

    if (error) {
      setStatus('error');
      dispatch(addNotification({
        type: 'error',
        message: 'Payment verification failed'
      }));
    }
  }, [reference, verificationResult, error, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="animate-spin text-blue-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Your ad has been successfully promoted. You'll be redirected to your dashboard shortly.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">
              There was an issue with your payment. Please try again or contact support.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;