import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  TrashIcon, 
  PencilIcon, 
  PlusIcon, 
  EyeIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Smith Agency AI assistant. How can I help you manage your bookings, clients, staff, or shows today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [lastEntityType, setLastEntityType] = useState(null);
  const [lastEntityData, setLastEntityData] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial suggestions
  const initialSuggestions = [
    "Show me all pending bookings",
    "List all staff members",
    "Show me clients in the fashion industry",
    "Find shows happening next month",
    "Which staff are available this weekend?",
    "Create a new client",
    "Edit the Nike booking"
  ];

  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // Optionally auto-submit the suggestion
    // handleSubmit({preventDefault: () => {}}, suggestion);
  };

  const handleSubmit = async (e, overrideInput = null) => {
    e.preventDefault();
    const textToSend = overrideInput || input;
    
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
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

      // Set entity type and data if a function was called
      if (data.functionCall) {
        const { name, arguments: args } = data.functionCall;
        
        // Determine entity type from function name
        if (name.toLowerCase().includes('client')) {
          setLastEntityType('client');
        } else if (name.toLowerCase().includes('staff')) {
          setLastEntityType('staff');
        } else if (name.toLowerCase().includes('show')) {
          setLastEntityType('show');
        } else if (name.toLowerCase().includes('booking')) {
          setLastEntityType('booking');
        }
        
        // Store the data if it exists
        if (data.data) {
          setLastEntityData(data.data);
        }
        
        // Update suggestions based on last query
        updateSuggestions(data.message.content, name, args);
      } else {
        setLastEntityType(null);
        setLastEntityData(null);
        setSuggestions(initialSuggestions);
      }
      
      // Add response to messages
      setMessages(prev => [...prev, {
        role: 'assistant', 
        content: data.message.content,
        data: data.data || null,
        functionCall: data.functionCall || null
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
      setLastEntityType(null);
      setLastEntityData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update suggestions based on the last interaction
  const updateSuggestions = (messageContent, functionName, args) => {
    let newSuggestions = [];
    
    if (functionName.startsWith('list') || functionName.startsWith('search')) {
      if (functionName.includes('Client')) {
        newSuggestions = [
          "Create a new client",
          "Show me more details about one of these clients",
          "Which clients have bookings this month?",
          "Search for clients in a different industry"
        ];
      } else if (functionName.includes('Staff')) {
        newSuggestions = [
          "Add a new staff member",
          "Show me staff availability",
          "Which staff are assigned to upcoming shows?",
          "Find staff with specific skills"
        ];
      } else if (functionName.includes('Show')) {
        newSuggestions = [
          "Create a new show",
          "Which shows need more staff?",
          "Show me details about one of these shows",
          "Find shows for a specific client"
        ];
      } else if (functionName.includes('Booking')) {
        newSuggestions = [
          "Create a new booking",
          "Show me confirmed bookings only",
          "Which staff are available for these dates?",
          "Show me booking details for one of these"
        ];
      }
    } else if (functionName.startsWith('get')) {
      // For detailed entity views, suggest edits, deletion, or related actions
      if (functionName.includes('Client')) {
        newSuggestions = [
          "Edit this client's information",
          "Delete this client",
          "Show me all bookings for this client",
          "Create a new show for this client"
        ];
      } else if (functionName.includes('Staff')) {
        newSuggestions = [
          "Update this staff member's details",
          "Show me this person's availability",
          "View all bookings for this staff member",
          "Add skills for this staff member"
        ];
      } else if (functionName.includes('Show')) {
        newSuggestions = [
          "Edit this show's information",
          "Delete this show",
          "Assign staff to this show",
          "View all bookings for this show"
        ];
      } else if (functionName.includes('Booking')) {
        newSuggestions = [
          "Edit this booking",
          "Cancel this booking",
          "Find available staff for this booking",
          "Add more days to this booking"
        ];
      }
    }
    
    // If we have suggestions, set them
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
    }
  };

  // Function to format the message content with potential JSON data
  const formatMessageContent = (message) => {
    if (!message.data) {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
    
    // Format based on entity type
    let dataContent = null;
    
    // Determine if it's a list or a single item
    const isArray = Array.isArray(message.data);
    const items = isArray ? message.data : [message.data];
    
    if (items.length > 0) {
      dataContent = (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div 
              key={item.id || index} 
              className="bg-white/20 rounded-md p-2 hover:bg-white/30 transition-colors cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="font-medium">{item.name || `Item ${index + 1}`}</div>
              {renderItemDetails(item)}
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <>
        <p className="whitespace-pre-wrap mb-2">{message.content}</p>
        {dataContent}
      </>
    );
  };
  
  // Render details for items based on their type
  const renderItemDetails = (item) => {
    // Check for client
    if (item.industry || item.location) {
      return (
        <div className="text-sm opacity-80">
          {item.industry && <span>{item.industry}</span>}
          {item.industry && item.location && <span> · </span>}
          {item.location && <span>{item.location}</span>}
        </div>
      );
    }
    
    // Check for staff
    if (item.role || item.skills) {
      return (
        <div className="text-sm opacity-80">
          {item.role && <span>{item.role}</span>}
          {item.role && item.skills && <span> · </span>}
          {item.skills && Array.isArray(item.skills) && <span>{item.skills.join(", ")}</span>}
        </div>
      );
    }
    
    // Check for show
    if (item.startDate || item.endDate || item.clientId) {
      return (
        <div className="text-sm opacity-80">
          {item.startDate && <span>Starts: {formatDate(item.startDate)}</span>}
          {item.startDate && item.endDate && <span> · </span>}
          {item.endDate && <span>Ends: {formatDate(item.endDate)}</span>}
        </div>
      );
    }
    
    // Check for booking
    if (item.status || item.datesNeeded) {
      return (
        <div className="text-sm opacity-80">
          {item.status && <span className="capitalize">{item.status}</span>}
          {item.status && item.datesNeeded && <span> · </span>}
          {item.datesNeeded && <span>{item.datesNeeded.length} dates</span>}
        </div>
      );
    }
    
    return null;
  };
  
  // Helper to format dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Handle clicking on a data item
  const handleItemClick = (item) => {
    let prompt = "";
    
    // Determine what type of item it is
    if (item.industry || item.location) {
      prompt = `Tell me more about the client ${item.name}`;
    } else if (item.role || item.skills) {
      prompt = `Show me details for staff member ${item.name}`;
    } else if (item.startDate || item.endDate) {
      prompt = `Give me details about the show "${item.name}"`;
    } else if (item.status || item.datesNeeded) {
      prompt = `Show me booking details for ${item.id}`;
    } else {
      prompt = `Tell me more about ${item.name || item.id}`;
    }
    
    // Set the input but don't auto-submit to give user a chance to edit
    setInput(prompt);
  };
  
  // Action buttons to render based on entity type
  const renderActionButtons = () => {
    if (!lastEntityType) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center text-sm"
          onClick={() => handleActionClick('view')}
        >
          <EyeIcon className="h-4 w-4 mr-1.5" />
          View {lastEntityType}s
        </button>
        
        <button
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center text-sm"
          onClick={() => handleActionClick('create')}
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          Create {lastEntityType}
        </button>
        
        {lastEntityData && (
          <>
            <button
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md flex items-center text-sm"
              onClick={() => handleActionClick('edit')}
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              Edit {lastEntityType}
            </button>
            
            <button
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center text-sm"
              onClick={() => handleActionClick('delete')}
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              Delete {lastEntityType}
            </button>
          </>
        )}
      </div>
    );
  };
  
  // Handle action button clicks
  const handleActionClick = (action) => {
    if (!lastEntityType) return;
    
    let path = '';
    const entityId = lastEntityData?.id;
    
    switch (action) {
      case 'view':
        path = `/${lastEntityType}s`;
        break;
      case 'create':
        path = `/${lastEntityType}s/new`;
        break;
      case 'edit':
        if (entityId) {
          path = `/${lastEntityType}s/${entityId}/edit`;
        } else {
          // If no specific entity, go to list view
          path = `/${lastEntityType}s`;
        }
        break;
      case 'delete':
        // For delete, we'd typically handle this in place or navigate to edit
        // Here we'll just navigate to the edit page where delete functionality exists
        if (entityId) {
          path = `/${lastEntityType}s/${entityId}`;
        } else {
          path = `/${lastEntityType}s`;
        }
        break;
      default:
        path = `/${lastEntityType}s`;
    }
    
    router.push(path);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text animate-gradient-x bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
            Smith Agency Data Assistant
          </h1>
          <p className="text-secondary-500 mt-1">
            Manage all your bookings, staff, clients, and shows with natural language
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
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-tr-none'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-tl-none'
                    }`}
                  >
                    {message.role === 'assistant' && index === messages.length - 1 && lastEntityType && (
                      <>
                        {formatMessageContent(message)}
                        {renderActionButtons()}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-tl-none flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "100ms" }}></div>
                      <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-3 py-2 border-t border-secondary-100 dark:border-secondary-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-secondary-500">Suggested questions</span>
                  <button 
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-secondary-400 hover:text-secondary-600 p-1 rounded"
                  >
                    {showSuggestions 
                      ? <ChevronUpIcon className="h-4 w-4" />
                      : <ChevronDownIcon className="h-4 w-4" />
                    }
                  </button>
                </div>
                {showSuggestions && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="text-xs bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-700 dark:text-secondary-200 rounded-full px-3 py-1 transition-colors"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-secondary-100 p-3 flex items-center bg-white dark:bg-secondary-800">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about bookings, staff, clients, or shows..."
                className="flex-1 bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                ref={inputRef}
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`ml-2 p-2.5 rounded-full ${
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