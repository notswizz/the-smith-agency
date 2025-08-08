import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import adminLogger from '@/lib/utils/adminLogger';
import useStore from '@/lib/hooks/useStore';

export default function BoardPage() {
  return (
    <>
      <Head>
        <title>Board | The Smith Agency</title>
        <meta name="description" content="Admin board for tasks, updates, and collaboration with @mentions" />
      </Head>
      <DashboardLayout>
        <Board />
      </DashboardLayout>
    </>
  );
}

function Board() {
  const staff = useStore((s) => s.staff);
  const clients = useStore((s) => s.clients);

  const [posts, setPosts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'completed' | 'all'
  const [mentionFilter, setMentionFilter] = useState(null); // { type, id, label }

  const listEndRef = useRef(null);

  // Subscribe to board posts
  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    (async () => {
      const mod = await import('@/lib/firebase/firebaseService');
      if (cancelled) return;
      const svc = mod.default;
      unsub = svc.subscribeToCollection('boardPosts', (docs) => {
        const sorted = [...docs].sort((a, b) => {
          const aTs = a.createdAt?.seconds || 0;
          const bTs = b.createdAt?.seconds || 0;
          return aTs - bTs; // older first for chat scroll
        });
        setPosts(sorted);
      });
    })();

    return () => { cancelled = true; try { unsub && unsub(); } catch (_) {} };
  }, []);

  // Auto scroll to bottom when posts change
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const passesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'open'
          ? !p.completed
          : !!p.completed;
      const passesMention = !mentionFilter
        ? true
        : (p.mentions || []).some((m) =>
            (mentionFilter.id && m.id === mentionFilter.id && m.type === mentionFilter.type) ||
            (!mentionFilter.id && m.label === mentionFilter.label)
          );
      return passesStatus && passesMention;
    });
  }, [posts, statusFilter, mentionFilter]);

  const handleCreate = async (newPost) => {
    setIsCreating(true);
    try {
      const adminName = (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('tsa_admin_session') || '{}')?.adminName) || 'Admin';
      const payload = {
        text: newPost.text,
        mentions: newPost.mentions || [],
        createdBy: adminName,
        completed: false,
        // createdAt is set by serverTimestamp in create()
      };
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      await svc.create('boardPosts', payload);
      await adminLogger.logCreate('boardPosts');
    } catch (e) {
      console.error('Error creating board post', e);
      alert('Failed to create post.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (post) => {
    try {
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      await svc.update('boardPosts', post.id, { completed: !post.completed });
      await adminLogger.logUpdate('boardPosts', post.id, { completed: !post.completed });
    } catch (e) {
      console.error('Error updating post', e);
      alert('Failed to update post.');
    }
  };

  const handleDelete = async (post) => {
    if (!confirm('Delete this post?')) return;
    try {
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      await svc.delete('boardPosts', post.id);
      await adminLogger.logDelete('boardPosts', post.id);
    } catch (e) {
      console.error('Error deleting post', e);
      alert('Failed to delete post.');
    }
  };

  return (
    <div className="relative bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl shadow-xl shadow-primary-500/5 h-[70vh] md:h-[75vh] flex flex-col">
      <div className="px-3 sm:px-4 py-2 border-b border-secondary-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-secondary-800">Board</div>
        <Segmented
          options={[{ key: 'open', label: 'Open' }, { key: 'all', label: 'All' }, { key: 'completed', label: 'Done' }]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="h-full grid place-items-center text-secondary-500 text-sm">No messages yet</div>
        ) : (
          filteredPosts.map((post) => (
            <Bubble
              key={post.id}
              post={post}
              onToggleComplete={() => handleToggleComplete(post)}
              onDelete={() => handleDelete(post)}
              onMentionClick={(m) => setMentionFilter((prev) => (prev && prev.label === m.label && prev.type === m.type ? null : m))}
            />
          ))
        )}
        <div ref={listEndRef} />
      </div>

      <div className="sticky bottom-0 left-0 right-0 border-t border-secondary-100 bg-white/90 backdrop-blur px-3 sm:px-4 py-3">
        <Composer onCreate={handleCreate} isSubmitting={isCreating} />
      </div>
    </div>
  );
}

