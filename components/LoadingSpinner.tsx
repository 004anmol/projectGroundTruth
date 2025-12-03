type LoadingSpinnerProps = {
  label?: string;
};

export function LoadingSpinner({ label }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-black/60 px-4 py-2 text-white shadow-lg">
      <span className="flex h-4 w-4">
        <span className="h-4 w-4 animate-ping rounded-full bg-white/80 opacity-75" />
        <span className="absolute h-4 w-4 rounded-full bg-white opacity-80" />
      </span>
      <span className="text-sm font-medium">{label ?? 'Working...'}</span>
    </div>
  );
}

