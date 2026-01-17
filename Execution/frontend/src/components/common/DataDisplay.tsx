interface DataDisplayProps {
  label: string;
  value: string | number | boolean | null | undefined;
  mono?: boolean;
}

export default function DataDisplay({ label, value, mono = false }: DataDisplayProps) {
  const displayValue = value !== null && value !== undefined ? String(value) : '—';

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs sm:text-sm uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className={`text-xs sm:text-sm font-semibold ${mono ? 'font-mono' : ''}`}>
        {displayValue}
      </span>
    </div>
  );
}