function Composer({ onCreate, isSubmitting }) {
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);

  // Pull mentionables from store to avoid prop drilling heavy arrays
  const staff = useStore((s) => s.staff);
  const clients = useStore((s) => s.clients);

  const mentionables = useMemo(() => {
    const staffItems = (staff || []).map((s) => ({ type: 'staff', id: s.id, label: s.firstName ? `${s.firstName}${s.lastName ? ' ' + s.lastName : ''}` : s.name || 'Staff' }));
    const clientItems = (clients || []).map((c) => ({ type: 'client', id: c.id, label: c.name || c.company || 'Client' }));
    return [...staffItems, ...clientItems];
  }, [staff, clients]);

  const updateMenu = (value) => {
    const caretIdx = textareaRef.current?.selectionStart || 0;
    const upto = value.slice(0, caretIdx);
    const match = upto.match(/@([\w\s]{0,30})$/);
    if (match) {
      const q = match[1].trim().toLowerCase();
      const filtered = mentionables.filter((m) => m.label.toLowerCase().includes(q));
      setMenuItems(filtered.slice(0, 8));
      setShowMenu(true);
      setActiveIndex(0);
    } else {
      setShowMenu(false);
    }
  };

  const insertMention = (item) => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const newBefore = before.replace(/@([\w\s]{0,30})$/, `@${item.label} `);
    const newText = newBefore + after;
    setText(newText);
    setShowMenu(false);
    // Reset caret to after inserted mention
    const newPos = newBefore.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  const handleKeyDown = (e) => {
    if (showMenu && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, menuItems.length - 1));
      if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter' || e.key === 'Tab') {
        const item = menuItems[activeIndex];
        if (item) insertMention(item);
      }
    }
  };

  const parseMentions = (value) => {
    const matches = value.match(/@([\w\s]+)/g) || [];
    const labels = matches.map((m) => m.slice(1).trim());
    const uniqLabels = Array.from(new Set(labels));
    const resolved = uniqLabels.map((label) => mentionables.find((m) => m.label.toLowerCase() === label.toLowerCase()) || { type: 'tag', id: null, label });
    return resolved;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const mentions = parseMentions(text);
    await onCreate({ text: text.trim(), mentions });
    setText('');
    setShowMenu(false);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); updateMenu(e.target.value); }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message the board… Use @ to tag"
            className="w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/90 placeholder-secondary-400 resize-none"
          />
          {showMenu && menuItems.length > 0 && (
            <div className="absolute bottom-12 left-2 z-20 w-80 max-w-[calc(100%-1rem)] bg-white border border-secondary-200 rounded-xl shadow-lg overflow-hidden">
              {menuItems.map((item, idx) => (
                <button
                  key={`${item.type}:${item.id || item.label}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMention(item)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === activeIndex ? 'bg-primary-50 text-primary-700' : 'hover:bg-secondary-50'}`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${item.type === 'staff' ? 'bg-emerald-500' : item.type === 'client' ? 'bg-indigo-500' : 'bg-secondary-400'}`} />
                  <span>@{item.label}</span>
                  <span className="ml-auto text-xs text-secondary-500">{item.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className="px-4 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-semibold shadow hover:from-primary-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </form>
  );
}

function Bubble({ post, onToggleComplete, onDelete, onMentionClick }) {
  const createdAt = useMemo(() => {
    try {
      if (post.createdAt?.toDate) return post.createdAt.toDate();
      if (post.createdAt?.seconds) return new Date(post.createdAt.seconds * 1000);
      return null;
    } catch {
      return null;
    }
  }, [post.createdAt]);

  const renderText = (text, mentions) => {
    if (!text) return null;
    const parts = text.split(/(@[\w\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const label = part.slice(1).trim();
        const m = (mentions || []).find((x) => x.label?.toLowerCase() === label.toLowerCase());
        return (
          <button key={idx} type="button" onClick={() => m && onMentionClick && onMentionClick(m)} className={`px-1 py-0.5 rounded-md mr-1 ${m?.type === 'staff' ? 'bg-emerald-50 text-emerald-700' : m?.type === 'client' ? 'bg-indigo-50 text-indigo-700' : 'bg-secondary-100 text-secondary-800'}`}>@{label}</button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const initials = (post.createdBy || 'A').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 grid place-items-center text-xs font-semibold select-none">{initials}</div>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 border ${post.completed ? 'bg-secondary-50 border-secondary-200' : 'bg-white border-secondary-200'} shadow-sm`}> 
        <div className={`text-[15px] leading-relaxed ${post.completed ? 'text-secondary-500 line-through' : 'text-secondary-900'}`}>
          {renderText(post.text, post.mentions)}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-secondary-500">
          <span>{post.createdBy || 'Admin'}</span>
          {createdAt && <span>• {createdAt.toLocaleString()}</span>}
          {post.completed && <span className="inline-flex items-center gap-1 text-emerald-600"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-2.814a.75.75 0 0 1 .154 1.05l-4.5 6a.75.75 0 0 1-1.154.086l-2.25-2.25a.75.75 0 1 1 1.06-1.06l1.64 1.64 3.977-5.303a.75.75 0 0 1 1.073-.163Z" clipRule="evenodd" /></svg> Done</span>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={onToggleComplete} className="text-xs px-2 py-1 rounded-md border border-secondary-200 text-secondary-600 hover:bg-secondary-50">
            {post.completed ? 'Mark open' : 'Mark done'}
          </button>
          <button onClick={onDelete} className="text-xs px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-secondary-200 bg-white p-0.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-2.5 py-1 text-xs rounded-md ${value === opt.key ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
} 