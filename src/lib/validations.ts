import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Please enter your full name'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingStep1Schema = z.object({
  age: z.number().min(16, 'Must be at least 16').max(100, 'Please enter a valid age'),
  sex: z.enum(['male', 'female']),
  height_cm: z.number().min(100, 'Please enter a valid height').max(250),
  weight_kg: z.number().min(30, 'Please enter a valid weight').max(300),
});

export const onboardingStep2Schema = z.object({
  goal: z.enum(['bulk', 'cut', 'recomp']),
  goal_weight_kg: z.number().min(30).max(300),
});

export const onboardingStep3Schema = z.object({
  activity_level: z.enum(['sedentary', 'lightly_active', 'moderate', 'very_active', 'athlete']),
});

export const onboardingStep4Schema = z.object({
  body_fat_percentage: z.number().min(3).max(50).optional(),
  body_fat_unsure: z.boolean(),
});

export const onboardingStep5Schema = z.object({
  diet_type: z.enum(['standard', 'keto', 'vegan', 'vegetarian', 'paleo', 'gluten_free', 'dairy_free', 'halal', 'kosher', 'no_restrictions']),
  disliked_foods: z.array(z.string()),
  allergies: z.array(z.string()),
  meals_per_day: z.number().min(1).max(8),
  meal_timing_window: z.string(),
  cooking_skill: z.enum(['low', 'medium', 'high']),
  budget: z.enum(['low', 'medium', 'high']),
  restaurant_frequency: z.string(),
});

export const onboardingStep6Schema = z.object({
  injuries: z.array(z.string()),
  injury_notes: z.string(),
});

export const onboardingStep7Schema = z.object({
  workout_frequency: z.number().min(2).max(6),
  workout_location: z.enum(['home', 'gym']),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  home_equipment: z.array(z.string()),
  split_preference: z.enum(['full_body', 'upper_lower', 'ppl', 'bro_split', 'strength']),
  time_per_session: z.number().min(15).max(180),
  cardio_preference: z.enum(['none', 'light', 'moderate', 'high']),
});

export const onboardingStep8Schema = z.object({
  average_steps: z.number().min(0).max(50000),
  sleep_hours: z.number().min(3).max(14),
  stress_level: z.enum(['low', 'medium', 'high']),
  job_type: z.enum(['desk', 'active']),
});

export const onboardingStep9Schema = z.object({
  plan_duration_weeks: z.union([z.literal(4), z.literal(8), z.literal(12)]),
});

export const fullOnboardingSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema)
  .merge(onboardingStep5Schema)
  .merge(onboardingStep6Schema)
  .merge(onboardingStep7Schema)
  .merge(onboardingStep8Schema)
  .merge(onboardingStep9Schema);

export type FullOnboardingData = z.infer<typeof fullOnboardingSchema>;

export const checkInSchema = z.object({
  weight_kg: z.number().min(30).max(300),
  waist_cm: z.number().min(40).max(200).optional(),
  adherence_rating: z.number().min(1).max(10),
  steps_avg: z.number().min(0).max(50000),
  sleep_avg: z.number().min(0).max(14),
  notes: z.string().max(2000),
});

export const quizSchema = z.object({
  goal: z.string(),
  experience: z.string(),
  biggest_struggle: z.string(),
  timeline: z.string(),
});

export const leadSchema = z.object({
  email: z.string().email(),
  source: z.string(),
  quiz_answers: z.record(z.string(), z.string()).optional(),
});
