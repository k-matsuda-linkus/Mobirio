interface RichTooltipProps {
  text: string;
  children: React.ReactNode;
}

export function RichTooltip({ text, children }: RichTooltipProps) {
  return (
    <span className="relative group">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-[6px] opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-gray-800 text-white text-xs px-[10px] py-[6px] max-w-[240px] whitespace-normal text-left leading-relaxed">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800" />
      </span>
    </span>
  );
}
