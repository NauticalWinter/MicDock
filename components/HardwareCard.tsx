import React from 'react';
import { Assignment, HardwareType, AppSettings } from '../types';
import { Battery, ShieldCheck, UserMinus } from 'lucide-react';

interface Props {
  assignment: Assignment;
  settings: AppSettings;
}

const HardwareCard: React.FC<Props> = ({ assignment, settings }) => {
  const isAssigned = !!assignment.assignedTo;
  const isPatched = !!assignment.role;
  const isMic = assignment.type === HardwareType.MIC;
  
  const techColorClass = isMic ? 'text-amber-400' : 'text-emerald-400';
  const techBgClass = isMic ? 'bg-amber-400/5' : 'bg-emerald-400/5';
  const techBorderClass = isMic ? 'border-amber-400/20' : 'border-emerald-400/20';

  // Proportional sizing based on card width
  const scale = settings.cardWidth / 180;
  const nameSize = Math.max(1.2, 2.5 * scale);

  return (
    <div 
      className={`relative flex flex-col h-full min-w-0 border-r border-white/10 transition-all duration-700 overflow-hidden ${
        !isPatched ? 'bg-[#0a0f14]' : isAssigned ? 'bg-[#020202]' : 'bg-[#0d0d0d]'
      }`} 
      style={{ 
        opacity: settings.brightness / 100,
        width: `${settings.cardWidth}px`
      }}
    >
      {/* Slot Identification */}
      <div className="pt-4 pb-1 text-center border-b border-white/5 bg-black/60 relative z-20">
        <span className="font-black tracking-tighter text-white italic opacity-90" style={{ fontSize: `${20 * scale}px` }}>
          {assignment.slot.toString().padStart(2, '0')}
        </span>
        <div className="text-[7px] font-black uppercase tracking-widest text-white/20 mt-0.5">
          {isMic ? 'QLXD4' : 'P3T'}
        </div>
      </div>

      {/* Identity Core */}
      <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {isAssigned ? (
          <>
            {settings.showPhotos && assignment.photoUrl && (
              <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
                <img 
                  src={assignment.photoUrl} 
                  alt={assignment.assignedTo}
                  className="w-full h-full object-cover opacity-70 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
              </div>
            )}
            
            <div className={`relative z-10 text-center px-4 ${settings.showPhotos ? 'mt-12' : ''}`}>
              <h2 
                className="font-black tracking-tighter uppercase italic leading-[0.85] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]"
                style={{ fontSize: `${nameSize}rem` }}
              >
                {assignment.assignedTo}
              </h2>
              <div className={`mt-2 text-[9px] font-black uppercase tracking-[0.2em] py-1 px-2 rounded border truncate max-w-full ${techBorderClass} ${techBgClass} ${techColorClass}`}>
                {assignment.role}
              </div>
            </div>
          </>
        ) : isPatched ? (
          <div className="text-center px-4 animate-pulse">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Patched For</div>
            <div className={`font-black uppercase italic tracking-tighter truncate ${techColorClass}`} style={{ fontSize: `${1.25 * scale}rem` }}>
               {assignment.role}
            </div>
          </div>
        ) : (
          <div className="text-center opacity-20 group scale-75">
             <div className="w-10 h-10 border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:rotate-45 transition-transform duration-700">
               <ShieldCheck size={20} className="text-white" />
             </div>
             <h2 className="text-sm font-black tracking-widest uppercase italic text-white/80">Spare</h2>
          </div>
        )}
      </div>

      {/* Hardware Telemetry Tray */}
      <div className={`p-3 ${isPatched ? 'bg-black/90' : 'bg-black/40'} border-t border-white/10 backdrop-blur-xl relative z-20`}>
        <div className="flex flex-col gap-2">
          {settings.showRfMeters && (
            <div className="flex gap-0.5 items-end h-4">
              {[1,2,3,4,5,6].map((bar) => (
                <div 
                  key={bar}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    isAssigned 
                      ? (bar > 4 ? 'bg-red-500 h-[100%]' : bar > 2 ? 'bg-yellow-500 h-[70%]' : 'bg-emerald-500 h-[40%]') 
                      : isPatched ? 'bg-white/10 h-[15%]' : 'bg-white/5 h-[10%]'
                  }`} 
                />
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
             <span className={`text-[10px] font-bold font-mono tracking-tighter ${isPatched ? techColorClass : 'text-white/10'}`}>
               {assignment.frequency}
             </span>
             {settings.showBattery && (
               <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold font-mono ${isAssigned ? techColorClass : 'text-white/10'}`}>
                    {isAssigned ? assignment.battery : 0}%
                  </span>
                  <Battery size={10} className={isAssigned ? techColorClass : 'text-white/10'} />
               </div>
             )}
          </div>
        </div>
      </div>
      
      {isPatched && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${isMic ? 'bg-red-600' : 'bg-blue-600'} ${isAssigned ? 'opacity-100 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]' : 'opacity-30'}`} />
      )}
    </div>
  );
};

export default HardwareCard;