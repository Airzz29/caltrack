'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  Star,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface FoodScoutResult {
  food_name: string;
  brand?: string | null;
  per_100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number | null;
    sugar_g?: number | null;
    sodium_mg?: number | null;
  };
  common_servings: Array<{ label: string; grams: number }>;
  notes?: string | null;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface SavedFood {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number | null;
  fat_g: number | null;
  is_favourite: boolean;
  times_used: number;
  default_serving: string | null;
}

export default function FoodsPage() {
  const toastCtx = useToast();

  const [scoutStage, setScoutStage] = useState<'idle' | 'loading' | 'chat'>(
    'idle'
  );
  const [scoutResult, setScoutResult] = useState<FoodScoutResult | null>(null);
  const [chosenGrams, setChosenGrams] = useState(100);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([]);
  const [savingFood, setSavingFood] = useState(false);
  const [savedFoodsLoading, setSavedFoodsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingType, setLoadingType] = useState<'photo' | 'label'>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const portion = useMemo(() => {
    if (!scoutResult) return null;
    const f = chosenGrams / 100;
    return {
      calories: Math.round(scoutResult.per_100g.calories * f),
      protein: Math.round(scoutResult.per_100g.protein_g * f * 10) / 10,
      carbs: Math.round(scoutResult.per_100g.carbs_g * f * 10) / 10,
      fat: Math.round(scoutResult.per_100g.fat_g * f * 10) / 10,
    };
  }, [scoutResult, chosenGrams]);

  useEffect(() => {
    async function loadSavedFoods() {
      setSavedFoodsLoading(true);
      try {
        const res = await fetch('/api/saved-foods');
        const data = await res.json();
        if (res.ok) setSavedFoods(data.foods);
      } catch {
        // ignore
      } finally {
        setSavedFoodsLoading(false);
      }
    }
    loadSavedFoods();
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, chatLoading]);

  function reset() {
    setScoutStage('idle');
    setScoutResult(null);
    setChatMessages([]);
    setChosenGrams(100);
    setChatInput('');
  }

  function handlePhoto(file: File) {
    if (file.size > 4_000_000) {
      toastCtx?.toast('Image too large (max 4MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setLoadingType('photo');
      setScoutStage('loading');

      try {
        const res = await fetch('/api/ai/food-scout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();

        if (res.ok) {
          setScoutResult(data.result);
          setChosenGrams(100);
          setChatMessages([
            {
              role: 'ai',
              text: `I found ${data.result.food_name}${data.result.brand ? ` by ${data.result.brand}` : ''}. ${data.result.notes ?? ''} Ask me anything about it — I know your goals and what you've eaten today.`,
            },
          ]);
          setScoutStage('chat');
        } else {
          toastCtx?.toast('Could not identify food', 'error');
          setScoutStage('idle');
        }
      } catch {
        toastCtx?.toast('Could not identify food', 'error');
        setScoutStage('idle');
      }
    };
    reader.readAsDataURL(file);
  }

  function handleLabelPhoto(file: File) {
    if (file.size > 4_000_000) {
      toastCtx?.toast('Image too large (max 4MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setLoadingType('label');
      setScoutStage('loading');

      try {
        const res = await fetch('/api/ai/label', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            serving_description:
              'per 100g — user will specify portion in chat',
          }),
        });
        const data = await res.json();

        if (res.ok) {
          const result = data.result;
          setScoutResult({
            food_name: result.food_name,
            brand: null,
            per_100g: {
              calories: result.calories,
              protein_g: result.protein_g,
              carbs_g: result.carbs_g,
              fat_g: result.fat_g,
              fiber_g: result.fiber_g ?? null,
              sugar_g: result.sugar_g ?? null,
              sodium_mg: result.sodium_mg ?? null,
            },
            common_servings: [
              { label: result.serving_size ?? '1 serving', grams: 100 },
              { label: '50g', grams: 50 },
              { label: '100g', grams: 100 },
              { label: '200g', grams: 200 },
            ],
            notes: 'Scanned from nutrition label',
          });
          setChosenGrams(100);
          setChatMessages([
            {
              role: 'ai',
              text: `I've read the nutrition label for ${result.food_name}. Per 100g it's ${result.calories} kcal with ${result.protein_g}g protein. How much are you planning to have? Adjust the slider or ask me if it fits your goals.`,
            },
          ]);
          setScoutStage('chat');
        } else {
          toastCtx?.toast('Could not read label', 'error');
          setScoutStage('idle');
        }
      } catch {
        toastCtx?.toast('Could not read label', 'error');
        setScoutStage('idle');
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading || !scoutResult) return;

    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/food-scout/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: chatMessages,
          foodContext: {
            food_name: scoutResult.food_name,
            brand: scoutResult.brand,
            per_100g: scoutResult.per_100g,
            chosenGrams,
          },
        }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.logged && data.logData) {
          window.dispatchEvent(new CustomEvent('food-logged'));
          setChatMessages((prev) => [
            ...prev,
            { role: 'ai', text: data.reply },
            {
              role: 'ai',
              text: `✓ Logged: ${data.logData.food_name} — ${data.logData.calories} kcal · ${data.logData.protein_g}g protein`,
            },
          ]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            { role: 'ai', text: data.reply },
          ]);
        }
      } else {
        toastCtx?.toast('AI error', 'error');
      }
    } catch {
      toastCtx?.toast('AI error', 'error');
    } finally {
      setChatLoading(false);
    }
  }

  async function handleAddToLog() {
    if (!scoutResult || !portion) return;

    try {
      const res = await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: `${scoutResult.food_name} (${chosenGrams}g)`,
          calories: portion.calories,
          protein_g: portion.protein,
          carbs_g: portion.carbs,
          fat_g: portion.fat,
          source: 'photo',
          serving_size: `${chosenGrams}g`,
        }),
      });

      if (res.ok) {
        window.dispatchEvent(new CustomEvent('food-logged'));
        toastCtx?.toast("Added to today's log 🎉", 'success');
      }
    } catch {
      toastCtx?.toast('Could not add to log', 'error');
    }
  }

  async function handleSaveFood() {
    if (!scoutResult) return;

    setSavingFood(true);
    try {
      const res = await fetch('/api/saved-foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: scoutResult.food_name,
          calories: scoutResult.per_100g.calories,
          protein_g: scoutResult.per_100g.protein_g,
          carbs_g: scoutResult.per_100g.carbs_g,
          fat_g: scoutResult.per_100g.fat_g,
          fiber_g: scoutResult.per_100g.fiber_g ?? null,
          default_serving: `${chosenGrams}g`,
        }),
      });

      if (res.ok) {
        toastCtx?.toast('Saved to your foods ✓', 'success');
        const listRes = await fetch('/api/saved-foods');
        const listData = await listRes.json();
        if (listRes.ok) setSavedFoods(listData.foods);
      }
    } catch {
      toastCtx?.toast('Could not save food', 'error');
    } finally {
      setSavingFood(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/saved-foods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedFoods((prev) => prev.filter((f) => f.id !== id));
      }
    } catch {
      toastCtx?.toast('Could not delete', 'error');
    }
  }

  async function handleFavourite(id: string) {
    try {
      const res = await fetch(`/api/saved-foods/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setSavedFoods((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, is_favourite: !f.is_favourite } : f
          )
        );
      }
    } catch {
      toastCtx?.toast('Could not update favourite', 'error');
    }
  }

  const filteredFoods = savedFoods.filter((f) =>
    f.food_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen relative" style={{ zIndex: 2 }}>
      <div
        className="px-5 pt-14 pb-2"
        style={{ animation: 'fadeUp 0.3s var(--ease-ios) both' }}
      >
        <p className="text-[9.5px] font-bold tracking-[0.3em] uppercase text-muted">
          CalTrack
        </p>
        <h1 className="font-display text-[28px] font-extrabold leading-[1.12] tracking-[-0.03em] text-primary mt-0.5">
          Food
          <br />
          <span style={{ color: 'var(--accent2)' }}>Scout.</span>
        </h1>
      </div>

      <div className="px-5 pb-32 space-y-5 mt-4">
        <AnimatePresence mode="wait">
          {scoutStage === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handlePhoto(e.target.files[0])
                }
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-[22px] border flex flex-col items-center justify-center gap-3 py-10 transition-transform active:scale-[0.98]"
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-dim) 0%, transparent 65%)',
                  borderColor: 'var(--accent-border)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)',
                  }}
                >
                  <Camera
                    className="w-7 h-7"
                    style={{ color: 'var(--accent2)' }}
                  />
                </div>
                <div className="text-center">
                  <p className="font-display text-base font-bold text-primary">
                    Scan a Food
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Take a photo to see nutrition + ask AI
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[10px] text-muted uppercase tracking-wider font-bold">
                  or
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <input
                ref={labelInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleLabelPhoto(e.target.files[0])
                }
              />

              <button
                type="button"
                onClick={() => labelInputRef.current?.click()}
                className="w-full rounded-[22px] border flex flex-col items-center justify-center gap-3 py-8 transition-transform active:scale-[0.98]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-2xl">🏷️</span>
                </div>
                <div className="text-center">
                  <p className="font-display text-sm font-bold text-primary">
                    Scan Nutrition Label
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    See if it fits your goals, then track it
                  </p>
                </div>
              </button>
            </motion.div>
          )}

          {scoutStage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <div className="w-6 h-6 rounded-full border-[2.5px] border-white/10 border-t-[var(--accent2)] animate-spin" />
              <p className="text-sm text-secondary">
                {loadingType === 'photo'
                  ? 'Identifying food…'
                  : 'Reading nutrition label…'}
              </p>
              <p className="text-xs text-muted">Powered by Claude AI</p>
            </motion.div>
          )}

          {scoutStage === 'chat' && scoutResult && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32 }}
              className="space-y-4"
            >
              <div
                className="rounded-[22px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="px-5 pt-4 pb-3 flex items-start justify-between border-b"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="font-display text-lg font-bold text-primary leading-tight">
                      {scoutResult.food_name}
                    </p>
                    {scoutResult.brand && (
                      <p className="font-mono text-[10.5px] text-muted mt-0.5">
                        {scoutResult.brand}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
                    style={{
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>

                <div
                  className="grid grid-cols-4 divide-x"
                  style={{
                    borderColor: 'var(--border)',
                  }}
                >
                  {[
                    {
                      label: 'kcal',
                      value: scoutResult.per_100g.calories,
                      color: 'var(--text-primary)',
                    },
                    {
                      label: 'pro',
                      value: scoutResult.per_100g.protein_g,
                      color: 'var(--accent2)',
                    },
                    {
                      label: 'carbs',
                      value: scoutResult.per_100g.carbs_g,
                      color: 'var(--amber)',
                    },
                    {
                      label: 'fat',
                      value: scoutResult.per_100g.fat_g,
                      color: 'var(--fat-color)',
                    },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="py-3 text-center"
                      style={{ borderRight: '1px solid var(--border)' }}
                    >
                      <p
                        className="font-mono text-base font-medium"
                        style={{ color }}
                      >
                        {value}
                      </p>
                      <p className="font-mono text-[8.5px] text-muted mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-muted text-center pb-1">
                  per 100g
                </p>

                <div
                  className="px-5 py-4 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-secondary">
                      Portion size
                    </p>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={chosenGrams}
                        onChange={(e) =>
                          setChosenGrams(
                            Math.max(
                              1,
                              Math.min(1000, Number(e.target.value))
                            )
                          )
                        }
                        className="w-16 h-7 rounded-lg text-center font-mono text-sm text-primary outline-none"
                        style={{
                          background: 'var(--elevated)',
                          border: '1px solid var(--border)',
                        }}
                      />
                      <span className="font-mono text-xs text-muted">g</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={chosenGrams}
                    onChange={(e) => setChosenGrams(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                    style={{ accentColor: 'var(--accent2)' }}
                  />

                  {scoutResult.common_servings?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {scoutResult.common_servings.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setChosenGrams(s.grams)}
                          className="text-[10px] font-medium px-3 py-1.5 rounded-full border transition-all"
                          style={{
                            background:
                              chosenGrams === s.grams
                                ? 'var(--accent-dim)'
                                : 'var(--elevated)',
                            borderColor:
                              chosenGrams === s.grams
                                ? 'var(--accent-border)'
                                : 'var(--border)',
                            color:
                              chosenGrams === s.grams
                                ? 'var(--accent2)'
                                : 'var(--text-muted)',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {portion && (
                    <div
                      className="mt-3 rounded-[14px] px-4 py-3 flex items-center justify-between"
                      style={{
                        background: 'var(--elevated)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-xs text-secondary">
                        {chosenGrams}g =
                      </span>
                      <div className="flex gap-4">
                        <span className="font-mono text-sm font-bold text-primary">
                          {portion.calories} kcal
                        </span>
                        <span
                          className="font-mono text-sm"
                          style={{ color: 'var(--accent2)' }}
                        >
                          {portion.protein}g pro
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddToLog}
                    className="flex-1 rounded-[13px] py-3 font-bold text-sm text-white transition-transform active:scale-[0.96]"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 0 20px var(--accent-glow)',
                    }}
                  >
                    Add to Log
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFood}
                    disabled={savingFood}
                    className="flex-1 rounded-[13px] py-3 font-bold text-sm transition-transform active:scale-[0.96] disabled:opacity-50"
                    style={{
                      background: 'var(--elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {savingFood ? 'Saving…' : 'Save Food'}
                  </button>
                </div>
              </div>

              <div
                className="rounded-[22px] border overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="px-4 pt-3 pb-2 border-b flex items-center gap-2"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-[11px]"
                    style={{ background: 'var(--accent-dim)' }}
                  >
                    🤖
                  </div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Ask AI
                  </p>
                </div>

                <div
                  ref={chatScrollRef}
                  className="flex flex-col gap-2.5 px-4 py-3 max-h-[260px] overflow-y-auto no-scrollbar"
                >
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        'max-w-[85%] text-[12.5px] leading-[1.55] px-3.5 py-2.5 rounded-[14px]',
                        m.role === 'user'
                          ? 'self-end text-white'
                          : 'self-start border'
                      )}
                      style={
                        m.role === 'user'
                          ? {
                              background: 'var(--accent)',
                              borderBottomRightRadius: 4,
                            }
                          : {
                              background: 'var(--elevated)',
                              borderColor: 'var(--border)',
                              color: 'var(--text-primary)',
                              borderBottomLeftRadius: 4,
                            }
                      }
                    >
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div
                      className="self-start flex gap-1.5 px-3.5 py-3 rounded-[14px] border"
                      style={{
                        background: 'var(--elevated)',
                        borderColor: 'var(--border)',
                        borderBottomLeftRadius: 4,
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="px-4 pb-4 flex gap-2 border-t pt-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    className="flex-1 h-10 rounded-[11px] px-3.5 text-sm text-primary outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border)',
                    }}
                    placeholder="Will this fit my cut?"
                  />
                  <button
                    type="button"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0 transition-transform active:scale-[0.88] disabled:opacity-50"
                    style={{
                      background: 'var(--accent)',
                      boxShadow: '0 0 14px var(--accent-glow)',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="14" y1="2" x2="2" y2="8" />
                      <line x1="14" y1="2" x2="8" y2="14" />
                      <line x1="2" y1="8" x2="8" y2="14" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={reset}
                className="w-full rounded-[15px] py-3.5 text-sm font-semibold text-secondary transition-transform active:scale-[0.97]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                📸 Scan another food
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          style={{ animation: 'fadeUp 0.5s var(--ease-ios) 0.2s both' }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] font-bold tracking-[0.24em] uppercase text-muted flex items-center gap-2">
              Saved Foods
              <span className="flex-1 h-px bg-[var(--border)]" />
            </p>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 rounded-[13px] pl-9 pr-4 text-sm text-primary outline-none"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              placeholder="Search saved foods…"
            />
          </div>

          {savedFoodsLoading ? (
            <div className="text-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-accent inline-block animate-spin" />
            </div>
          ) : filteredFoods.length === 0 ? (
            <div
              className="rounded-[22px] border p-8 text-center"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <p className="text-2xl mb-2">🥗</p>
              <p className="text-sm font-semibold text-primary mb-1">
                No saved foods yet
              </p>
              <p className="text-xs text-muted">
                Scan a food above to save it here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="rounded-[16px] border px-4 py-3 flex items-center gap-3"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary truncate">
                      {food.food_name}
                    </p>
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {food.calories} kcal · {food.protein_g}g pro
                      {food.default_serving
                        ? ` · per ${food.default_serving}`
                        : ' · per 100g'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFavourite(food.id)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className="w-4 h-4"
                        style={{
                          fill: food.is_favourite ? 'var(--amber)' : 'none',
                          color: food.is_favourite
                            ? 'var(--amber)'
                            : 'var(--text-muted)',
                        }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/food-log', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            food_name: food.food_name,
                            calories: food.calories,
                            protein_g: food.protein_g,
                            carbs_g: food.carbs_g ?? 0,
                            fat_g: food.fat_g ?? 0,
                            source: 'manual',
                          }),
                        });
                        window.dispatchEvent(new CustomEvent('food-logged'));
                        toastCtx?.toast(`${food.food_name} added ✓`, 'success');
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                      }}
                    >
                      <Plus
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--accent2)' }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(food.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform active:scale-90"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
