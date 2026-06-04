export default function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Primary Glow */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />
      
      {/* Secondary Glow */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />
      
      {/* Accent Glow */}
      <div 
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)' }}
      />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
    </div>
  );
}
