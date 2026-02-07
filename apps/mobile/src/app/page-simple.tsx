'use client';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          <span className="text-white">Rent</span>
          <span style={{ color: '#00ff88' }}>man</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Tu plataforma de alquiler inteligente
        </p>
        <button 
          className="px-8 py-3 rounded-lg font-semibold"
          style={{ backgroundColor: '#00ff88', color: '#000' }}
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
