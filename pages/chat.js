import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import { PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Smith Agency AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
            Smith Agency AI Assistant
          </h1>
          <p className="text-secondary-500 mt-1">
            Ask me anything about staff, clients, shows, or bookings
          </p>
        </div>
        
        {/* Chat container with animated gradient border */}
        <div className="flex-1 relative p-0.5 rounded-xl overflow-hidden animate-gradient-xy bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 opacity-30 animate-pulse"></div>
          
          <div className="relative h-full bg-white dark:bg-secondary-900 rounded-lg overflow-hidden flex flex-col backdrop-blur-sm bg-opacity-95">
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-none'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-tl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-secondary-100 p-3 flex items-center bg-white dark:bg-secondary-800">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                ref={inputRef}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`ml-2 p-2 rounded-full ${
                  isLoading 
                    ? 'bg-secondary-300 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white`}
                disabled={isLoading}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 