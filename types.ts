export enum GroupType {
  BAND = 'Band',
  VOCAL = 'Vocal',
  LEADER = 'Leader',
  PRODUCTION = 'Production'
}

export enum HardwareType {
  MIC = 'Mic',
  MONITOR = 'Monitor'
}

export interface PersonAssignment {
  personId: string;
  micSlot: number | null;
  monitorSlot: number | null;
}

export interface PCOPerson {
  id: string;
  name: string;
  groups: GroupType[];
  subRole?: string;
  photoUrl?: string;
  teamName?: string;
}

export interface Assignment {
  slot: number;
  type: HardwareType;
  label: string;
  assignedTo?: string;
  role?: string;
  photoUrl?: string;
  frequency?: string;
  gain?: string;
  battery?: number;
}

export interface ServicePlan {
  id: string;
  date: string;
  series: string;
  title: string;
  people: PCOPerson[];
  notes: string[];
}

export interface PCOServiceType {
  id: string;
  name: string;
}

export interface AppSettings {
  pcoAppId: string;
  pcoSecret: string;
  serviceTypeId: string;
  serviceTypeName: string;
  refreshInterval: number;
  corsProxy: string;
  
  // Scalability Settings
  micCount: number;
  monitorCount: number;
  micLabels: Record<number, string>;
  monitorLabels: Record<number, string>;
  
  // Layout & Multi-screen
  micRange: [number, number];
  monitorRange: [number, number];
  cardWidth: number;
  gridColumns: number;
  
  // Raspberry Pi System Settings
  deviceHostname: string;
  wifiSsid: string;
  wifiPassword?: string;
  uiScale: number; // 0.5 to 2.0
  autoBoot: boolean;

  personOverrides: PersonAssignment[];
  showPhotos: boolean;
  showRfMeters: boolean;
  showBattery: boolean;
  showTechDetails: boolean;
  brightness: number;
}