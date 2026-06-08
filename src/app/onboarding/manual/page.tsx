'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function OnboardingManualPage() {
  const router = useRouter();
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');

    const caloriesNum = parseInt(calories, 10);
    if (
      !calories ||
      !Number.isInteger(caloriesNum) ||
      caloriesNum < 500 ||
      caloriesNum > 9999
    ) {
      setError('Calories must be between 500 and 9999');
      return;
    }

    const proteinNum = parseInt(protein, 10);
    if (
      !protein ||
      !Number.isInteger(proteinNum) ||
      proteinNum < 0 ||
      proteinNum > 999
    ) {
      setError('Protein must be between 0 and 999');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/onboarding/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_calories: caloriesNum,
          daily_protein_g: proteinNum,
          daily_carbs_g: carbs ? parseInt(carbs, 10) : null,
          daily_fat_g: fat ? parseInt(fat, 10) : null,
          daily_fiber_g: fiber ? parseInt(fiber, 10) : null,
          daily_sugar_g: sugar ? parseInt(sugar, 10) : null,
          daily_sodium_mg: sodium ? parseInt(sodium, 10) : null,
          use_ai_plan: false,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg bg-grid overflow-y-auto">
      <div className="max-w-[430px] mx-auto px-4 py-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="font-display text-2xl font-bold text-primary">
            Set your own targets
          </h1>
          <p className="text-sm text-secondary mt-1 mb-8">
            Calories and protein are required. Everything else is optional.
          </p>
        </motion.div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories / day"
              type="number"
              placeholder="2000"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
            <Input
              label="Protein g / day"
              type="number"
              placeholder="150"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors w-full py-2"
          >
            {showOptional
              ? '− Hide optional nutrients'
              : '+ Track more nutrients (optional)'}
          </button>

          <AnimatePresence>
            {showOptional && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden"
              >
                <Input
                  label="Carbs g / day"
                  type="number"
                  placeholder="200"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
                <Input
                  label="Fat g / day"
                  type="number"
                  placeholder="65"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
                <Input
                  label="Fiber g / day"
                  type="number"
                  placeholder="30"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                />
                <Input
                  label="Sugar g / day"
                  type="number"
                  placeholder="50"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                />
                <Input
                  label="Sodium mg / day"
                  type="number"
                  placeholder="2300"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleSubmit}
          >
            Save my targets →
          </Button>
        </div>
      </div>
    </div>
  );
}
