interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="border-b border-apex-border pb-4 mb-6">
      <h1 className="header-uppercase text-2xl sm:text-3xl text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-400 mt-2 tracking-wide">
          {subtitle}
        </p>
      )}
    </div>
  );
}
