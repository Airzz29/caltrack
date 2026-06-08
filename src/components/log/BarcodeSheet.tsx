'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sheet from '@/components/ui/Sheet';
import ConfirmCard from '@/components/log/ConfirmCard';
import MealChips from '@/components/log/MealChips';
import { useToast } from '@/components/ui/Toast';
import { Camera, RefreshCw } from 'lucide-react';

interface BarcodeSheetProps {
  open: boolean;
  onClose: () => void;
  onLogged: () => void;
}

export default function BarcodeSheet({
  open,
  onClose,
  onLogged,
}: BarcodeSheetProps) {
  const toastCtx = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<
    'scan' | 'scanning' | 'looking-up' | 'serving' | 'confirm' | 'notfound'
  >('scan');
  const [servingNote, setServingNote] = useState('');
  const [meal, setMeal] = useState('Breakfast');
  const [barcode, setBarcode] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  function reset() {
    setStage('scan');
    setBarcode('');
    setManualInput('');
    setServingNote('');
  }

  async function lookupBarcode(code: string) {
    setStage('looking-up');
    const res = await fetch(`/api/barcode?code=${code}`);
    const data = await res.json();
    if (res.ok && data.found) {
      setFoodName(data.product.food_name);
      setCalories(data.product.calories);
      setProtein(data.product.protein_g);
      setCarbs(data.product.carbs_g);
      setFat(data.product.fat_g);
      setStage('serving');
    } else {
      setStage('notfound');
    }
  }

  function handleCameraCapture(file: File) {
    if (file.size > 4_000_000) {
      toastCtx?.toast('Image too large', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target!.result as string).split(',')[1];
      setStage('scanning');
      setBarcode('');
      const res = await fetch('/api/ai/barcode-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (res.ok && data.found) {
        setBarcode(data.barcode);
        await lookupBarcode(data.barcode);
      } else {
        toastCtx?.toast('No barcode detected — try again', 'error');
        setStage('scan');
      }
    };
    reader.readAsDataURL(file);
  }

  function handleManualSearch() {
    if (manualInput.trim().length < 6) return;
    setBarcode(manualInput.trim());
    lookupBarcode(manualInput.trim());
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/food-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        food_name: foodName,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        source: 'barcode',
        meal_type: meal.toLowerCase(),
        barcode,
      }),
    });
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('food-logged'));
      toastCtx?.toast('Added to log ✓', 'success');
      onLogged();
      onClose();
      reset();
    }
    setSaving(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Barcode Scan">
      {stage === 'scan' && (
        <div className="space-y-4">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleCameraCapture(e.target.files[0]);
            }}
          />

          <div
            className="w-full rounded-[18px] border relative overflow-hidden flex flex-col items-center justify-center gap-3"
            style={{
              aspectRatio: '16/9',
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'var(--border)',
            }}
          >
            {[
              { top: 14, left: 14, bw: '2.5px 0 0 2.5px', r: '5px 0 0 0' },
              { top: 14, right: 14, bw: '2.5px 2.5px 0 0', r: '0 5px 0 0' },
              { bottom: 14, left: 14, bw: '0 0 2.5px 2.5px', r: '0 0 0 5px' },
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

            <div
              className="absolute left-[10%] right-[10%] h-[1.5px]"
              style={{
                background:
                  'linear-gradient(90deg,transparent,var(--accent2),transparent)',
                animation: 'scan 2.2s ease-in-out infinite',
              }}
            />

            <div
              className="text-2xl z-10"
              style={{ color: 'var(--text-muted)', letterSpacing: 4 }}
            >
              ▌▌▌▌▌▌▌▌
            </div>
            <p className="text-xs text-muted z-10">
              AI reads barcode from photo
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (cameraRef.current) {
                cameraRef.current.value = '';
                cameraRef.current.click();
              }
            }}
            className="w-full rounded-[15px] py-4 font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 28px var(--accent-glow)',
            }}
          >
            <Camera className="w-4 h-4" />
            Take Photo to Scan Barcode
          </motion.button>

          <div>
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted text-center mb-2.5">
              Or enter barcode manually
            </p>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                type="number"
                placeholder="e.g. 9300650205614"
                className="flex-1 h-11 rounded-[13px] px-3.5 font-mono text-sm text-primary outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                }}
              />
              <button
                onClick={handleManualSearch}
                disabled={manualInput.length < 6}
                className="h-11 px-4 rounded-[13px] font-bold text-sm text-white disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {(stage === 'scanning' || stage === 'looking-up') && (
        <div className="flex flex-col items-center gap-5 py-14">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-7 h-7" style={{ color: 'var(--accent2)' }} />
          </motion.div>

          <div className="text-center">
            <p className="text-sm text-secondary font-medium mb-2">
              {stage === 'scanning'
                ? 'Reading barcode…'
                : 'Looking up product…'}
            </p>
            <AnimatePresence>
              {barcode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[14px] border px-6 py-3 inline-block"
                  style={{
                    background: 'var(--accent-dim)',
                    borderColor: 'var(--accent-border)',
                  }}
                >
                  <p
                    className="font-mono text-lg font-medium"
                    style={{ color: 'var(--accent2)', letterSpacing: 2 }}
                  >
                    {barcode}
                  </p>
                  <p className="text-[9px] text-muted uppercase tracking-wider mt-1">
                    Barcode detected
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {stage === 'notfound' && (
        <div className="text-center py-12 flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            🔍
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Product not found</p>
            <p className="text-xs text-muted mt-1">
              {barcode ? `Barcode: ${barcode}` : 'Try again or enter manually'}
            </p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-full text-sm font-bold"
            style={{
              background: 'var(--accent-dim)',
              color: 'var(--accent2)',
              border: '1px solid var(--accent-border)',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {stage === 'serving' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: 'var(--green-bg)',
                border: '1px solid var(--green-border)',
              }}
            >
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">
                {foodName}
              </p>
              <p className="font-mono text-xs text-muted mt-0.5">
                Barcode: {barcode}
              </p>
              <p className="text-xs text-muted mt-0.5">
                Some products may vary by region
              </p>
            </div>
          </div>

          <div>
            <label className="text-[9.5px] font-bold tracking-[0.15em] uppercase text-muted block mb-2">
              How much are you having?
            </label>
            <input
              value={servingNote}
              onChange={(e) => setServingNote(e.target.value)}
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
              placeholder="e.g. 1 serving, 2 cups, 150g"
              autoFocus
            />
            <p className="text-[10px] text-muted mt-1.5">
              Optional — helps track accurate portions
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setStage('confirm')}
            className="w-full rounded-[15px] py-4 font-bold text-sm text-white"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 28px var(--accent-glow)',
            }}
          >
            Continue →
          </motion.button>
          <button
            onClick={() => setStage('confirm')}
            className="w-full py-2 text-sm text-muted"
          >
            Skip
          </button>
        </motion.div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-3">
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[15px] py-4 font-bold text-sm text-white disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 28px var(--accent-glow)',
            }}
          >
            {saving ? 'Saving…' : 'Add to Log'}
          </button>
          <button
            onClick={reset}
            className="w-full rounded-[15px] py-3.5 text-sm font-semibold text-secondary"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            Scan again
          </button>
        </div>
      )}
    </Sheet>
  );
}
