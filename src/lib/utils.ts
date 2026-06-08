export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function calcPercent(eaten: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.round((eaten / goal) * 100);
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function getMacroColor(
  macro: 'calories' | 'protein' | 'carbs' | 'fat'
): string {
  switch (macro) {
    case 'calories':
      return 'var(--cal-color)';
    case 'protein':
      return 'var(--protein-color)';
    case 'carbs':
      return 'var(--carbs-color)';
    case 'fat':
      return 'var(--fat-color)';
  }
}

export function applyTheme(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (theme === 'light') {
    html.classList.add('light');
    html.classList.remove('dark');
  } else {
    html.classList.remove('light');
    html.classList.add('dark');
  }
  localStorage.setItem('caltrack-theme', theme);
}

export function getStoredTheme(): 'dark' | 'light' {
  if (typeof localStorage === 'undefined') return 'dark';
  return (localStorage.getItem('caltrack-theme') as 'dark' | 'light') ?? 'dark';
}
