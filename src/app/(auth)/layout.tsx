import Atmosphere from '@/components/Atmosphere';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12 relative overflow-hidden">
      <Atmosphere />
      <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
