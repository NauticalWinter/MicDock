import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';
import { AppSettings } from './types';

const STORAGE_KEY = 'prod_dashboard_settings_v2';

const DEFAULT_SETTINGS: AppSettings = {
  pcoAppId: '',
  pcoSecret: '',
  serviceTypeId: '',
  serviceTypeName: '',
  refreshInterval: 5,
  corsProxy: 'https://corsproxy.io/?',
  
  micCount: 8,
  monitorCount: 8,
  micLabels: {
    1: 'Vocal 1', 2: 'Vocal 2', 3: 'Vocal 3', 4: 'Vocal 4',
    5: 'Music Dir', 6: 'Host', 7: 'Speaker', 8: 'Wireless GT'
  },
  monitorLabels: {
    1: 'Vocal 1', 2: 'Vocal 2', 3: 'Vocal 3', 4: 'Vocal 4',
    5: 'Acoustic', 6: 'Electric', 7: 'Keys', 8: 'Bass'
  },
  
  micRange: [1, 8],
  monitorRange: [1, 8],
  cardWidth: 180,
  gridColumns: 0,
  
  deviceHostname: 'church-production-01.local',
  wifiSsid: '',
  wifiPassword: '',
  uiScale: 1.0,
  autoBoot: true,

  personOverrides: [],
  showPhotos: true,
  showRfMeters: true,
  showBattery: true,
  showTechDetails: true,
  brightness: 100
};

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setView('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {view === 'dashboard' ? (
        <Dashboard settings={settings} onOpenSettings={() => setView('settings')} />
      ) : (
        <SettingsView settings={settings} onBack={() => setView('dashboard')} onSave={handleSaveSettings} />
      )}
    </div>
  );
};

export default App;