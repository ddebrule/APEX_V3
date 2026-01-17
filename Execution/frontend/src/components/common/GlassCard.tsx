interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`glass rounded-lg p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}
