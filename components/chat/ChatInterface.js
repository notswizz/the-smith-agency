import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, UserIcon, CalendarIcon, UsersIcon, ClipboardIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

// Card components for displaying structured data
const BookingCard = ({ booking }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col">
      <div className="bg-indigo-600 text-white px-3 py-1.5 flex items-center">
        <CalendarIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{booking.show}</h3>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {booking.client && (
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Client</p>
              <p className="text-xs truncate">{booking.client.name || "Unknown client"}</p>
            </div>
          </div>
        )}
        
        {booking.dates && booking.dates.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Dates</p>
            <div className="space-y-1">
              {booking.dates.slice(0, 3).map((dateObj, index) => (
                <div key={index} className="bg-gray-50 p-1.5 rounded text-xs flex items-center justify-between">
                  <span className="truncate">{dateObj.date}</span>
                  <span className="text-indigo-600 whitespace-nowrap ml-1">{dateObj.staffCount} staff</span>
                </div>
              ))}
              {booking.dates.length > 3 && (
                <p className="text-xs text-gray-500">+{booking.dates.length - 3} more dates</p>
              )}
            </div>
          </div>
        )}
        
        {booking.assignedStaff && booking.assignedStaff.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Staff</p>
            <div className="flex flex-wrap gap-1">
              {booking.assignedStaff.slice(0, 3).map((staff, idx) => (
                <span key={idx} className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full truncate max-w-full">
                  {staff.name}
                </span>
              ))}
              {booking.assignedStaff.length > 3 && (
                <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full">
                  +{booking.assignedStaff.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
        
        {booking.status && (
          <div className="mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'
            }`}>
              {booking.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const ClientCard = ({ client }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col">
      <div className="bg-emerald-600 text-white px-3 py-1.5 flex items-center">
        <BuildingOfficeIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{client.name}</h3>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {client.contactInfo && (
          <div className="flex items-start">
            <UserIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Contact</p>
              <p className="text-xs truncate">{client.contactInfo}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StaffCard = ({ staff }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[280px] h-full flex flex-col">
      <div className="bg-purple-600 text-white px-3 py-1.5 flex items-center">
        <UserIcon className="h-4 w-4 mr-1.5" />
        <h3 className="font-medium text-sm truncate">{staff.name}</h3>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {staff.role && (
          <div className="flex items-start">
            <ClipboardIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Role</p>
              <p className="text-xs truncate">{staff.role}</p>
            </div>
          </div>
        )}
        
        {staff.contactInfo && (
          <div className="flex items-start">
            <UserIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">Contact</p>
              <p className="text-xs truncate">{staff.contactInfo}</p>
            </div>
          </div>
        )}
        
        {staff.availability && staff.availability.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Available dates</p>
            <div className="flex flex-wrap gap-1">
              {staff.availability.slice(0, 3).map((date, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full truncate">
                  {date}
                </span>
              ))}
              {staff.availability.length > 3 && (
                <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded-full">
                  +{staff.availability.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CardList = ({ items, type }) => {
  if (!items || items.length === 0) return null;
  
  // Use horizontal scrolling for multiple items
  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2 -mx-3 px-3">
        <div className="flex space-x-3">
          {items.map((item, index) => {
            if (type === 'booking') {
              return <BookingCard key={index} booking={item} />;
            } else if (type === 'client') {
              return <ClientCard key={index} client={item} />;
            } else if (type === 'staff') {
              return <StaffCard key={index} staff={item} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

// Function to detect and parse JSON in messages
const parseMessageContent = (content) => {
  // Check if the content contains a JSON object
  const jsonRegex = /```json\n([\s\S]*?)\n```/g;
  let match;
  let processedContent = content;
  const jsonData = [];

  while ((match = jsonRegex.exec(content)) !== null) {
    try {
      const jsonStr = match[1];
      const data = JSON.parse(jsonStr);
      jsonData.push(data);
      
      // Replace the JSON with a placeholder
      processedContent = processedContent.replace(match[0], `[JSON_DATA_${jsonData.length - 1}]`);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
    }
  }

  return { text: processedContent, jsonData };
};

// Render message component with rich formatting
const MessageContent = ({ content }) => {
  const { text, jsonData } = parseMessageContent(content);
  
  // Split text by JSON placeholders
  const parts = text.split(/\[JSON_DATA_(\d+)\]/);
  
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        // If it's an even index, it's text
        if (index % 2 === 0) {
          return part ? <p key={index} className="text-sm whitespace-pre-wrap">{part}</p> : null;
        } else {
          // It's a JSON reference, so render the appropriate component
          const dataIndex = parseInt(part, 10);
          const data = jsonData[dataIndex];
          
          if (!data) return null;
          
          if (data.type === 'bookings') {
            return <CardList key={index} items={data.items} type="booking" />;
          } else if (data.type === 'clients') {
            return <CardList key={index} items={data.items} type="client" />;
          } else if (data.type === 'staff') {
            return <CardList key={index} items={data.items} type="staff" />;
          } else if (data.type === 'booking') {
            return <BookingCard key={index} booking={data.item} />;
          } else if (data.type === 'client') {
            return <ClientCard key={index} client={data.item} />;
          } else if (data.type === 'staff') {
            return <StaffCard key={index} staff={data.item} />;
          }
          
          return null;
        }
      })}
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Example prompts for complex queries
  const examplePrompts = [
    "Show all bookings",
    "Who's available to work on January 10th?",
    "Show bookings for Fashion Week show",
    "Which staff can work all dates for the Paris Show?",
    "Assign Jane Smith to the Fashion Week booking on January 11th",
    "Add January 15th to the Paris Show booking",
    "Give me details about the Fashion Week booking"
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send message to API
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
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant's response to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.result.content,
      }]);
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for example prompt click
  const handleExampleClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-[600px] rounded-xl overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-5">
        <h2 className="text-xl font-semibold">Smith Agency Assistant</h2>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-white rounded-xl shadow-sm max-w-sm">
              <p className="text-gray-600 mb-4">Ask me about bookings, clients, staff, or availability</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {examplePrompts.map((prompt, index) => (
                  <button 
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="bg-gray-100 hover:bg-gray-200 text-left px-3 py-2 rounded-lg transition-colors text-gray-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white shadow-sm rounded-bl-none'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <MessageContent content={message.content} />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl bg-white shadow-sm rounded-bl-none">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 py-2.5 px-4 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
} 