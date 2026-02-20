export type CoachNoteCategory = 'general' | 'nutrition' | 'training' | 'check_in';
export type UserRole = 'client' | 'coach' | 'admin';
export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'trialing';
export type Goal = 'bulk' | 'cut' | 'recomp';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderate' | 'very_active' | 'athlete';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type DietType = 'standard' | 'keto' | 'vegan' | 'vegetarian' | 'paleo' | 'gluten_free' | 'dairy_free' | 'halal' | 'kosher' | 'no_restrictions';
export type Split = 'full_body' | 'upper_lower' | 'ppl' | 'bro_split' | 'strength';
export type PlanDuration = 4 | 8 | 12;

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  referral_code?: string;
  referred_by?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingResponse {
  id: string;
  user_id: string;
  version: number;

  // Personal
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  weight_kg: number;
  goal: Goal;
  goal_weight_kg: number;
  activity_level: ActivityLevel;
  body_fat_percentage?: number;
  body_fat_unsure: boolean;

  // Diet
  diet_type: DietType;
  disliked_foods: string[];
  allergies: string[];
  meals_per_day: number;
  meal_timing_window: string;
  cooking_skill: 'low' | 'medium' | 'high';
  budget: 'low' | 'medium' | 'high';
  restaurant_frequency: string;

  // Injuries
  injuries: string[];
  injury_notes: string;

  // Training
  workout_frequency: number;
  workout_location: 'home' | 'gym';
  experience_level: ExperienceLevel;
  home_equipment: string[];
  split_preference: Split;
  time_per_session: number;
  cardio_preference: 'none' | 'light' | 'moderate' | 'high';
  plan_duration_weeks: PlanDuration;

  // Lifestyle
  average_steps: number;
  sleep_hours: number;
  stress_level: 'low' | 'medium' | 'high';
  job_type: 'desk' | 'active';

  created_at: string;
}

export interface MacroTargets {
  id: string;
  user_id: string;
  version: number;
  bmr: number;
  tdee: number;
  calorie_target: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  formula_used: 'katch_mcardle' | 'mifflin_st_jeor' | 'coach_override';
  explanation: string;
  created_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  version: number;
  plan_data: MealPlanData;
  grocery_list: GroceryItem[];
  created_at: string;
}

export interface MealPlanData {
  days: MealDay[];
}

export interface MealDay {
  day: string;
  meals: Meal[];
  day_totals: MacroTotals;
}

export interface Meal {
  name: string;
  time?: string;
  recipe_title: string;
  ingredients: Ingredient[];
  instructions: string[];
  macro_totals: MacroTotals;
  swap_options: SwapOption[];
}

export interface SwapOption {
  recipe_title: string;
  ingredients: Ingredient[];
  instructions: string[];
  macro_totals: MacroTotals;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface GroceryItem {
  category: string;
  items: { name: string; amount: string }[];
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  version: number;
  duration_weeks: PlanDuration;
  plan_data: TrainingPlanData;
  created_at: string;
}

export interface TrainingPlanData {
  program_name: string;
  overview: string;
  progression_rules: string;
  weeks: TrainingWeek[];
}

export interface TrainingWeek {
  week: number;
  theme?: string;
  days: TrainingDay[];
}

export interface TrainingDay {
  day: string;
  name: string;
  warmup: string[];
  exercises: Exercise[];
  cooldown?: string;
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: number;
  rest_seconds: number;
  tempo?: string;
  notes?: string;
  substitution?: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  week_number: number;
  weight_kg: number;
  waist_cm?: number;
  adherence_rating: number;
  steps_avg: number;
  sleep_avg: number;
  notes: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  check_in_id: string;
  photo_type: 'front' | 'side' | 'back';
  storage_path: string;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  source: string;
  quiz_answers?: Record<string, string>;
  converted: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id?: string;
  code: string;
  discount_percent: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published: boolean;
  author_id: string;
  featured_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Transformation {
  id: string;
  client_id: string;
  client_name: string;
  before_photo?: string;
  after_photo?: string;
  weight_lost: string;
  duration: string;
  quote: string;
  featured: boolean;
  approved: boolean;
  created_at: string;
}

export interface CoachSettings {
  id: string;
  coach_id: string;
  max_clients: number;
  spots_remaining: number;
  promo_active: boolean;
  promo_end?: string;
  promo_discount_percent: number;
  welcome_message: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'plan_ready' | 'checkin_reminder' | 'checkin_overdue' | 'welcome' | 'referral_used';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CoachNote {
  id: string;
  user_id: string;
  coach_id: string;
  category: CoachNoteCategory;
  content: string;
  created_at: string;
}
