'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sheet from '@/components/ui/Sheet';
import Viewfinder from '@/components/log/Viewfinder';
import ConfirmCard from '@/components/log/ConfirmCard';
import MealChips from '@/components/log/MealChips';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

interface LabelSheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

interface LabelResult {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calculation_note?: string;
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

export default function LabelSheet({
  open,
  onClose,
  onLogged,
}: LabelSheetProps) {
  const toastCtx = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<
    'capture' | 'serving' | 'loading' | 'confirm'
  >('capture');
  const [fileData, setFileData] = useState<string | null>(null);
  const [servingDescription, setServingDescription] = useState('');
  const [meal, setMeal] = useState('Breakfast');
  const [result, setResult] = useState<LabelResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const sheetTitle =
    step === 'capture'
      ? 'Scan Nutrition Label'
      : step === 'serving'
        ? 'How much did you have?'
        : step === 'loading'
          ? 'Reading label…'
          : 'Confirm & Log';

  function reset() {
    setStep('capture');
    setFileData(null);
    setServingDescription('');
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
      setStep('serving');
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyse() {
    if (!fileData) return;
    setStep('loading');
    try {
      const res = await fetch('/api/ai/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: fileData,
          serving_description: servingDescription,
        }),
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
        toastCtx?.toast('Could not read label', 'error');
        setStep('capture');
      }
    } catch {
      toastCtx?.toast('Could not read label', 'error');
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
          source: 'label',
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
            <Viewfinder
              emoji="🏷️"
              hint="Point at the nutrition facts panel"
              tall
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white font-display active:scale-[0.96] transition-transform"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              Scan Label
            </button>
          </motion.div>
        )}

        {step === 'serving' && (
          <motion.div
            key="serving"
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
                  Label captured
                </p>
                <p className="text-xs text-muted mt-0.5">Ready to analyse</p>
              </div>
            </div>

            <div>
              <label className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted block mb-2">
                How much did you have?
              </label>
              <input
                value={servingDescription}
                onChange={(e) => setServingDescription(e.target.value)}
                className="w-full h-12 rounded-[13px] px-4 text-sm text-primary outline-none"
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
                placeholder="e.g. 2 tablespoons, 1 cup, 150g, half a bag"
                autoFocus
              />
              <p className="text-[10px] text-muted mt-1.5">
                AI will calculate nutrition for that exact amount
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyse}
              disabled={!servingDescription.trim()}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white disabled:opacity-40"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              Calculate nutrition →
            </motion.button>
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
            <p className="text-sm text-secondary">
              Reading your nutrition label…
            </p>
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
              confidence="high"
              onFoodNameChange={setFoodName}
              onCaloriesChange={setCalories}
              onProteinChange={setProtein}
              onCarbsChange={setCarbs}
              onFatChange={setFat}
            />
            {result?.calculation_note && (
              <div
                className="rounded-[13px] border px-4 py-3"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <p className="text-[11px] text-secondary italic leading-relaxed">
                  💡 {result.calculation_note}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-[15px] py-4 font-bold text-sm text-white font-display active:scale-[0.96] disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 28px var(--accent-glow)',
              }}
            >
              {saving ? 'Saving…' : 'Add to Log'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-[15px] py-3.5 text-sm font-semibold text-secondary active:scale-[0.96]"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              Rescan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
