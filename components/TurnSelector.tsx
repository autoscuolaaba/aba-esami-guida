import React from 'react';
import { Turn } from '../types';

interface TurnSelectorProps {
  turn: Turn | null;
  onSelect: (turn: Turn) => void;
}

const TurnSelector: React.FC<TurnSelectorProps> = ({ turn, onSelect }) => {
  return (
    <div className="space-y-4">
       <h3 className="text-gray-900 font-bold flex items-center gap-2">
         <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
         Turno esame
       </h3>

       <div className="flex gap-3">
         {/* MATTINA BUTTON */}
         <button
           onClick={() => onSelect('MATTINA')}
           className={`
             group relative flex-1 h-12 rounded-2xl overflow-hidden transition-all duration-500 shadow-lg
             ${turn === 'MATTINA'
               ? 'ring-2 ring-amber-400 ring-offset-2 scale-[1.03] shadow-amber-200/50'
               : 'opacity-85 hover:opacity-100 hover:scale-[1.02] hover:shadow-xl'
             }
           `}
         >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 animate-gradient-x"></div>

            {/* Animated Sun Rays */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12">
                {/* Sun rays rotating */}
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 w-1 h-6 bg-gradient-to-t from-yellow-200/80 to-transparent origin-bottom -translate-x-1/2"
                      style={{ transform: `translateX(-50%) rotate(${i * 45}deg)` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Clouds */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -bottom-2 left-[20%] w-8 h-4 bg-white/40 rounded-full blur-[1px] animate-float-slow"></div>
              <div className="absolute -bottom-1 left-[45%] w-10 h-5 bg-white/30 rounded-full blur-[1px] animate-float-medium"></div>
              <div className="absolute -bottom-3 left-[70%] w-12 h-6 bg-white/35 rounded-full blur-[1px] animate-float-fast"></div>
            </div>

            {/* Shimmer Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            </div>

            {/* Content Container */}
            <div className="relative h-full flex items-center justify-between px-4">
                {/* Sun Icon */}
                <div className="w-8 h-8 rounded-full bg-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.8)] flex items-center justify-center border-2 border-yellow-200/50 animate-pulse-glow">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-400"></div>
                </div>

                {/* Text Label */}
                <span className="flex-1 text-right pr-2 text-white font-bold text-sm tracking-wider drop-shadow-md uppercase">
                    Mattina
                </span>
            </div>

            {/* Selection Indicator */}
            {turn === 'MATTINA' && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
              </div>
            )}
         </button>

         {/* POMERIGGIO BUTTON */}
         <button
           onClick={() => onSelect('POMERIGGIO')}
           className={`
             group relative flex-1 h-12 rounded-2xl overflow-hidden transition-all duration-500 shadow-lg
             ${turn === 'POMERIGGIO'
               ? 'ring-2 ring-indigo-400 ring-offset-2 scale-[1.03] shadow-indigo-200/50'
               : 'opacity-85 hover:opacity-100 hover:scale-[1.02] hover:shadow-xl'
             }
           `}
         >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 animate-gradient-x-reverse"></div>

            {/* Twinkling Stars */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-2 left-[15%] w-1 h-1 bg-white rounded-full animate-twinkle-1"></div>
              <div className="absolute top-4 left-[30%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-2"></div>
              <div className="absolute top-1 left-[50%] w-1 h-1 bg-white rounded-full animate-twinkle-3"></div>
              <div className="absolute top-3 left-[65%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-1"></div>
              <div className="absolute bottom-2 left-[25%] w-0.5 h-0.5 bg-white rounded-full animate-twinkle-2"></div>
              <div className="absolute bottom-3 left-[40%] w-1 h-1 bg-white rounded-full animate-twinkle-3"></div>

              {/* Shooting Star */}
              <div className="absolute top-2 left-0 w-8 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-[200px] transition-all duration-700 ease-out rotate-[20deg]"></div>
            </div>

            {/* Moon Glow */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="absolute inset-0 w-10 h-10 bg-blue-300/20 rounded-full blur-xl animate-pulse-slow"></div>
            </div>

            {/* Content Container */}
            <div className="relative h-full flex items-center justify-between px-4">
                {/* Text Label */}
                <span className="flex-1 text-left pl-2 text-white font-bold text-sm tracking-wider drop-shadow-md uppercase">
                    Pomeriggio
                </span>

                {/* Moon Icon */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-[0_0_15px_rgba(203,213,225,0.6)] border-2 border-slate-300/30 relative overflow-hidden group-hover:rotate-12 transition-transform duration-700">
                    {/* Craters */}
                    <div className="absolute top-1 left-1 w-2 h-2 bg-slate-400/50 rounded-full"></div>
                    <div className="absolute bottom-1.5 left-2.5 w-2.5 h-2.5 bg-slate-400/40 rounded-full"></div>
                    <div className="absolute top-3 right-1.5 w-1.5 h-1.5 bg-slate-400/50 rounded-full"></div>
                    {/* Shadow for 3D effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-slate-500/30 rounded-full"></div>
                </div>
            </div>

            {/* Selection Indicator */}
            {turn === 'POMERIGGIO' && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              </div>
            )}
         </button>
       </div>

       {/* Custom Animations */}
       <style>{`
         @keyframes gradient-x {
           0%, 100% { background-position: 0% 50%; }
           50% { background-position: 100% 50%; }
         }
         @keyframes gradient-x-reverse {
           0%, 100% { background-position: 100% 50%; }
           50% { background-position: 0% 50%; }
         }
         @keyframes spin-slow {
           from { transform: rotate(0deg); }
           to { transform: rotate(360deg); }
         }
         @keyframes float-slow {
           0%, 100% { transform: translateX(0) translateY(0); }
           50% { transform: translateX(5px) translateY(-3px); }
         }
         @keyframes float-medium {
           0%, 100% { transform: translateX(0) translateY(0); }
           50% { transform: translateX(-8px) translateY(-2px); }
         }
         @keyframes float-fast {
           0%, 100% { transform: translateX(0) translateY(0); }
           50% { transform: translateX(6px) translateY(-4px); }
         }
         @keyframes pulse-glow {
           0%, 100% { box-shadow: 0 0 20px rgba(250,204,21,0.8); }
           50% { box-shadow: 0 0 30px rgba(250,204,21,1); }
         }
         @keyframes pulse-slow {
           0%, 100% { opacity: 0.3; transform: scale(1); }
           50% { opacity: 0.6; transform: scale(1.1); }
         }
         @keyframes twinkle-1 {
           0%, 100% { opacity: 0.3; transform: scale(1); }
           50% { opacity: 1; transform: scale(1.5); }
         }
         @keyframes twinkle-2 {
           0%, 100% { opacity: 0.5; transform: scale(1.2); }
           50% { opacity: 0.2; transform: scale(0.8); }
         }
         @keyframes twinkle-3 {
           0%, 100% { opacity: 0.8; transform: scale(1); }
           25% { opacity: 0.3; transform: scale(0.7); }
           75% { opacity: 1; transform: scale(1.3); }
         }
         .animate-gradient-x {
           background-size: 200% 200%;
           animation: gradient-x 4s ease infinite;
         }
         .animate-gradient-x-reverse {
           background-size: 200% 200%;
           animation: gradient-x-reverse 5s ease infinite;
         }
         .animate-spin-slow {
           animation: spin-slow 20s linear infinite;
         }
         .animate-float-slow {
           animation: float-slow 4s ease-in-out infinite;
         }
         .animate-float-medium {
           animation: float-medium 3s ease-in-out infinite;
         }
         .animate-float-fast {
           animation: float-fast 2.5s ease-in-out infinite;
         }
         .animate-pulse-glow {
           animation: pulse-glow 2s ease-in-out infinite;
         }
         .animate-pulse-slow {
           animation: pulse-slow 3s ease-in-out infinite;
         }
         .animate-twinkle-1 {
           animation: twinkle-1 2s ease-in-out infinite;
         }
         .animate-twinkle-2 {
           animation: twinkle-2 1.5s ease-in-out infinite 0.3s;
         }
         .animate-twinkle-3 {
           animation: twinkle-3 2.5s ease-in-out infinite 0.7s;
         }
       `}</style>
    </div>
  );
};

export default TurnSelector;
