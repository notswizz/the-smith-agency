import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MinusIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFunction, setPendingFunction] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Generate a user-friendly action message based on function call
  const generateActionMessage = (functionCall) => {
    const { name, arguments: args } = functionCall;
    
    switch (name) {
      case 'listClients':
        return 'Get a list of all clients';
      case 'getClientById':
        return `Get details for client with ID: ${args.id}`;
      case 'searchClients':
        const clientCriteria = [];
        if (args.name) clientCriteria.push(`name containing "${args.name}"`);
        if (args.industry) clientCriteria.push(`in industry "${args.industry}"`);
        if (args.location) clientCriteria.push(`in location "${args.location}"`);
        return `Search for clients ${clientCriteria.length > 0 ? clientCriteria.join(', ') : '(all clients)'}`;
      case 'createClient':
        return `Create a new client named "${args.name}"`;
      case 'updateClient':
        return `Update client with ID: ${args.id}`;
      case 'listShows':
        return 'Get a list of all shows';
      case 'searchShows':
        const showCriteria = [];
        if (args.name) showCriteria.push(`name containing "${args.name}"`);
        if (args.clientId) showCriteria.push(`for client ID "${args.clientId}"`);
        if (args.status) showCriteria.push(`with status "${args.status}"`);
        return `Search for shows ${showCriteria.length > 0 ? showCriteria.join(', ') : '(all shows)'}`;
      case 'getShowById':
        return `Get details for show with ID: ${args.id}`;
      case 'listStaff':
        return 'Get a list of all staff members';
      case 'searchStaff':
        const staffCriteria = [];
        if (args.name) staffCriteria.push(`name containing "${args.name}"`);
        if (args.role) staffCriteria.push(`with role "${args.role}"`);
        if (args.skill) staffCriteria.push(`with skill "${args.skill}"`);
        return `Search for staff ${staffCriteria.length > 0 ? staffCriteria.join(', ') : '(all staff)'}`;
      case 'getStaffById':
        return `Get details for staff member with ID: ${args.id}`;
      case 'createStaff':
        const staffName = args.name || `${args.firstName || ''} ${args.lastName || ''}`.trim();
        return `Create a new staff member: ${staffName}${args.role ? ` (${args.role})` : ''}`;
      case 'updateStaff':
        return `Update staff member with ID: ${args.id}`;
      case 'getStaffAvailability':
        if (args.staffId) {
          return `Check availability for staff ID: ${args.staffId}${args.showId ? ` on show ID: ${args.showId}` : ''}`;
        } else if (args.staffName) {
          return `Check availability for staff named "${args.staffName}"${args.showId ? ` on show ID: ${args.showId}` : ''}`;
        }
        return 'Check staff availability';
      case 'getAvailableStaffForDate':
        return `Find available staff for date: ${args.date}${args.showId ? ` on show ID: ${args.showId}` : ''}`;
      case 'listBookings':
        return 'Get a list of all bookings';
      case 'searchBookings':
        const bookingCriteria = [];
        if (args.clientId) bookingCriteria.push(`for client ID "${args.clientId}"`);
        if (args.showId) bookingCriteria.push(`for show ID "${args.showId}"`);
        if (args.staffId) bookingCriteria.push(`with staff ID "${args.staffId}"`);
        if (args.status) bookingCriteria.push(`with status "${args.status}"`);
        if (args.date) bookingCriteria.push(`on date "${args.date}"`);
        return `Search for bookings ${bookingCriteria.length > 0 ? bookingCriteria.join(', ') : '(all bookings)'}`;
      case 'getBookingById':
        return `Get details for booking with ID: ${args.id}`;
      default:
        return `Execute function: ${name}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);

      // Handle function calls if present
      if (data.functionCall) {
        // Store the function call and create an action message
        setPendingFunction(data.functionCall);
        setActionMessage(generateActionMessage(data.functionCall));
      } else {
        // Clear any pending functions if this response doesn't have one
        setPendingFunction(null);
        setActionMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      // Clear any pending functions on error
      setPendingFunction(null);
      setActionMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFunctionCall = async () => {
    if (!pendingFunction) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/execute-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ functionCall: pendingFunction }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      // Process the function result to ensure it contains detailed information
      let responseContent = result.message || 'Operation completed successfully.';
      
      // If the response doesn't contain detailed information, enhance it with data
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        if (!responseContent.includes(result.data[0].name) && !responseContent.includes('not found')) {
          // Response doesn't include specific entity names, so enhance it
          const entities = result.data.map(item => item.name || 'Unnamed item').filter(Boolean);
          if (entities.length > 0) {
            responseContent = `${responseContent} Found: ${entities.join(', ')}.`;
          }
        }
        
        // For single result searches, ensure we provide detailed information
        if (result.data.length === 1 && !responseContent.includes('email') && !responseContent.includes('phone')) {
          const item = result.data[0];
          const details = [];
          
          if (item.email) details.push(`Email: ${item.email}`);
          if (item.phone) details.push(`Phone: ${item.phone}`);
          if (item.industry) details.push(`Industry: ${item.industry}`);
          if (item.location) details.push(`Location: ${item.location}`);
          
          if (details.length > 0) {
            responseContent = `${responseContent} Details: ${details.join(', ')}.`;
          }
        }
      }
      
      // Add function result as a message from the assistant
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: responseContent
        }
      ]);
    } catch (error) {
      console.error('Error executing function:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error executing that operation.' },
      ]);
    } finally {
      setIsLoading(false);
      // Clear the pending function after execution (whether successful or not)
      setPendingFunction(null);
      setActionMessage('');
    }
  };

  const cancelFunctionCall = () => {
    // Add a message indicating the action was cancelled
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Action cancelled. Is there something else you would like to do?' }
    ]);
    
    // Clear the pending function
    setPendingFunction(null);
    setActionMessage('');
  };

  return (
    <>
      {/* Chat button - always visible */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={isOpen ? (isMinimized ? handleOpen : handleMinimize) : handleOpen}
          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Minimized indicator */}
      {isOpen && isMinimized && (
        <div className="fixed bottom-6 right-20 z-50 bg-white rounded-full px-4 py-2 shadow-md">
          <span className="text-sm font-medium text-primary-600">Chat Minimized</span>
        </div>
      )}

      {/* Full chat modal */}
      <Transition show={isOpen && !isMinimized} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => {}}
          initialFocus={inputRef}
        >
          <div className="fixed right-6 bottom-20 flex items-end justify-end min-h-screen pt-4 px-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-md max-h-[600px] transform overflow-hidden rounded-lg bg-white shadow-xl transition-all flex flex-col">
                {/* Header */}
                <div className="bg-primary-600 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">AI Assistant</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleMinimize}
                      className="text-white hover:bg-primary-500 rounded p-1"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-white hover:bg-primary-500 rounded p-1"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages container */}
                <div className="flex-1 p-4 overflow-y-auto bg-secondary-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-secondary-500">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 mb-4" />
                      <p className="text-lg font-medium">How can I help you today?</p>
                      <p className="text-sm mt-2">
                        Ask me about clients, shows, staff, or bookings.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-secondary-200 text-secondary-800'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white border border-secondary-200">
                            <div className="flex space-x-2">
                              <div className="h-2 w-2 rounded-full bg-secondary-400 animate-bounce"></div>
                              <div className="h-2 w-2 rounded-full bg-secondary-400 animate-bounce delay-150"></div>
                              <div className="h-2 w-2 rounded-full bg-secondary-400 animate-bounce delay-300"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Action confirmation area (shows only when there's a pending function) */}
                {pendingFunction && (
                  <div className="p-3 bg-yellow-50 border-t border-yellow-200">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">Confirm action</h3>
                        <p className="mt-1 text-sm text-yellow-700">{actionMessage}</p>
                        <div className="mt-2 flex space-x-2">
                          <button
                            type="button"
                            onClick={handleFunctionCall}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-800 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="mr-1.5 h-4 w-4 text-green-600" />
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={cancelFunctionCall}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="mr-1.5 h-4 w-4 text-red-600" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-secondary-200">
                  <div className="flex space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading || !!pendingFunction}
                      placeholder={pendingFunction ? "Please confirm or cancel the action above" : "Type your message..."}
                      className={`flex-1 px-4 py-2 border border-secondary-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${pendingFunction ? 'bg-secondary-100 text-secondary-500' : ''}`}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !!pendingFunction || !input.trim()}
                      color="primary"
                      className="rounded-full"
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
} 