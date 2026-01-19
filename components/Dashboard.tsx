import React, { useState, useEffect } from 'react';
import { ServicePlan, Assignment, AppSettings } from '../types';
import { fetchPCOPlan, generateAssignments } from '../services/pcoService';
import HardwareCard from './HardwareCard';
import { Calendar, RefreshCw, Settings, Mic, Radio, Unplug, CheckCircle2, Monitor, Wifi, Cpu, Globe } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
  settings: AppSettings;
}

const Dashboard: React.FC<Props> = ({ onOpenSettings, settings }) => {
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [assignments, setAssignments] = useState<{ mics: Assignment[], monitors: Assignment[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isSetupRequired = !settings.pcoAppId || !settings.pcoSecret;

  const refreshData = async (manual = false) => {
    if (manual) setRefreshing(true);
    if (isSetupRequired) return;
    
    setError(null);
    try {
      const p = await fetchPCOPlan(settings);
      setPlan(p);
      setAssignments(generateAssignments(p, settings));
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError("PCO Offline");
      setAssignments(generateAssignments(null, settings));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isSetupRequired) {
      refreshData();
      const interval = setInterval(() => refreshData(false), settings.refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setAssignments(generateAssignments(null, settings));
    }
  }, [settings.serviceTypeId, settings.refreshInterval, settings.pcoAppId, settings.micCount, settings.monitorCount, settings.micRange, settings.monitorRange]);

  // Handle Provisioning Mode (First Boot)
  if (isSetupRequired) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-white font-inter">
        <div className="absolute top-10 left-10 flex items-center gap-4 opacity-30">
          <div className="shure-bg px-4 py-1 text-xs font-black tracking-tighter italic">SHURE</div>
          <div className="text-[10px] font-black uppercase tracking-[0.4em]">Hardware Provisioning</div>
        </div>

        <div className="max-w-2xl w-full p-12 bg-white/5 rounded-[40px] border border-white/10 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wifi size={40} className="text-red-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Configuration Required</h1>
          <p className="text-white/40 text-sm leading-relaxed uppercase tracking-widest font-bold">
            This device is in Setup Mode. Connect your computer to the following Wi-Fi network to configure PCO credentials:
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black p-6 rounded-3xl border border-white/5">
              <div className="text-[10px] font-black text-white/20 uppercase mb-2">SSID</div>
              <div className="text-xl font-mono text-emerald-500 font-bold">PROD-SYS-{settings.deviceHostname.split('.')[0]}</div>
            </div>
            <div className="bg-black p-6 rounded-3xl border border-white/5">
              <div className="text-[10px] font-black text-white/20 uppercase mb-2">WEB ADDRESS</div>
              <div className="text-xl font-mono text-emerald-500 font-bold">http://192.168.4.1</div>
            </div>
          </div>

          <div className="pt-8">
            <button onClick={onOpenSettings} className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white/90 transition-all flex items-center gap-3 mx-auto">
              <Settings size={20} />
              Manual Configuration
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 text-[9px] font-black uppercase tracking-[0.5em] text-white/10">
          Raspberry Pi Node: {settings.deviceHostname}
        </div>
      </div>
    );
  }

  if (!assignments) return null;

  const filteredMics = assignments.mics.filter(m => m.slot >= settings.micRange[0] && m.slot <= settings.micRange[1]);
  const filteredMonitors = assignments.monitors.filter(m => m.slot >= settings.monitorRange[0] && m.slot <= settings.monitorRange[1]);

  const gridStyle = settings.gridColumns > 0 
    ? { gridTemplateColumns: `repeat(${settings.gridColumns}, min-content)` } 
    : { display: 'flex', flexWrap: 'nowrap' } as any;

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden font-inter select-none" style={{ transform: `scale(${settings.uiScale})`, transformOrigin: 'top left', width: `${100 / settings.uiScale}%`, height: `${100 / settings.uiScale}%` }}>
      <header className="px-8 py-3 flex justify-between items-center bg-[#0a0a0a] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="shure-bg px-3 py-0.5 text-[10px] font-black tracking-tighter text-white italic">SHURE</div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-[0.2em] uppercase italic text-white/95 leading-none">Production Control</h1>
            <div className="flex items-center gap-4 mt-1.5 text-[9px] font-bold text-white/40 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Calendar size={10} className="text-red-600" /> 
                {plan?.date || 'Syncing...'}
              </span>
              <span className="h-2 w-[1px] bg-white/20" />
              <span className="text-emerald-500 flex items-center gap-1">
                <Wifi size={10} />
                {settings.wifiSsid || 'Eth Link'}
              </span>
              <span className="h-2 w-[1px] bg-white/20" />
              <span className="flex items-center gap-1.5 text-white/20">
                <Cpu size={10} /> 42°C
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Device: {settings.deviceHostname}</div>
            <div className="text-xs font-black text-white uppercase italic truncate max-w-[200px]">
              {plan ? plan.title : 'Standby'}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => refreshData(true)} disabled={refreshing} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5">
              <RefreshCw size={16} className={`text-white/40 ${refreshing ? 'animate-spin text-red-600' : ''}`} />
            </button>
            <button onClick={onOpenSettings} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5">
              <Settings size={16} className="text-white/40" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {filteredMics.length > 0 && (
          <div className="flex-1 flex border-b border-white/10 overflow-hidden">
            <div className="w-12 flex flex-col items-center justify-center bg-black/80 border-r border-red-500/20">
              <Mic size={18} className="text-red-500 mb-2" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.5em] text-red-500/60 italic">Wireless</span>
            </div>
            <div className="flex-1 overflow-x-auto custom-scrollbar bg-[#050505]">
              <div className="grid h-full" style={gridStyle}>
                {filteredMics.map((m) => (
                  <HardwareCard key={`mic-${m.slot}`} assignment={m} settings={settings} />
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredMonitors.length > 0 && (
          <div className="flex-1 flex overflow-hidden">
             <div className="w-12 flex flex-col items-center justify-center bg-black/80 border-r border-blue-500/20">
              <Radio size={18} className="text-blue-500 mb-2" />
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.5em] text-blue-500/60 italic">IEM Packs</span>
            </div>
            <div className="flex-1 overflow-x-auto custom-scrollbar bg-[#050505]">
              <div className="grid h-full" style={gridStyle}>
                {filteredMonitors.map((m) => (
                  <HardwareCard key={`mon-${m.slot}`} assignment={m} settings={settings} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;