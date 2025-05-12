import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import { PhoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function SendSMS() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset previous results
    setResult(null);
    setIsSending(true);
    
    try {
      // Call the SMS API endpoint
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      });
      
      // Parse the JSON response
      const data = await response.json();
      
      if (response.ok) {
        // Success case
        setResult({
          success: true,
          message: data.message || 'Message sent successfully',
          details: data
        });
        
        // Clear form on success
        setMessage('');
      } else {
        // Error case
        setResult({
          success: false,
          message: data.error || 'Failed to send message',
          details: data
        });
      }
    } catch (error) {
      // Handle network or other errors
      setResult({
        success: false,
        message: 'An error occurred while sending the message',
        details: { error: error.message }
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Send SMS | The Smith Agency</title>
        <meta name="description" content="Send SMS messages through The Smith Agency platform" />
      </Head>
      
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">Send SMS</h1>
            <p className="text-secondary-600 mt-1">
              Use this form to send SMS messages to clients and staff
            </p>
          </div>
          
          {/* SMS Form Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Input */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-secondary-700 mb-1">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    className="block w-full pl-10 py-3 border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-secondary-500">
                  Enter number in international format (e.g., +12125551234)
                </p>
              </div>
              
              {/* Message Input */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-1">
                  Message
                </label>
                <div className="mt-1">
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="shadow-sm block w-full border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-secondary-500 flex justify-between">
                  <span>Keep your message clear and concise</span>
                  <span>{message.length} characters</span>
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isSending ? 'bg-primary-400' : 'bg-primary-600 hover:bg-primary-700'}
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                  <PaperAirplaneIcon className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
            
            {/* Result Message */}
            {result && (
              <div className={`mt-6 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'} p-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {result.success ? (
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message}
                    </h3>
                    {result.details && !result.success && result.details.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <p>{result.details.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Environment Setup Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  To use this feature, make sure to set up your Twilio credentials in the environment variables:
                  <code className="font-mono text-xs bg-blue-100 p-1 rounded ml-1">TWILIO_ACCOUNT_SID</code>,
                  <code className="font-mono text-xs bg-blue-100 p-1 rounded ml-1">TWILIO_AUTH_TOKEN</code>,
                  <code className="font-mono text-xs bg-blue-100 p-1 rounded ml-1">TWILIO_PHONE_NUMBER</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 