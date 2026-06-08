'use client';

import { useState, useRef, useEffect } from 'react';
import Sheet from '@/components/ui/Sheet';
import MealChips from '@/components/log/MealChips';
import ConfirmCard from '@/components/log/ConfirmCard';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ChatSheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function ChatSheet({
  open,
  onClose,
  onLogged,
}: ChatSheetProps) {
  const toastCtx = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [meal, setMeal] = useState('Breakfast');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'chat' | 'confirm'>('chat');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'ai',
          text: "Hey! Tell me what you ate and I'll log it for you 🍽️",
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  function reset() {
    setMessages([]);
    setInput('');
    setMeal('Breakfast');
    setStage('chat');
    setFoodName('');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', text: userMsg },
    ];
    setMessages(nextMessages);
    setLoading(true);

    const userCount = nextMessages.filter((m) => m.role === 'user').length;

    await new Promise((r) => setTimeout(r, 1200));

    if (userCount === 1) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Got it! How much did you have — one serving, a bowl, a plate?',
        },
      ]);
      setLoading(false);
      return;
    }

    setFoodName(userMsg.slice(0, 80));
    setCalories(450);
    setProtein(28);
    setCarbs(42);
    setFat(18);
    setStage('confirm');
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/food-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: foodName,
          calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          source: 'manual',
          meal_type: meal.toLowerCase(),
        }),
      });

      if (res.ok) {
        toastCtx?.toast('Food logged! 🎉', 'success');
        onLogged();
        onClose();
        reset();
      } else {
        toastCtx?.toast('Failed to log food', 'error');
      }
    } catch {
      toastCtx?.toast('Failed to log food', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Chat with AI">
      {stage === 'chat' && (
        <>
          <div
            className="flex flex-col gap-2.5 mb-4 max-h-[260px] overflow-y-auto no-scrollbar"
            ref={scrollRef}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[82%]',
                  m.role === 'user' ? 'self-end' : 'self-start'
                )}
              >
                <div
                  className="px-3.5 py-2.5 rounded-[15px] text-[12.5px] leading-[1.5]"
                  style={
                    m.role === 'user'
                      ? {
                          background: 'var(--accent)',
                          color: '#fff',
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div
                className="self-start px-3.5 py-3 rounded-[15px] flex gap-1.5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
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

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 h-11 rounded-[13px] px-3.5 text-sm text-primary outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
              }}
              placeholder="What did you eat?"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0 transition-transform active:scale-[0.88] disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 16px var(--accent-glow)',
              }}
            >
              <svg
                width="16"
                height="16"
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
        </>
      )}

      {stage === 'confirm' && (
        <>
          <MealChips value={meal} onChange={setMeal} />
          <ConfirmCard
            foodName={foodName}
            calories={calories}
            proteinG={protein}
            carbsG={carbs}
            fatG={fat}
            confidence="medium"
            onFoodNameChange={setFoodName}
            onCaloriesChange={setCalories}
            onProteinChange={setProtein}
            onCarbsChange={setCarbs}
            onFatChange={setFat}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[15px] py-4 font-bold text-sm text-white font-display active:scale-[0.96] disabled:opacity-50 mb-2"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 28px var(--accent-glow)',
            }}
          >
            {saving ? 'Saving…' : 'Confirm & Log'}
          </button>
          <button
            type="button"
            onClick={() => setStage('chat')}
            className="w-full rounded-[15px] py-3.5 text-sm font-semibold text-secondary active:scale-[0.96]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            Edit
          </button>
        </>
      )}
    </Sheet>
  );
}
