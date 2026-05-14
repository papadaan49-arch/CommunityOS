export interface EventData {
  name: string;
  organization: string;
  location: string;
  participants: number;
  staff: number;
  budget: number;
  type: string;
  goal: string;
  previous_context?: string;
}

export interface Blueprint {
  event_meta: {
    title: string;
    location: string;
    budget: number;
    strategy: string;
    scale_classification: 'Gerilya Scale' | 'Community Scale' | 'Regional Scale' | 'Massive Scale';
    operational_complexity: number; // 1-100
    burnout_risk: number; // 1-100
    budget_pressure: number; // 1-100
    coordination_intensity: number; // 1-100
  };
  wellbeing_guard: {
    risk_level: 'Green' | 'Amber' | 'Red';
    burnout_analysis: string;
    fatigue_analysis: string;
    action_items: string[];
  };
  operational: {
    budget_allocation: { item: string; amount: number; label: string }[];
    rundown: { time: string; task: string }[];
  };
  outreach: {
    local_partners: string[];
    ig_caption: string;
  };
}
