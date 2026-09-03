export default function Header({ title, subtitle, onBack }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-6 pb-4 safe-top">
      {onBack && (
        <button
          aria-label="Go back"
          onClick={onBack}
          className="tap w-9 h-9 -ml-2 flex items-center justify-center text-gray-400 hover:text-white rounded-full"
        >
          <span className="text-xl">&#8592;</span>
        </button>
      )}
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
