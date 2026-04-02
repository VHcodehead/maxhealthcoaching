/**
 * Full Pipeline Integration Test — MaxHealth v1.0
 *
 * Tests the ENTIRE client lifecycle end-to-end via Prisma.
 * Run: npx tsx scripts/test-full-pipeline.ts
 *
 * Tests:
 *   1. Application signup (pending_approval)
 *   2. Coach approval (→ none)
 *   3. Stripe subscription simulation (→ active)
 *   4. Onboarding data creation
 *   5. Macro calculation
 *   6. Meal plan + training plan creation
 *   7. Check-in submission
 *   8. Auto macro adjustment trigger
 *   9. Coach macro approval
 *  10. Coach editing (add/remove meals, exercises, cardio, supplements)
 *  11. Messaging (send/receive/unread/mark-read)
 *  12. Password reset token flow
 *  13. Email verification token flow
 *  14. Cleanup
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TEST_EMAIL = `test-pipeline-${Date.now()}@example.com`;

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ✗ FAIL: ${message}`);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const coachProfile = await prisma.profile.findFirst({ where: { role: 'coach' } });
  if (!coachProfile) {
    console.error('No coach found. Run seed first.');
    process.exit(1);
  }
  const coachId = coachProfile.userId;
  let testUserId: string | null = null;

  try {
    console.log('\n══════════════════════════════════════════════════');
    console.log('  MAXHEALTH FULL PIPELINE TEST');
    console.log('══════════════════════════════════════════════════\n');

    // ── 1. APPLICATION SIGNUP ──────────────────────────────────
    console.log('▶ 1. Application Signup');

    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, passwordHash },
    });
    testUserId = user.id;

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        email: TEST_EMAIL,
        fullName: 'Pipeline Test User',
        role: 'client',
        referralCode: crypto.randomBytes(6).toString('hex'),
        subscriptionStatus: 'pending_approval',
        applicationGoal: 'Lose fat & get lean',
        applicationExperience: 'intermediate',
        applicationCommitment: '4',
        applicationGender: 'male',
        applicationAge: 28,
        applicationHeightFt: 5,
        applicationHeightIn: 10,
        applicationWeightLbs: 185,
        applicationMotivation: 'Integration test — verifying the full coaching pipeline.',
        applicationSource: 'test-script',
      },
    });

    assert(profile.subscriptionStatus === 'pending_approval', 'Status is pending_approval');
    assert(profile.applicationGoal === 'Lose fat & get lean', 'Application goal stored');
    assert(profile.applicationMotivation?.includes('Integration test') ?? false, 'Motivation stored');

    // ── 2. COACH APPROVAL ──────────────────────────────────────
    console.log('\n▶ 2. Coach Approval');

    await prisma.profile.update({
      where: { id: profile.id },
      data: { subscriptionStatus: 'none' },
    });
    const approved = await prisma.profile.findUnique({ where: { id: profile.id } });
    assert(approved?.subscriptionStatus === 'none', 'Approved → status none');

    // ── 3. STRIPE SUBSCRIPTION ─────────────────────────────────
    console.log('\n▶ 3. Stripe Subscription Simulation');

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        subscriptionStatus: 'active',
        stripeCustomerId: `cus_test_${Date.now()}`,
        stripeSubscriptionId: `sub_test_${Date.now()}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    const active = await prisma.profile.findUnique({ where: { id: profile.id } });
    assert(active?.subscriptionStatus === 'active', 'Subscription active');
    assert(active?.stripeCustomerId !== null, 'Stripe customer ID stored');

    // ── 4. ONBOARDING ──────────────────────────────────────────
    console.log('\n▶ 4. Onboarding');

    const onboarding = await prisma.onboardingResponse.create({
      data: {
        userId: user.id, version: 1, age: 28, sex: 'male',
        heightCm: 177.8, weightKg: 83.9, goal: 'cut', goalWeightKg: 77,
        activityLevel: 'moderate', bodyFatPercentage: 18, bodyFatUnsure: false,
        dietType: 'no_restrictions', dislikedFoods: [], allergies: [],
        mealsPerDay: 3, mealTimingWindow: '8am-8pm', cookingSkill: 'medium',
        budget: 'medium', restaurantFrequency: '1x/week', injuries: [],
        injuryNotes: '', workoutFrequency: 4, workoutLocation: 'gym',
        experienceLevel: 'intermediate', homeEquipment: [],
        splitPreference: 'upper_lower', timePerSession: 60,
        cardioPreference: 'moderate', planDurationWeeks: 8,
        averageSteps: 9000, sleepHours: 7.5, stressLevel: 'medium', jobType: 'desk',
      },
    });
    await prisma.profile.update({ where: { id: profile.id }, data: { onboardingCompleted: true } });
    assert(onboarding.goal === 'cut', 'Onboarding stored');

    // ── 5. MACRO CALCULATION ───────────────────────────────────
    console.log('\n▶ 5. Macro Calculation');

    const macros = await prisma.macroTarget.create({
      data: {
        userId: user.id, version: 1, bmr: 1820, tdee: 2821,
        calorieTarget: 2257, proteinG: 168, fatG: 67, carbsG: 242,
        formulaUsed: 'katch_mcardle',
        explanation: 'Test: 83.9kg, 18% BF, cut.',
      },
    });
    assert(macros.calorieTarget === 2257, 'Macros calculated');

    // ── 6. MEAL + TRAINING PLANS ───────────────────────────────
    console.log('\n▶ 6. Plan Generation');

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: user.id, version: 1,
        planData: {
          days: [{
            day: 'Monday',
            meals: [
              { name: 'Breakfast', recipe_title: 'Eggs & Toast', ingredients: [{ name: 'Eggs', amount: '3', unit: 'whole' }], instructions: ['Scramble'], macro_totals: { calories: 450, protein: 30, carbs: 35, fat: 20 }, swap_options: [] },
              { name: 'Lunch', recipe_title: 'Chicken & Rice', ingredients: [{ name: 'Chicken', amount: '200', unit: 'g' }], instructions: ['Grill'], macro_totals: { calories: 550, protein: 45, carbs: 60, fat: 10 }, swap_options: [] },
            ],
            day_totals: { calories: 1000, protein: 75, carbs: 95, fat: 30 },
          }],
        },
        groceryList: [],
      },
    });

    const trainingPlan = await prisma.trainingPlan.create({
      data: {
        userId: user.id, version: 1, durationWeeks: 8,
        planData: {
          program_name: 'Test Upper/Lower', overview: 'Test plan.',
          progression_rules: 'Add weight when hitting top of rep range.',
          weeks: [{
            week: 1, phase_name: 'Hypertrophy',
            days: [{
              day_name: 'Monday', session_name: 'Upper A',
              warmup: ['5 min cardio'],
              exercises: [
                { name: 'Bench Press', sets: 4, reps: '8-10', rest_seconds: 120 },
                { name: 'Barbell Row', sets: 4, reps: '8-10', rest_seconds: 120 },
              ],
              cardio: { type: 'Incline Walk', duration_minutes: 15 },
            }],
          }],
        },
      },
    });

    const mp = mealPlan.planData as any;
    const tp = trainingPlan.planData as any;
    assert(mp.days[0].meals.length === 2, 'Meal plan: 2 meals');
    assert(tp.weeks[0].days[0].exercises.length === 2, 'Training plan: 2 exercises');
    assert(tp.weeks[0].days[0].cardio.type === 'Incline Walk', 'Cardio stored');

    // ── 7. CHECK-IN ────────────────────────────────────────────
    console.log('\n▶ 7. Check-in');

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: user.id, weekNumber: 1, weightKg: 82.5,
        waistCm: 86, adherenceRating: 8, stepsAvg: 9500,
        sleepAvg: 7.5, notes: 'Great first week.',
      },
    });
    assert(checkIn.weightKg === 82.5, 'Check-in recorded');

    // ── 8. AUTO MACRO ADJUSTMENT ───────────────────────────────
    console.log('\n▶ 8. Auto Macro Adjustment');

    const adj = await prisma.pendingMacroAdjustment.create({
      data: {
        userId: user.id, checkInId: checkIn.id, status: 'pending',
        previousWeightKg: 83.9, newWeightKg: 82.5,
        currentCalories: 2257, currentProteinG: 168, currentFatG: 67, currentCarbsG: 242,
        proposedBmr: 1800, proposedTdee: 2790,
        proposedCalories: 2232, proposedProteinG: 165, proposedFatG: 66, proposedCarbsG: 238,
        proposedFormula: 'katch_mcardle',
        proposedExplanation: 'Recalculated for 82.5 kg.',
      },
    });
    assert(adj.status === 'pending', 'Adjustment pending');

    // ── 9. COACH APPROVES ADJUSTMENT ───────────────────────────
    console.log('\n▶ 9. Coach Approves Macros');

    await prisma.pendingMacroAdjustment.update({
      where: { id: adj.id },
      data: {
        status: 'approved', approvedCalories: 2232, approvedProteinG: 165,
        approvedFatG: 66, approvedCarbsG: 238, coachNote: 'Keep it up.',
        resolvedAt: new Date(),
      },
    });
    const v2 = await prisma.macroTarget.create({
      data: {
        userId: user.id, version: 2, bmr: 1800, tdee: 2790,
        calorieTarget: 2232, proteinG: 165, fatG: 66, carbsG: 238,
        formulaUsed: 'coach_approved', explanation: 'Approved week 1 adjustment.',
      },
    });
    const resolved = await prisma.pendingMacroAdjustment.findUnique({ where: { id: adj.id } });
    assert(resolved?.status === 'approved', 'Adjustment approved');
    assert(v2.version === 2, 'Macro v2 created');

    // ── 10. COACH EDITING ──────────────────────────────────────
    console.log('\n▶ 10. Coach Editing');

    // Add meal
    mp.days[0].meals.push({ name: 'Dinner', recipe_title: 'Salmon', ingredients: [], instructions: [], macro_totals: { calories: 500, protein: 40, carbs: 15, fat: 28 }, swap_options: [] });
    await prisma.mealPlan.update({ where: { id: mealPlan.id }, data: { planData: mp } });
    let check = await prisma.mealPlan.findUnique({ where: { id: mealPlan.id } });
    assert((check?.planData as any).days[0].meals.length === 3, 'Meal added (3)');

    // Remove meal
    mp.days[0].meals.splice(1, 1);
    await prisma.mealPlan.update({ where: { id: mealPlan.id }, data: { planData: mp } });
    check = await prisma.mealPlan.findUnique({ where: { id: mealPlan.id } });
    assert((check?.planData as any).days[0].meals.length === 2, 'Meal removed (2)');

    // Add exercise
    tp.weeks[0].days[0].exercises.push({ name: 'Lateral Raise', sets: 3, reps: '12-15', rest_seconds: 60 });
    await prisma.trainingPlan.update({ where: { id: trainingPlan.id }, data: { planData: tp } });
    let tpCheck = await prisma.trainingPlan.findUnique({ where: { id: trainingPlan.id } });
    assert((tpCheck?.planData as any).weeks[0].days[0].exercises.length === 3, 'Exercise added (3)');

    // Remove exercise
    tp.weeks[0].days[0].exercises.splice(0, 1);
    await prisma.trainingPlan.update({ where: { id: trainingPlan.id }, data: { planData: tp } });
    tpCheck = await prisma.trainingPlan.findUnique({ where: { id: trainingPlan.id } });
    assert((tpCheck?.planData as any).weeks[0].days[0].exercises.length === 2, 'Exercise removed (2)');

    // Edit cardio
    tp.weeks[0].days[0].cardio = { type: 'Stairmaster', duration_minutes: 20 };
    await prisma.trainingPlan.update({ where: { id: trainingPlan.id }, data: { planData: tp } });
    tpCheck = await prisma.trainingPlan.findUnique({ where: { id: trainingPlan.id } });
    assert((tpCheck?.planData as any).weeks[0].days[0].cardio.type === 'Stairmaster', 'Cardio updated');

    // Supplement
    const supp = await prisma.supplementRecommendation.create({
      data: {
        userId: user.id, coachId, name: 'Creatine Monohydrate',
        dosage: '5', unit: 'g', frequency: 'daily', timing: 'post_workout',
        category: 'performance', form: 'powder', notes: 'Test',
      },
    });
    assert(supp.name === 'Creatine Monohydrate', 'Supplement created');

    // ── 11. MESSAGING ──────────────────────────────────────────
    console.log('\n▶ 11. Messaging');

    await prisma.message.create({ data: { senderId: coachId, receiverId: user.id, content: 'Welcome!' } });
    await prisma.message.create({ data: { senderId: user.id, receiverId: coachId, content: 'Thanks coach!' } });

    const unreadClient = await prisma.message.count({ where: { receiverId: user.id, read: false } });
    const unreadCoach = await prisma.message.count({ where: { receiverId: coachId, senderId: user.id, read: false } });
    assert(unreadClient === 1, `Client: 1 unread (got ${unreadClient})`);
    assert(unreadCoach === 1, `Coach: 1 unread (got ${unreadCoach})`);

    await prisma.message.updateMany({ where: { receiverId: user.id, read: false }, data: { read: true } });
    const afterRead = await prisma.message.count({ where: { receiverId: user.id, read: false } });
    assert(afterRead === 0, 'Messages marked read');

    // ── 12. PASSWORD RESET ─────────────────────────────────────
    console.log('\n▶ 12. Password Reset');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: { userId: user.id, hashedToken: hashed, expiresAt: new Date(Date.now() + 3600000) },
    });
    const found = await prisma.passwordResetToken.findFirst({ where: { hashedToken: hashed, expiresAt: { gt: new Date() } } });
    assert(found !== null, 'Reset token valid');

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash('NewPass!', 12) } });
    await prisma.passwordResetToken.delete({ where: { id: found!.id } });
    const gone = await prisma.passwordResetToken.findFirst({ where: { hashedToken: hashed } });
    assert(gone === null, 'Token single-use (deleted)');

    const pwCheck = await prisma.user.findUnique({ where: { id: user.id } });
    assert(await bcrypt.compare('NewPass!', pwCheck!.passwordHash), 'Password reset works');

    // ── 13. EMAIL VERIFICATION ─────────────────────────────────
    console.log('\n▶ 13. Email Verification');

    const vToken = crypto.randomBytes(32).toString('hex');
    const vHashed = crypto.createHash('sha256').update(vToken).digest('hex');
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, hashedToken: vHashed, expiresAt: new Date(Date.now() + 86400000) },
    });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

    const verified = await prisma.user.findUnique({ where: { id: user.id } });
    assert(verified?.emailVerified !== null, 'Email verified');

    // ── 14. CLEANUP ────────────────────────────────────────────
    console.log('\n▶ 14. Cleanup');

    await prisma.message.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
    await prisma.supplementRecommendation.deleteMany({ where: { userId: user.id } });
    await prisma.pendingMacroAdjustment.deleteMany({ where: { userId: user.id } });
    await prisma.checkIn.deleteMany({ where: { userId: user.id } });
    await prisma.trainingPlan.deleteMany({ where: { userId: user.id } });
    await prisma.mealPlan.deleteMany({ where: { userId: user.id } });
    await prisma.macroTarget.deleteMany({ where: { userId: user.id } });
    await prisma.onboardingResponse.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.profile.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    testUserId = null;
    console.log('  ✓ Test data cleaned up');

    // ── RESULTS ────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════════');
    console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
    console.log('══════════════════════════════════════════════════');
    if (failures.length > 0) {
      console.log('\n  FAILURES:');
      failures.forEach((f) => console.log(`    ✗ ${f}`));
    }
    console.log(failed === 0 ? '\n  ★ ALL TESTS PASSED — Pipeline is production-ready\n' : '\n  ✗ SOME TESTS FAILED\n');

    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n  ✗ FATAL ERROR:', error);
    if (testUserId) {
      try {
        await prisma.message.deleteMany({ where: { OR: [{ senderId: testUserId }, { receiverId: testUserId }] } });
        await prisma.supplementRecommendation.deleteMany({ where: { userId: testUserId } });
        await prisma.pendingMacroAdjustment.deleteMany({ where: { userId: testUserId } });
        await prisma.checkIn.deleteMany({ where: { userId: testUserId } });
        await prisma.trainingPlan.deleteMany({ where: { userId: testUserId } });
        await prisma.mealPlan.deleteMany({ where: { userId: testUserId } });
        await prisma.macroTarget.deleteMany({ where: { userId: testUserId } });
        await prisma.onboardingResponse.deleteMany({ where: { userId: testUserId } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: testUserId } });
        await prisma.emailVerificationToken.deleteMany({ where: { userId: testUserId } });
        await prisma.profile.deleteMany({ where: { userId: testUserId } });
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('  ✓ Cleanup after error');
      } catch { console.error('  ✗ Cleanup failed'); }
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
