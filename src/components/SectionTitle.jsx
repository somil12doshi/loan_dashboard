export default function SectionTitle({ title, sub, accent = '#6366f1' }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1.5 h-6 rounded-full" style={{ background: accent }} />
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      {sub && (
        <p className="text-sm font-medium ml-4.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
