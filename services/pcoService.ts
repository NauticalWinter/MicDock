// Removed PCOPosition from the import as it is not defined in ../types and not used in this file.
import { ServicePlan, GroupType, PCOPerson, Assignment, HardwareType, PCOServiceType, AppSettings } from '../types';

const BASE_URL = 'https://api.planningcenteronline.com/services/v2';

const getHeaders = (settings: AppSettings) => {
  const appId = (settings.pcoAppId || '').trim();
  const secret = (settings.pcoSecret || '').trim();
  if (!appId || !secret) return {};
  const encoded = btoa(`${appId}:${secret}`);
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json'
  };
};

const proxyUrl = (url: string, settings: AppSettings) => {
  if (!settings.corsProxy) return url;
  const proxy = settings.corsProxy.trim();
  const cleanUrl = url.trim();
  if (proxy.endsWith('?') || proxy.endsWith('=')) {
    return `${proxy}${encodeURIComponent(cleanUrl)}`;
  }
  return `${proxy}/${cleanUrl}`;
};

export const fetchPCOServiceTypes = async (settings: AppSettings): Promise<PCOServiceType[]> => {
  if (!settings.pcoAppId.trim() || !settings.pcoSecret.trim()) return [];
  try {
    const url = proxyUrl(`${BASE_URL}/service_types?per_page=100`, settings);
    const response = await fetch(url, { headers: getHeaders(settings) });
    if (!response.ok) throw new Error(`PCO Auth Error: ${response.status}`);
    const json = await response.json();
    return (json.data || []).map((item: any) => ({ id: item.id, name: item.attributes.name }));
  } catch (error: any) {
    console.error("Error fetching PCO Service Types:", error);
    throw error;
  }
};

export const fetchPCOPlan = async (settings: AppSettings): Promise<ServicePlan | null> => {
  if (!settings.pcoAppId.trim() || !settings.pcoSecret.trim() || !settings.serviceTypeId) return null;
  const headers = getHeaders(settings);
  try {
    const plansUrl = proxyUrl(`${BASE_URL}/service_types/${settings.serviceTypeId}/plans?filter=future&order=sort_date&per_page=1`, settings);
    const plansRes = await fetch(plansUrl, { headers });
    if (!plansRes.ok) throw new Error(`Plan Index Error: ${plansRes.status}`);
    const plansJson = await plansRes.json();
    if (!plansJson.data || plansJson.data.length === 0) {
      const fallbackUrl = proxyUrl(`${BASE_URL}/service_types/${settings.serviceTypeId}/plans?order=-sort_date&per_page=1`, settings);
      const fallbackRes = await fetch(fallbackUrl, { headers });
      const fallbackJson = await fallbackRes.json();
      if (!fallbackJson.data || fallbackJson.data.length === 0) return null;
      return fetchPlanDetails(fallbackJson.data[0], settings, headers);
    }
    return fetchPlanDetails(plansJson.data[0], settings, headers);
  } catch (error: any) {
    console.error("fetchPCOPlan Error:", error);
    throw error;
  }
};

async function fetchPlanDetails(planData: any, settings: AppSettings, headers: any): Promise<ServicePlan | null> {
  const planId = planData.id;
  const planAttributes = planData.attributes;
  const [peopleRes, notesRes] = await Promise.all([
    fetch(proxyUrl(`${BASE_URL}/plans/${planId}/team_members?include=person,team&per_page=100`, settings), { headers }),
    fetch(proxyUrl(`${BASE_URL}/plans/${planId}/notes?per_page=50`, settings), { headers })
  ]);
  if (!peopleRes.ok) throw new Error(`Could not reach PCO Plan People.`);
  const peopleJson = await peopleRes.json();
  const notesJson = await (notesRes.ok ? notesRes.json() : { data: [] });
  const notes: string[] = (notesJson.data || []).map((n: any) => n.attributes.content || "");
  const people: PCOPerson[] = (peopleJson.data || [])
    .map((item: any) => {
      const attr = item.attributes;
      const personId = item.relationships?.person?.data?.id;
      const teamId = item.relationships?.team?.data?.id;
      const personData = peopleJson.included?.find((p: any) => p.type === 'Person' && p.id === personId);
      const teamData = peopleJson.included?.find((t: any) => t.type === 'Team' && t.id === teamId);
      const teamName = teamData?.attributes?.name || attr.team_name || 'Scheduled';
      const role = attr.team_position_name || attr.position_name || teamName || '';
      return {
        id: personId || item.id,
        name: personData?.attributes?.name || attr.name || attr.first_name || 'Unknown',
        groups: [], 
        subRole: role,
        teamName: teamName,
        photoUrl: personData?.attributes?.photo_url || ''
      };
    });
  return { id: planId, date: planAttributes.dates, series: planAttributes.series_title || 'No Series', title: planAttributes.plan_title || 'Service', people, notes };
}

