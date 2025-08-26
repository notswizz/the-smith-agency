import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PaperAirplaneIcon, CheckIcon, XMarkIcon, UserIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
  const typedDoneRef = useRef(new Set());
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
    <div className="flex flex-col h-[680px] bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800 w-[520px] max-w-[90vw]">
      <div className="relative p-4 bg-zinc-950 rounded-t-2xl">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600/20 via-fuchsia-600/20 to-pink-600/20 blur-xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-pink-600/20 border border-pink-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(236,72,153,0.5)]">
              <SparklesIcon className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50">Smith AI</h2>
              <p className="text-zinc-400 text-sm">Bookings • Staff • Clients</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearChat}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-md flex items-center space-x-2 text-sm transition border border-zinc-700"
              title="Clear chat"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
        {messages.length === 0 && (
          <div className="text-center text-zinc-300 mt-8">
            <p className="text-base">👋 Welcome. I am your AI assistant for The Smith Agency</p>
            <p className="mt-2 text-sm">Use <span className="text-pink-400 font-medium">@</span> for staff and <span className="text-pink-400 font-medium">#</span> for shows</p>
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const ui = message?.preview?.__ui;
          let displayText = message.content;
          if (!isUser && ui && (ui.type === 'staff_card' || ui.type === 'staff_list' || ui.type === 'booking_card' || ui.type === 'booking_list')) {
            displayText = '';
          }
          const shouldType = !isUser && index === messages.length - 1 && displayText && displayText.length > 0 && !typedDoneRef.current.has(index);
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end max-w-full ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full ${isUser ? 'bg-pink-500/25 border border-pink-500/40' : 'bg-pink-600/25 border border-pink-500/40'} flex items-center justify-center ${isUser ? 'ml-2' : 'mr-2'}`}>
                  {isUser ? <UserIcon className="w-4 h-4 text-pink-300" /> : <SparklesIcon className="w-4 h-4 text-pink-300" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-2xl px-5 py-4 rounded-2xl shadow ${
                    isUser
                      ? 'bg-pink-600 text-white border border-pink-500/40'
                      : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                  }`}
                >
                  {displayText ? (
                    shouldType ? (
                      <TypewriterText 
                        text={displayText} 
                        onStep={scrollToBottom}
                        onDone={() => { typedDoneRef.current.add(index); scrollToBottom(); }}
                        className="whitespace-pre-wrap leading-7 text-[15px]"
                      />
                    ) : (
                      <p className="whitespace-pre-wrap leading-7 text-[15px]">{displayText}</p>
                    )
                  ) : null}

                  {message.preview && (
                    ui && (ui.type === 'staff_list' || ui.type === 'staff_card' || ui.type === 'booking_list' || ui.type === 'booking_card') ? (
                      <div className="mt-3">
                        {ui.type === 'staff_list' ? (
                          <StaffPreview items={ui.items} />
                        ) : ui.type === 'staff_card' ? (
                          <StaffPreviewSingle item={ui.item} />
                        ) : ui.type === 'booking_list' ? (
                          <BookingPreview items={ui.items} />
                        ) : (
                          <BookingPreviewSingle item={ui.item} />
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 text-xs bg-zinc-800/80 border border-zinc-700 rounded-lg p-3 text-zinc-100">
                        {message.preview.current || message.preview.updates ? (
                          <div className="space-y-2">
                            {message.preview.current && (
                              <div>
                                <div className="font-semibold mb-1 text-zinc-300">Current</div>
                                <pre className="bg-black/40 p-2 rounded border border-zinc-700 overflow-auto max-h-40">{JSON.stringify(message.preview.current, null, 2)}</pre>
                              </div>
                            )}
                            {message.preview.updates && (
                              <div>
                                <div className="font-semibold mb-1 text-zinc-300">Updates</div>
                                <pre className="bg-black/40 p-2 rounded border border-zinc-700 overflow-auto max-h-40">{JSON.stringify(message.preview.updates, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="bg-black/40 p-2 rounded border border-zinc-700 overflow-auto max-h-40">{JSON.stringify(message.preview, null, 2)}</pre>
                        )}
                      </div>
                    )
                  )}

                  {/* Action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex space-x-2">
                          <button
                            onClick={() => executeAction(action, action.data)}
                            disabled={executingAction === action.id}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-md shadow disabled:opacity-50 transition border border-pink-500/40"
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
                                setMessages(prev => [...prev, { role: 'assistant', content: 'Action cancelled.' }]);
                              }}
                              disabled={executingAction === action.id}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-zinc-900 text-zinc-100 border border-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-800 disabled:opacity-50 transition"
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
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-4 py-2 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-zinc-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800 bg-zinc-950">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                    inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about bookings, staff, clients, or shows…"
                rows={1}
                className="w-full px-4 py-3 border border-zinc-700 bg-zinc-100 text-zinc-900 placeholder-zinc-500 rounded-xl focus:ring-2 focus:ring-pink-600 focus:border-pink-600 resize-none shadow text-base leading-6"
                disabled={isLoading}
              />
              {/* Mention Dropdown */}
              {showMentions && (filteredStaff.length > 0 || filteredShows.length > 0) && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50">
                  {(filteredStaff.length > 0 ? filteredStaff : filteredShows).map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => selectMention(item, filteredShows.length > 0)}
                      className={`px-4 py-2 cursor-pointer flex items-center space-x-3 text-zinc-100 ${
                        index === selectedMentionIndex 
                          ? 'bg-pink-600/10 border-l-4 border-pink-600' 
                          : 'hover:bg-zinc-900'
                      }`}
                    >
                      <UserIcon className="w-5 h-5 text-pink-400" />
                      <div>
                        <div className="font-medium text-zinc-100">{item.name}</div>
                        {item.role && (
                          <div className="text-sm text-zinc-400">{item.role}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_14px_rgba(236,72,153,0.35)] border border-pink-500/50 text-sm font-medium"
            title="Send"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>

       
      </form>
    </div>
  );
}

// Lazy-load staff list to avoid bundling overhead
const StaffList = dynamic(() => import('@/components/staff/StaffList'), { ssr: false });
const BookingCard = dynamic(() => import('@/components/bookings/BookingCard'), { ssr: false });

function TypewriterText({ text = '', speed = 18, onStep, onDone, className = '' }) {
  const [display, setDisplay] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplay('');
    indexRef.current = 0;
    if (!text) return;
    let rafId;
    let last = 0;
    const step = (now) => {
      if (!last) last = now;
      const elapsed = now - last;
      const charsToAdd = Math.max(1, Math.floor(elapsed / speed));
      last = now;
      if (indexRef.current < text.length) {
        indexRef.current = Math.min(text.length, indexRef.current + charsToAdd);
        setDisplay(text.slice(0, indexRef.current));
        if (typeof onStep === 'function') onStep();
        rafId = requestAnimationFrame(step);
      } else {
        if (typeof onDone === 'function') onDone();
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [text, speed, onStep, onDone]);

  return (
    <p className={className}>
      {display}
      <span className="inline-block w-2 h-4 align-baseline ml-0.5 bg-pink-400/80 animate-pulse" />
    </p>
  );
}

function StaffPreview({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="text-zinc-300">No staff found.</div>;
  }
  return (
    <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-3">
      <StaffList staff={items} variant="chat" cardWidthClass="min-w-[360px]" />
    </div>
  );
}

function StaffPreviewSingle({ item }) {
  if (!item) {
    return <div className="text-zinc-300">No staff found.</div>;
  }
  return (
    <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-3">
      <StaffList staff={[item]} variant="chat" cardWidthClass="min-w-[360px]" />
    </div>
  );
}

function BookingPreview({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="text-zinc-300">No bookings found.</div>;
  }
  return (
    <div className="overflow-x-auto overflow-y-hidden px-1" style={{ overscrollBehaviorX: 'contain', overscrollBehavior: 'contain', touchAction: 'pan-x' }}>
      <div className="flex gap-4 snap-x snap-mandatory pb-1">
        {items.map((b) => (
          <div key={b.id} className="min-w-[360px] snap-start snap-always">
            <BookingCard booking={b} staff={[]} client={{ name: b.clientName }} show={{ name: b.showName }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingPreviewSingle({ item }) {
  if (!item) return <div className="text-zinc-300">No booking found.</div>;
  return (
    <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-3">
      <div className="min-w-[360px]">
        <BookingCard booking={item} staff={[]} client={{ name: item.clientName }} show={{ name: item.showName }} />
      </div>
    </div>
  );
}