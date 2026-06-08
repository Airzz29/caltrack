'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sheet from '@/components/ui/Sheet';
import ConfirmCard from '@/components/log/ConfirmCard';
import MealChips from '@/components/log/MealChips';
import { useToast } from '@/components/ui/Toast';
import { Camera, Loader2 } from 'lucide-react';

interface PhotoSheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
    },
  },
  exit: { x: -40, opacity: 0, transition: { duration: 0.2 } },
};

export default function PhotoSheet({
  open,
  onClose,
  onLogged,
}: PhotoSheetProps) {
  const toastCtx = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<
    'capture' | 'describe' | 'loading' | 'confirm'
  >('capture');
  const [fileData, setFileData] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [meal, setMeal] = useState('Breakfast');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const sheetTitle =
    step === 'capture'
      ? 'Photo of Meal'
      : step === 'describe'
        ? 'Describe your meal'
        : step === 'loading'
          ? 'Analysing…'
          : 'Confirm & Log';

  function reset() {
    setStep('capture');
    setFileData(null);
    setDescription('');
    setResult(null);
    setFoodName('');
    setCalories(0);
    setProtein(0);
    setCarbs(0);
    setFat(0);
  }

  function handleFileSelect(file: File) {
    if (file.size > 4_000_000) {
      toastCtx?.toast('Image too large (max 4MB)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setFileData(base64);
      setStep('describe');
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyse() {
    if (!fileData) return;
    setStep('loading');
    try {
      const res = await fetch('/api/ai/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fileData, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
        setFoodName(data.result.food_name);
        setCalories(data.result.calories);
        setProtein(data.result.protein_g);
        setCarbs(data.result.carbs_g);
        setFat(data.result.fat_g);
        setStep('confirm');
      } else {
        toastCtx?.toast('Could not analyse photo', 'error');
        setStep('capture');
      }
    } catch {
      toastCtx?.toast('Could not analyse photo', 'error');
      setStep('capture');
    }
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
          source: 'photo',
          meal_type: meal.toLowerCase(),
        }),
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('food-logged'));
        toastCtx?.toast('Added to log ✓', 'success');
        onLogged();
        onClose();
        reset();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={sheetTitle}>
      <AnimatePresence mode="wait">
        {step === 'capture' && (
          <motion.div
            key="capture"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
            />

            <div
              className="w-full rounded-[18px] border mb-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
              style={{
                aspectRatio: '4/3',
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="absolute left-[10%] right-[10%] h-[1.5px]"
                style={{
                  background:
                    'linear-gradient(90deg,transparent,var(--accent2),transparent)',
                  animation: 'scan 2.2s ease-in-out infinite',
                }}
              />
              {[
                { top: 14, left: 14, bw: '2.5px 0 0 2.5px', r: '5px 0 0 0' },
                { top: 14, right: 14, bw: '2.5px 2.5px 0 0', r: '0 5px 0 0' },
                {
                  bottom: 14,
                  left: 14,
                  bw: '0 0 2.5px 2.5px',
                  r: '0 0 0 5px',
                },
                {
                  bottom: 14,
                  right: 14,
                  bw: '0 2.5px 2.5px 0',
                  r: '0 0 5px 0',
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="absolute w-[22px] h-[22px]"
                  style={{
                    top: c.top,
                    left: c.left,
                    right: c.right,
                    bottom: c.bottom,
                    borderStyle: 'solid',
                    borderColor: 'var(--accent2)',
                    borderWidth: c.bw,
                    borderRadius: c.r,
                  }}
                />
              ))}
              <Camera
                className="w-8 h-8 z-10"
                style={{ color: 'var(--text-muted)' }}
              />
              <p className="text-xs text-muted z-10">
                Point camera at your food
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </motion.button>
          </motion.div>
        )}

        {step === 'describe' && (
          <motion.div
            key="describe"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-4"
          >
            <div
              className="rounded-[18px] border p-4 flex items-center gap-3"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--green-bg)',
                  border: '1px solid var(--green-border)',
                }}
              >
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">
                  Photo captured
                </p>
                <p className="text-xs text-muted mt-0.5">Ready to analyse</p>
              </div>
            </div>

            <div>
              <label className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted block mb-2">
                Describe your meal (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-[13px] px-4 py-3 text-sm text-primary outline-none resize-none leading-relaxed"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                }}
                placeholder="e.g. large bowl, restaurant portion, home cooked with extra rice…"
              />
              <p className="text-[10px] text-muted mt-1.5">
                Adding details improves AI accuracy
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyse}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              Analyse with AI →
            </motion.button>

            <button
              onClick={handleAnalyse}
              className="w-full py-2 text-sm text-muted transition-opacity hover:opacity-70"
            >
              Skip description
            </button>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2
                className="w-8 h-8"
                style={{ color: 'var(--accent2)' }}
              />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold text-secondary">
                Claude is analysing your meal
              </p>
              <p className="text-xs text-muted mt-1">
                Usually takes 3–5 seconds
              </p>
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-3"
          >
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
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              {saving ? 'Saving…' : 'Add to Log'}
            </motion.button>
            <button onClick={reset} className="w-full py-3 text-sm text-muted">
              Retake photo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
