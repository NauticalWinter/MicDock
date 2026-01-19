import { HardwareType, Assignment } from './types';

export const MIC_SLOTS: Omit<Assignment, 'assignedTo' | 'role'>[] = [
  { slot: 1, type: HardwareType.MIC, label: 'Vocal 1' },
  { slot: 2, type: HardwareType.MIC, label: 'Vocal 2' },
  { slot: 3, type: HardwareType.MIC, label: 'Vocal 3' },
  { slot: 4, type: HardwareType.MIC, label: 'Vocal 4' },
  { slot: 5, type: HardwareType.MIC, label: 'Music Dir' },
  { slot: 6, type: HardwareType.MIC, label: 'Host' },
  { slot: 7, type: HardwareType.MIC, label: 'Speaker' },
  { slot: 8, type: HardwareType.MIC, label: 'Wireless GT' },
];

export const MONITOR_SLOTS: Omit<Assignment, 'assignedTo' | 'role'>[] = [
  { slot: 1, type: HardwareType.MONITOR, label: 'Vocal 1' },
  { slot: 2, type: HardwareType.MONITOR, label: 'Vocal 2' },
  { slot: 3, type: HardwareType.MONITOR, label: 'Vocal 3' },
  { slot: 4, type: HardwareType.MONITOR, label: 'Vocal 4' },
  { slot: 5, type: HardwareType.MONITOR, label: 'Acoustic' },
  { slot: 6, type: HardwareType.MONITOR, label: 'Electric' },
  { slot: 7, type: HardwareType.MONITOR, label: 'Keys' },
  { slot: 8, type: HardwareType.MONITOR, label: 'Bass' },
];