export const generateAssignments = (plan: ServicePlan | null, settings: AppSettings): { mics: Assignment[], monitors: Assignment[] } => {
  const getFreq = (slot: number, type: HardwareType) => {
    const base = type === HardwareType.MIC ? 591 : 471;
    return `${(base + (slot * 0.425)).toFixed(3)} MHz`;
  };

  const mics: Assignment[] = Array.from({ length: settings.micCount }, (_, i) => ({
    slot: i + 1,
    type: HardwareType.MIC,
    label: settings.micLabels[i + 1] || `Mic ${i + 1}`,
    frequency: getFreq(i + 1, HardwareType.MIC),
    gain: '-12 dB',
    battery: 85 + Math.floor(Math.random() * 15)
  }));

  const monitors: Assignment[] = Array.from({ length: settings.monitorCount }, (_, i) => ({
    slot: i + 1,
    type: HardwareType.MONITOR,
    label: settings.monitorLabels[i + 1] || `Pack ${i + 1}`,
    frequency: getFreq(i + 1, HardwareType.MONITOR),
    gain: '0 dB',
    battery: 80 + Math.floor(Math.random() * 20)
  }));

  if (!plan) return { mics, monitors };

  const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const personMap = new Map<string, PCOPerson & { allRoles: string[] }>();
  plan.people.forEach(p => {
    const key = p.id;
    const existing = personMap.get(key) || { ...p, allRoles: [] };
    if (p.subRole && !existing.allRoles.includes(p.subRole)) existing.allRoles.push(p.subRole);
    if (p.teamName && !existing.allRoles.includes(p.teamName)) existing.allRoles.push(p.teamName);
    personMap.set(key, existing);
  });
  const consolidatedPeople = Array.from(personMap.values());

  const usedMicIds = new Set<string>();
  const usedMonIds = new Set<string>();

  // PRIORITY 1: Manual Overrides
  settings.personOverrides.forEach(ov => {
    const p = consolidatedPeople.find(person => person.id === ov.personId);
    if (p) {
      if (ov.micSlot && ov.micSlot <= settings.micCount) {
        mics[ov.micSlot - 1].assignedTo = p.name;
        mics[ov.micSlot - 1].role = p.subRole || 'Override';
        mics[ov.micSlot - 1].photoUrl = p.photoUrl;
        usedMicIds.add(p.id);
      }
      if (ov.monitorSlot && ov.monitorSlot <= settings.monitorCount) {
        monitors[ov.monitorSlot - 1].assignedTo = p.name;
        monitors[ov.monitorSlot - 1].role = p.subRole || 'Override';
        monitors[ov.monitorSlot - 1].photoUrl = p.photoUrl;
        usedMonIds.add(p.id);
      }
    }
  });

  // PRIORITY 2: PCO Plan Notes
  plan.notes.forEach(noteContent => {
    const micRegex = /\[MIC\s*(\d+)\]\s*([^(\n\r]+)/gi;
    const monRegex = /\[(?:MON|IEM)\s*(\d+)\]\s*([^(\n\r]+)/gi;
    let match;
    while ((match = micRegex.exec(noteContent)) !== null) {
      const slotNum = parseInt(match[1]);
      const personName = match[2].trim();
      if (slotNum >= 1 && slotNum <= settings.micCount) {
        const person = consolidatedPeople.find(p => normalize(p.name).includes(normalize(personName)));
        if (person && !usedMicIds.has(person.id)) {
          mics[slotNum - 1].assignedTo = person.name;
          mics[slotNum - 1].photoUrl = person.photoUrl;
          if (person.subRole) mics[slotNum - 1].role = person.subRole;
          usedMicIds.add(person.id);
        }
      }
    }
    while ((match = monRegex.exec(noteContent)) !== null) {
      const slotNum = parseInt(match[1]);
      const personName = match[2].trim();
      if (slotNum >= 1 && slotNum <= settings.monitorCount) {
        const person = consolidatedPeople.find(p => normalize(p.name).includes(normalize(personName)));
        if (person && !usedMonIds.has(person.id)) {
          monitors[slotNum - 1].assignedTo = person.name;
          monitors[slotNum - 1].photoUrl = person.photoUrl;
          if (person.subRole) monitors[slotNum - 1].role = person.subRole;
          usedMonIds.add(person.id);
        }
      }
    }
  });

  return { mics, monitors };
};