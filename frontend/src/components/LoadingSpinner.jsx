export default function LoadingSpinner({ label = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`animate-spin rounded-full border-emerald-400 border-t-transparent ${sizeClasses[size]}`}
        role="status"
        aria-label={label}
      />
      {label ? (
        <p className="text-sm text-slate-400">{label}</p>
      ) : null}
    </div>
  )
}
