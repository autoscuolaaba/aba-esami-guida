import React from 'react';
import { Car, Calendar, Hash, Sun, Moon, User, ClipboardList, Users, Zap, BarChart3, Bell, PartyPopper } from 'lucide-react';

interface IllustrationProps {
  className?: string;
}

export const WelcomeIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center animate-pulse">
        <Car size={48} className="text-white" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
        <span className="text-white text-lg">!</span>
      </div>
    </div>
  </div>
);

export const CalendarIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg">
        <Calendar size={40} className="text-white" />
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white"></div>
    </div>
  </div>
);

export const LimitIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    {[2, 3, 4].map((num) => (
      <div
        key={num}
        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
          num === 3 ? 'bg-blue-500 text-white scale-110' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {num}
      </div>
    ))}
  </div>
);

export const TurnIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center gap-4 ${className}`}>
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
        <Sun size={28} className="text-white" />
      </div>
      <span className="text-xs font-medium text-gray-600">Mattina</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Moon size={28} className="text-white" />
      </div>
      <span className="text-xs font-medium text-gray-600">Pomeriggio</span>
    </div>
  </div>
);

export const ExaminerIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="flex -space-x-3">
      {['bg-blue-500', 'bg-green-500', 'bg-purple-500'].map((bg, i) => (
        <div
          key={i}
          className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center border-2 border-white shadow-md`}
        >
          <User size={20} className="text-white" />
        </div>
      ))}
    </div>
  </div>
);

export const StudentsIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
        <ClipboardList size={36} className="text-white" />
      </div>
      <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-white text-blue-600 text-xs font-bold shadow-md">
        +5
      </div>
    </div>
  </div>
);

export const BookingIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="flex items-center gap-2">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
        <User size={20} className="text-white" />
      </div>
      <div className="text-2xl">→</div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
        <Calendar size={20} className="text-white" />
      </div>
    </div>
  </div>
);

export const ExamDayIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
        <Zap size={40} className="text-white" />
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        <span className="text-lg">✓</span>
        <span className="text-lg">✗</span>
        <span className="text-lg">⊘</span>
      </div>
    </div>
  </div>
);

export const StatsIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center gap-3 ${className}`}>
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
      <BarChart3 size={28} className="text-white" />
    </div>
    <div className="flex flex-col gap-1">
      <div className="h-2 w-16 bg-green-400 rounded-full"></div>
      <div className="h-2 w-12 bg-green-300 rounded-full"></div>
      <div className="h-2 w-8 bg-green-200 rounded-full"></div>
    </div>
  </div>
);

export const NotificationsIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center gap-4 ${className}`}>
    <div className="relative">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
        <Bell size={24} className="text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
    </div>
    <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center shadow-lg">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </div>
  </div>
);

export const CompleteIllustration: React.FC<IllustrationProps> = ({ className }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="relative">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
        <PartyPopper size={48} className="text-white" />
      </div>
      <div className="absolute -top-4 -left-4 text-2xl animate-bounce">🎊</div>
      <div className="absolute -top-2 -right-4 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
      <div className="absolute -bottom-2 -right-2 text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎉</div>
    </div>
  </div>
);

export const getIllustration = (type: string): React.ReactNode => {
  switch (type) {
    case 'welcome': return <WelcomeIllustration className="py-4" />;
    case 'calendar': return <CalendarIllustration className="py-4" />;
    case 'limit': return <LimitIllustration className="py-4" />;
    case 'turn': return <TurnIllustration className="py-4" />;
    case 'examiner': return <ExaminerIllustration className="py-4" />;
    case 'students': return <StudentsIllustration className="py-4" />;
    case 'booking': return <BookingIllustration className="py-4" />;
    case 'exam-day': return <ExamDayIllustration className="py-4" />;
    case 'stats': return <StatsIllustration className="py-4" />;
    case 'notifications': return <NotificationsIllustration className="py-4" />;
    case 'complete': return <CompleteIllustration className="py-4" />;
    default: return null;
  }
};
