import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, CheckIcon, XMarkIcon, UserIcon, ClipboardIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingAction, setExecutingAction] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [shows, setShows] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const LOCAL_STORAGE_KEY = 'adminChatMessages';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load and persist chat history
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setMessages(parsed);
        }
      }
    } catch (e) {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [messages]);

  // Fetch staff members on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/chat/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'get all staff members' }]
          }),
        });
        const data = await response.json();
        // Parse staff data from the response (this is a workaround)
        // In production, you'd want a dedicated API endpoint for this
      } catch (error) {
        console.error('Error fetching staff:', error);
      }
    };

    // For now, let's fetch staff via a direct API call
    const fetchStaffDirect = async () => {
      try {
        const response = await fetch('/api/staff', {
          method: 'GET',
        });
        if (response.ok) {
          const staff = await response.json();
          setStaffMembers(staff);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        // If direct API doesn't exist, we'll create it
      }
    };

    fetchStaffDirect();

    // Fetch shows
    const fetchShows = async () => {
      try {
        const res = await fetch('/api/shows');
        if (res.ok) {
          const data = await res.json();
          setShows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchShows();
  }, []);

  // Handle @ and # mention detection and filtering
  useEffect(() => {
    const atIdx = input.lastIndexOf('@');
    const hashIdx = input.lastIndexOf('#');
    const useAt = atIdx > hashIdx;
    const triggerIdx = Math.max(atIdx, hashIdx);
    if (triggerIdx >= 0) {
      const textAfter = input.slice(triggerIdx + 1);
      const spaceIndex = textAfter.indexOf(' ');
      const searchTerm = spaceIndex === -1 ? textAfter : textAfter.slice(0, spaceIndex);
      // Only show dropdown while typing the token (no space yet)
      if (spaceIndex === -1) {
        setMentionSearch(searchTerm);
        if (useAt) {
          const filtered = staffMembers.filter(staff => staff.name && staff.name.toLowerCase().includes(searchTerm.toLowerCase()));
          setFilteredStaff(filtered);
          setFilteredShows([]);
          setShowMentions(filtered.length > 0);
        } else {
          const filtered = shows.filter(show => show.name && show.name.toLowerCase().includes(searchTerm.toLowerCase()));
          setFilteredShows(filtered);
          setFilteredStaff([]);
          setShowMentions(filtered.length > 0);
        }
        setSelectedMentionIndex(0);
      } else {
        // A space after the trigger closes the dropdown
        setShowMentions(false);
        setFilteredStaff([]);
        setFilteredShows([]);
      }
    } else {
      setShowMentions(false);
      setFilteredStaff([]);
      setFilteredShows([]);
    }
  }, [input, staffMembers, shows]);

  // Handle mention selection
  const selectMention = (entity, isShow = false) => {
    const trigger = isShow ? '#' : '@';
    const triggerIdx = isShow ? input.lastIndexOf('#') : input.lastIndexOf('@');
    const before = input.slice(0, triggerIdx);
    const after = input.slice(triggerIdx + 1 + mentionSearch.length);
    const name = entity.name || '';
    // For shows, insert plain name (no '#') so tagging symbol goes away after selection
    const insertion = isShow ? `${name}` : `${trigger}${name}`;
    setInput(`${before}${insertion} ${after}`);
    setShowMentions(false);
    setMentionSearch('');
    
    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = before.length + name.length + 2;
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Handle keyboard navigation for mentions
  const handleKeyDown = (e) => {
    if (showMentions && (filteredStaff.length > 0 || filteredShows.length > 0)) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIndex = (filteredStaff.length > 0 ? filteredStaff.length : filteredShows.length) - 1;
        setSelectedMentionIndex(prev => prev < maxIndex ? prev + 1 : prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredStaff.length > 0) {
          selectMention(filteredStaff[selectedMentionIndex], false);
        } else if (filteredShows.length > 0) {
          selectMention(filteredShows[selectedMentionIndex], true);
        }
        return;
      } else if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    // Submit on Enter, allow Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        // trigger form submit
        sendMessage(e);
      }
    }
  };

  const executeAction = async (action, data) => {
    setExecutingAction(action.id);
    
    try {
      const response = await fetch('/api/chat/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.type,
          data: data
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Add success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ ${action.successMessage || 'Action executed successfully!'}`
        }]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Action execution error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setExecutingAction(null);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowMentions(false);

    try {
      const response = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        actions: data.actions || null,
        preview: data.preview || null
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    try {
      const text = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (e) {
      // no-op
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {}
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Smith Agency AI Assistant</h2>
            <p className="text-blue-100 text-sm">Ask me about bookings, staff, clients, or shows</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopyTranscript}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded flex items-center space-x-1 text-sm"
              title="Copy transcript"
            >
              <ClipboardIcon className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={handleClearChat}
              className="px-2 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded flex items-center space-x-1 text-sm"
              title="Clear chat"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>👋 Hi! I'm your AI assistant for managing Smith Agency data.</p>
            <p className="mt-2 text-sm">I can help you:</p>
            <ul className="mt-2 text-sm space-y-1">
              <li>• View and search bookings, staff, clients, and shows</li>
              <li>• Create new records</li>
              <li>• Update existing information</li>
              <li>• Answer questions about your data</li>
            </ul>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.preview && (
                <div className="mt-3 text-xs bg-white border border-gray-200 rounded p-3 text-gray-700">
                  {message.preview.current || message.preview.updates ? (
                    <div className="space-y-2">
                      {message.preview.current && (
                        <div>
                          <div className="font-semibold mb-1">Current</div>
                          <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(message.preview.current, null, 2)}</pre>
                        </div>
                      )}
                      {message.preview.updates && (
                        <div>
                          <div className="font-semibold mb-1">Updates</div>
                          <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(message.preview.updates, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(message.preview, null, 2)}</pre>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex space-x-2">
                      <button
                        onClick={() => executeAction(action, action.data)}
                        disabled={executingAction === action.id}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {executingAction === action.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Executing...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            <span>{action.label}</span>
                          </>
                        )}
                      </button>
                      
                      {action.cancelable !== false && (
                        <button
                          onClick={() => {
                            setMessages(prev => [...prev, {
                              role: 'assistant',
                              content: 'Action cancelled.'
                            }]);
                          }}
                          disabled={executingAction === action.id}
                          className="flex items-center space-x-2 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t relative">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // auto-resize
                if (inputRef.current) {
                  inputRef.current.style.height = 'auto';
                  inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your Smith Agency data... (type @ to mention staff)"
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            
            {/* Mention Dropdown */}
            {showMentions && (filteredStaff.length > 0 || filteredShows.length > 0) && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {(filteredStaff.length > 0 ? filteredStaff : filteredShows).map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => selectMention(item, filteredShows.length > 0)}
                    className={`px-4 py-2 cursor-pointer flex items-center space-x-3 ${
                      index === selectedMentionIndex 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.role && (
                        <div className="text-sm text-gray-500">{item.role}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Hint about @ and # mentions */}
        {(staffMembers.length > 0 || shows.length > 0) && !showMentions && (
          <div className="mt-2 text-xs text-gray-500">
            💡 Type @ to mention staff, # to mention shows
          </div>
        )}
      </form>
    </div>
  );
}