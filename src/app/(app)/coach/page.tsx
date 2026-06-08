'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Send,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Brain,
} from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

interface Message {
  id?: string;
  role: 'user' | 'ai';
  content: string;
  created_at?: string;
}

const SUGGESTIONS = [
  'How am I doing today?',
  'What should I eat for dinner?',
  'Am I hitting my protein?',
  'Will I hit my goal this week?',
  'Give me a high protein meal idea',
];

export default function CoachPage() {
  const toastCtx = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string } | null>(null);
  const [memory, setMemory] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  const loadChat = useCallback(
    async (chat: Chat) => {
      setActiveChat(chat);
      setShowHistory(false);
      setLoading(true);
      try {
        const res = await fetch(`/api/coach-chats/${chat.id}`);
        const data = await res.json();
        setMessages(data.messages ?? []);
      } finally {
        setLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      }
    },
    [scrollToBottom]
  );

  const createNewChat = useCallback(async () => {
    const res = await fetch('/api/coach-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      setChats((prev) => [data.chat, ...prev]);
      setActiveChat(data.chat);
      setMessages([]);
      setShowHistory(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const [meRes, chatsRes, memRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/coach-chats'),
        fetch('/api/user-memory'),
      ]);

      const meData = await meRes.json();
      const chatsData = await chatsRes.json();
      const memData = await memRes.json();

      setProfile(meData.user?.profile ?? null);
      setMemory(memData.memory ?? []);

      const chatList: Chat[] = chatsData.chats ?? [];
      setChats(chatList);

      if (chatList.length > 0) {
        setActiveChat(chatList[0]);
        setLoading(true);
        const res = await fetch(`/api/coach-chats/${chatList[0].id}`);
        const data = await res.json();
        setMessages(data.messages ?? []);
        setLoading(false);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const res = await fetch('/api/coach-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (res.ok) {
          setChats([data.chat]);
          setActiveChat(data.chat);
          setMessages([]);
        }
      }
    }
    init();
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  async function deleteChat(id: string) {
    await fetch(`/api/coach-chats/${id}`, { method: 'DELETE' });
    const remaining = chats.filter((c) => c.id !== id);
    setChats(remaining);
    if (activeChat?.id === id) {
      if (remaining.length > 0) {
        loadChat(remaining[0]);
      } else {
        setActiveChat(null);
        setMessages([]);
      }
    }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');

    const tempMsg: Message = { role: 'user', content: msg };
    setMessages((prev) => [...prev, tempMsg]);
    setSending(true);

    let chatId = activeChat?.id;
    if (!chatId) {
      const newChatRes = await fetch('/api/coach-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const newChatData = await newChatRes.json();
      setChats((prev) => [newChatData.chat, ...prev]);
      setActiveChat(newChatData.chat);
      chatId = newChatData.chat.id;
    }

    try {
      const res = await fetch(`/api/coach-chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  title: msg.slice(0, 40),
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        );
        const memRes = await fetch('/api/user-memory');
        const memData = await memRes.json();
        if (memRes.ok) setMemory(memData.memory ?? []);
      } else if (res.status === 429) {
        toastCtx?.toast(data.error, 'error');
        setMessages((prev) => prev.filter((m) => m !== tempMsg));
      } else {
        toastCtx?.toast('Coach unavailable, try again', 'error');
        setMessages((prev) => prev.filter((m) => m !== tempMsg));
      }
    } catch {
      toastCtx?.toast('Coach unavailable, try again', 'error');
      setMessages((prev) => prev.filter((m) => m !== tempMsg));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="flex flex-col relative"
      style={{ height: '100dvh', paddingBottom: '88px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-5 pt-14 pb-3 flex items-end justify-between flex-shrink-0"
      >
        <div>
          <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
            CalTrack
          </p>
          <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-[-0.03em] text-primary mt-0.5">
            AI
            <br />
            <span style={{ color: 'var(--accent2)' }}>Coach.</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowMemory(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <Brain className="w-4 h-4 text-muted" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowHistory(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <MessageSquare className="w-4 h-4 text-muted" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={createNewChat}
            className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 font-bold text-[11px] text-white"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </motion.button>
        </div>
      </motion.div>

      {activeChat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-3 flex-shrink-0"
        >
          <p className="text-[11px] font-medium text-muted truncate max-w-[260px]">
            💬 {activeChat.title}
          </p>
        </motion.div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-5"
        style={{ paddingBottom: 16 }}
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[var(--accent2)] animate-spin" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.length === 0 && !sending && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pt-6 pb-4"
              >
                <div
                  className="rounded-[22px] border p-5 mb-5"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    🤖
                  </div>
                  <p className="font-display text-base font-bold text-primary mb-1.5">
                    Hey{profile?.display_name ? `, ${profile.display_name}` : ''}
                    !
                  </p>
                  <p className="text-sm text-secondary leading-relaxed">
                    I&apos;m your personal nutrition coach. I know your goals,
                    what you&apos;ve eaten today, and your history. Ask me
                    anything.
                  </p>
                </div>

                <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted mb-3">
                  Try asking…
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSend(s)}
                      className="w-full text-left px-4 py-3.5 rounded-[16px] border text-sm font-medium text-secondary flex items-center justify-between transition-all active:opacity-70"
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      {s}
                      <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-muted flex-shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((m, i) => (
              <motion.div
                key={m.id ?? i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className={`flex mb-3 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'ai' && (
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                    style={{
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    🤖
                  </div>
                )}

                <div style={{ maxWidth: '78%' }}>
                  <motion.div
                    className="px-4 py-3 text-[13.5px] leading-[1.65]"
                    style={
                      m.role === 'user'
                        ? {
                            background: 'var(--accent)',
                            color: '#fff',
                            borderRadius: '20px 20px 5px 20px',
                            boxShadow: '0 2px 12px rgba(124,110,248,0.3)',
                          }
                        : {
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            borderRadius: '20px 20px 20px 5px',
                          }
                    }
                  >
                    {m.content}
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {sending && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start mb-3"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  🤖
                </div>
                <div
                  className="flex items-center gap-1.5 px-4 py-4 rounded-[20px] rounded-bl-[5px]"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--text-muted)' }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: i * 0.18,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div
        className="flex-shrink-0 px-4 pb-3 pt-2"
        style={{
          background: 'rgba(7,7,13,0.95)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="flex gap-2 p-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={sending}
            className="flex-1 bg-transparent text-[13.5px] text-primary outline-none px-2 py-1"
            style={{ caretColor: 'var(--accent2)' }}
            placeholder="Ask your coach anything…"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              key="hist-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 z-[300]"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              key="hist-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[301] max-w-[430px] mx-auto rounded-t-[28px]"
              style={{
                background: '#131318',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                maxHeight: '75vh',
              }}
            >
              <div className="px-6 pt-3 pb-5 flex flex-col h-full overflow-hidden">
                <div className="w-9 h-1 rounded-full bg-white/10 mx-auto mb-5" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-primary">
                    Conversations
                  </h3>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={createNewChat}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Plus className="w-3 h-3" />
                    New Chat
                  </motion.button>
                </div>

                <div
                  className="flex-1 overflow-y-auto no-scrollbar space-y-2"
                  style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                  }}
                >
                  {chats.length === 0 ? (
                    <p className="text-sm text-muted text-center py-8">
                      No conversations yet
                    </p>
                  ) : (
                    chats.map((chat) => (
                      <motion.div
                        key={chat.id}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-3 rounded-[16px] border px-4 py-3.5 cursor-pointer transition-all"
                        style={{
                          background:
                            activeChat?.id === chat.id
                              ? 'var(--accent-dim)'
                              : 'var(--surface)',
                          borderColor:
                            activeChat?.id === chat.id
                              ? 'var(--accent-border)'
                              : 'var(--border)',
                        }}
                        onClick={() => loadChat(chat)}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          💬
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {chat.title}
                          </p>
                          <p className="font-mono text-[9px] text-muted mt-0.5">
                            {new Date(chat.updated_at).toLocaleDateString(
                              'en-AU',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform active:scale-90"
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-danger" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMemory && (
          <>
            <motion.div
              key="mem-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMemory(false)}
              className="fixed inset-0 z-[300]"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              key="mem-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[301] max-w-[430px] mx-auto rounded-t-[28px]"
              style={{
                background: '#131318',
                border: '1px solid var(--border)',
                borderBottom: 'none',
                maxHeight: '75vh',
              }}
            >
              <div
                className="px-6 pt-3 overflow-y-auto no-scrollbar"
                style={{
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                  maxHeight: '75vh',
                }}
              >
                <div className="w-9 h-1 rounded-full bg-white/10 mx-auto mb-5" />
                <div className="flex items-center gap-2 mb-4">
                  <Brain
                    className="w-5 h-5"
                    style={{ color: 'var(--accent2)' }}
                  />
                  <h3 className="font-display text-lg font-bold text-primary">
                    Coach Memory
                  </h3>
                </div>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Things your coach remembers about you from past conversations.
                  This makes advice more personalised.
                </p>
                {memory.length === 0 ? (
                  <div
                    className="rounded-[16px] border p-5 text-center"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <p className="text-sm text-muted">
                      No memories yet. Chat with your coach and it will learn
                      your preferences.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {memory.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-[14px] border px-4 py-3"
                        style={{
                          background: 'var(--surface)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <span className="text-[var(--accent2)] font-mono text-xs mt-0.5 flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-secondary leading-relaxed">
                          {m}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
