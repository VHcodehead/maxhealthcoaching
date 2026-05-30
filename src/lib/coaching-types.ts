// src/lib/coaching-types.ts
//
// Unified Coaching Hub — TS mirror of the my-coach-backend CoachingExport
// payload (returned by GET /coaching-export/:appUserId). Kept in sync by hand;
// the backend owns the canonical shape (coachingExportService.ts +
// coachDashboardService.ClientDetail). Loosely typed where the app data is
// free-form (`unknown`/optional), precisely typed for the fields the coach hub
// derive layer actually reads.

export type WeightTrend = 'up' | 'down' | 'flat';

export interface ExportCheckin {
  id?: string;
  weight: number | null; // LBS
  mood?: number | null;
  energy?: number | null;
  notes?: string | null;
  sleep_quality?: string | number | null;
  hunger_level?: number | null;
  digestion?: string | null;
  menstrual_status?: string | null;
  photo_front_url?: string | null;
  photo_side1_url?: string | null;
  photo_side2_url?: string | null;
  photo_back_url?: string | null;
  body_analysis?: unknown;
  checked_at: string;
  [key: string]: unknown;
}

export interface TrainingSetLog {
  exercise_id: number | null;
  exercise_name: string | null;
  set_number: number | null;
  set_type: string | null;
  prescribed_reps: number | null;
  prescribed_weight: number | null;
  actual_reps: number | null;
  actual_weight: number | null;
  rpe: number | null;
  logged_at: string | null;
}

export interface WeightHistoryPoint {
  date: string;
  weight: number;
  source: 'daily' | 'checkin';
}

export interface StepHistoryPoint {
  date: string;
  steps: number;
  source: string | null;
}

export interface CoachingExport {
  overview: {
    profile: {
      id: string;
      name: string | null;
      email: string | null;
      goal: string | null;
      sex: string | null;
      age: number | null;
      height_cm: number | null;
      currentWeightKg: number | null;
      tier: string | null;
    };
    coachClient: { linked_at: string | null; status: string | null };
    isCoachManaged: boolean;
    pendingRecs: unknown[];
    redFlags: string[];
  };
  nutrition: {
    macros: {
      target_protein: number | null;
      target_carbs: number | null;
      target_fat: number | null;
      final_calories: number | null;
    };
    recentFoodLogs: Array<{
      food_name?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      meal_type?: string;
      logged_at?: string;
      [key: string]: unknown;
    }>;
    adherencePct7d: number;
    weeklySummary: unknown | null;
  };
  training: {
    activePlan: unknown | null;
    recentWorkouts: unknown[];
    recentSetLogs: TrainingSetLog[];
  };
  biometrics: {
    measurements: unknown[];
    supplements: unknown[];
    wearable: Array<{
      date?: string;
      resting_heart_rate?: number | null;
      hrv?: number | null;
      sleep_hours?: number | null;
      [key: string]: unknown;
    }>;
    weightHistory: WeightHistoryPoint[];
    stepHistory: StepHistoryPoint[];
  };
  photos: Array<{
    id?: string;
    image_url?: string;
    weight?: number | null;
    notes?: string | null;
    created_at?: string;
    [key: string]: unknown;
  }>;
  checkins: ExportCheckin[];
  notes: unknown[];
  exportMeta: {
    appUserId: string;
    coachId: string | null;
    generatedAt: string;
  };
}
