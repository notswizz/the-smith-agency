import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import adminLogger from '@/lib/utils/adminLogger';
import useStore from '@/lib/hooks/useStore';

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    }
  };
}

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
  const [replies, setReplies] = useState([]);
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

  // Subscribe to board replies
  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    (async () => {
      const mod = await import('@/lib/firebase/firebaseService');
      if (cancelled) return;
      const svc = mod.default;
      unsub = svc.subscribeToCollection('boardReplies', (docs) => {
        const sorted = [...docs].sort((a, b) => {
          const aTs = a.createdAt?.seconds || 0;
          const bTs = b.createdAt?.seconds || 0;
          return aTs - bTs; // chronological within threads
        });
        setReplies(sorted);
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

  const repliesByPostId = useMemo(() => {
    const map = new Map();
    for (const r of replies) {
      const list = map.get(r.postId) || [];
      list.push(r);
      map.set(r.postId, list);
    }
    return map;
  }, [replies]);

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

  const handleCreateReply = async ({ postId, parentId = null, text, mentions = [] }) => {
    try {
      const adminName = (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('tsa_admin_session') || '{}')?.adminName) || 'Admin';
      const payload = {
        postId,
        parentId: parentId || null,
        text,
        mentions,
        createdBy: adminName,
      };
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      await svc.create('boardReplies', payload);
      await adminLogger.logCreate('boardReplies');
    } catch (e) {
      console.error('Error creating reply', e);
      alert('Failed to create reply.');
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
    if (!confirm('Delete this post? This will also remove all its replies.')) return;
    try {
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      // Find and delete all replies for this post
      const postReplies = await svc.query('boardReplies', [
        { field: 'postId', operator: '==', value: post.id }
      ]);
      const replyIds = (postReplies || []).map((r) => r.id);
      if (replyIds.length > 0) {
        await svc.batchDelete('boardReplies', replyIds);
      }
      await svc.delete('boardPosts', post.id);
      await adminLogger.logDelete('boardPosts', post.id);
    } catch (e) {
      console.error('Error deleting post', e);
      alert('Failed to delete post.');
    }
  };

  const handleDeleteReply = async (reply) => {
    if (!confirm('Delete this reply and its nested replies?')) return;
    try {
      const { default: svc } = await import('@/lib/firebase/firebaseService');
      // Collect descendants for this reply within the same post
      const allForPost = replies.filter((r) => r.postId === reply.postId);
      const byParent = new Map();
      allForPost.forEach((r) => {
        const list = byParent.get(r.parentId || null) || [];
        list.push(r);
        byParent.set(r.parentId || null, list);
      });
      const toDelete = new Set([reply.id]);
      const stack = [reply.id];
      while (stack.length) {
        const current = stack.pop();
        const children = allForPost.filter((r) => r.parentId === current);
        for (const child of children) {
          if (!toDelete.has(child.id)) {
            toDelete.add(child.id);
            stack.push(child.id);
          }
        }
      }
      await svc.batchDelete('boardReplies', Array.from(toDelete));
      await adminLogger.logDelete('boardReplies', reply.id);
    } catch (e) {
      console.error('Error deleting reply', e);
      alert('Failed to delete reply.');
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
            <PostThread
              key={post.id}
              post={post}
              replies={(repliesByPostId.get(post.id) || [])}
              onCreateReply={handleCreateReply}
              onToggleComplete={() => handleToggleComplete(post)}
              onDeletePost={() => handleDelete(post)}
              onDeleteReply={handleDeleteReply}
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

function PostThread({ post, replies, onCreateReply, onToggleComplete, onDeletePost, onDeleteReply, onMentionClick }) {
  const createdAt = useMemo(() => {
    try {
      if (post.createdAt?.toDate) return post.createdAt.toDate();
      if (post.createdAt?.seconds) return new Date(post.createdAt.seconds * 1000);
      return null;
    } catch {
      return null;
    }
  }, [post.createdAt]);

  const [isReplying, setIsReplying] = useState(false);

  const threadTree = useMemo(() => buildThreadTree(replies), [replies]);

  const handleCreateTopLevelReply = async ({ text, mentions }) => {
    await onCreateReply({ postId: post.id, parentId: null, text, mentions });
    setIsReplying(false);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 grid place-items-center text-xs font-semibold select-none">{initials(post.createdBy)}</div>
      <div className={`relative group flex-1 max-w-[85%] rounded-2xl px-3 py-2 border ${post.completed ? 'bg-secondary-50 border-secondary-200' : 'bg-white border-secondary-200'} shadow-sm`}> 
        <button
          onClick={onDeletePost}
          aria-label="Delete post"
          className="absolute top-2 right-2 p-1 rounded-md text-secondary-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9 3.75A.75.75 0 0 1 9.75 3h4.5a.75.75 0 0 1 .75.75V6h3.75a.75.75 0 0 1 0 1.5h-.708l-.63 10.08A2.25 2.25 0 0 1 15.167 19.5H8.833a2.25 2.25 0 0 1-2.245-1.92L5.958 7.5H5.25a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 0V6h3V3.75h-3ZM9.75 9a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 9.75 9Zm4.5 0a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
        </button>
        <div className={`text-[15px] leading-relaxed ${post.completed ? 'text-secondary-500 line-through' : 'text-secondary-900'}`}>
          {renderText(post.text, post.mentions, onMentionClick)}
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
          <button onClick={() => setIsReplying((v) => !v)} className="text-xs px-2 py-1 rounded-md border border-secondary-200 text-secondary-600 hover:bg-secondary-50">Reply</button>
        </div>
        {isReplying && (
          <div className="mt-2">
            <InlineComposer onSubmit={handleCreateTopLevelReply} />
          </div>
        )}

        {threadTree.length > 0 && (
          <div className="mt-3 space-y-2">
            {threadTree.map((node) => (
              <ReplyNode
                key={node.reply.id}
                node={node}
                onReply={async ({ text, mentions }) => onCreateReply({ postId: post.id, parentId: node.reply.id, text, mentions })}
                onDelete={onDeleteReply}
                onMentionClick={onMentionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyNode({ node, onReply, onDelete, onMentionClick, depth = 0 }) {
  const { reply, children } = node;
  const [isReplying, setIsReplying] = useState(false);

  const createdAt = useMemo(() => {
    try {
      if (reply.createdAt?.toDate) return reply.createdAt.toDate();
      if (reply.createdAt?.seconds) return new Date(reply.createdAt.seconds * 1000);
      return null;
    } catch {
      return null;
    }
  }, [reply.createdAt]);

  return (
    <div className="flex gap-2" style={{ marginLeft: depth * 16 }}>
      <div className="w-7 h-7 rounded-full bg-secondary-100 text-secondary-700 grid place-items-center text-[10px] font-semibold select-none">{initials(reply.createdBy)}</div>
      <div className="flex-1">
        <div className="relative group rounded-xl px-3 py-2 border bg-white border-secondary-200 shadow-sm">
          <button
            onClick={() => onDelete(reply)}
            aria-label="Delete reply"
            className="absolute top-2 right-2 p-1 rounded-md text-secondary-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.75A.75.75 0 0 1 9.75 3h4.5a.75.75 0 0 1 .75.75V6h3.75a.75.75 0 0 1 0 1.5h-.708l-.63 10.08A2.25 2.25 0 0 1 15.167 19.5H8.833a2.25 2.25 0 0 1-2.245-1.92L5.958 7.5H5.25a.75.75 0 0 1 0-1.5H9V3.75Zm1.5 0V6h3V3.75h-3ZM9.75 9a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6A.75.75 0 0 1 9.75 9Zm4.5 0a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0v-6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="text-[14px] leading-relaxed text-secondary-900">
            {renderText(reply.text, reply.mentions, onMentionClick)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-secondary-500">
            <span>{reply.createdBy || 'Admin'}</span>
            {createdAt && <span>• {createdAt.toLocaleString()}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setIsReplying((v) => !v)} className="text-[11px] px-2 py-1 rounded-md border border-secondary-200 text-secondary-600 hover:bg-secondary-50">Reply</button>
          </div>
          {isReplying && (
            <div className="mt-2">
              <InlineComposer onSubmit={async ({ text, mentions }) => { await onReply({ text, mentions }); setIsReplying(false); }} />
            </div>
          )}
        </div>
        {children && children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children.map((child) => (
              <ReplyNode
                key={child.reply.id}
                node={child}
                onReply={(args) => onReply(args)}
                onDelete={onDelete}
                onMentionClick={onMentionClick}
                depth={Math.min(depth + 1, 6)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InlineComposer({ onSubmit }) {
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef(null);

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
    const newPos = newBefore.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  };

  const parseMentions = (value) => {
    const matches = value.match(/@([\w\s]+)/g) || [];
    const labels = matches.map((m) => m.slice(1).trim());
    const uniqLabels = Array.from(new Set(labels));
    const resolved = uniqLabels.map((label) => mentionables.find((m) => m.label.toLowerCase() === label.toLowerCase()) || { type: 'tag', id: null, label });
    return resolved;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const mentions = parseMentions(text);
    await onSubmit({ text: text.trim(), mentions });
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
            placeholder="Write a reply… Use @ to tag"
            className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/90 placeholder-secondary-400 resize-none text-[14px]"
          />
          {showMenu && menuItems.length > 0 && (
            <div className="absolute bottom-11 left-2 z-20 w-72 max-w-[calc(100%-1rem)] bg-white border border-secondary-200 rounded-xl shadow-lg overflow-hidden">
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
          disabled={!text.trim()}
          className="px-3 h-9 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 text-white text-[13px] font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reply
        </button>
      </div>
    </form>
  );
}

function renderText(text, mentions, onMentionClick) {
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
}

function initials(name) {
  const safe = (name || 'A').toString();
  return safe.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

function buildThreadTree(flatReplies) {
  if (!Array.isArray(flatReplies) || flatReplies.length === 0) return [];
  const byId = new Map();
  const roots = [];
  flatReplies.forEach((r) => {
    byId.set(r.id, { reply: r, children: [] });
  });
  flatReplies.forEach((r) => {
    const node = byId.get(r.id);
    if (r.parentId && byId.has(r.parentId)) {
      byId.get(r.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortByCreated = (a, b) => {
    const aTs = a.reply.createdAt?.seconds || 0;
    const bTs = b.reply.createdAt?.seconds || 0;
    return aTs - bTs;
  };
  const sortTree = (nodes) => {
    nodes.sort(sortByCreated);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);
  return roots;
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