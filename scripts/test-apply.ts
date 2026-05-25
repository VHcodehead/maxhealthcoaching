/**
 * E2E test for the /apply form pipeline.
 *
 * Asserts: validation, scoring, persistence, response shape.
 * Skips the email assertion (Resend send is wrapped in try/catch in the route).
 *
 * Usage:
 *   1) PORT=3939 npm run dev    (in another terminal)
 *   2) npx tsx scripts/test-apply.ts
 *
 * Cleans up its own test rows. Test rows are named with the marker below
 * so they're easy to identify and purge manually if anything goes sideways.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3939';
const TEST_MARKER = 'TEST_APPLY_E2E';

const validPayload = {
  name: `${TEST_MARKER} High Score Applicant`,
  email: 'test+highscore@example.invalid',
  phone: '+1-555-0100',
  socialHandle: '@testapplicant',
  age: 28,
  timezone: 'EST / New York',

  goalType: 'contest_prep',
  goalNarrative:
    'I want to compete in NPC Mens Physique in 2027 and need a coach who knows prep at a deep level — not someone winging it from YouTube.',
  motivation:
    'I have been training for 6 years and this is the year I commit to stepping on stage.',
  timeline: '52 weeks until first show',

  struggles: ['nutrition', 'prep', 'plateau'],
  triedBefore: 'Three different coaches, none with prep experience. Did most of the work myself.',
  whyFailed:
    'Coaches were generic. No real adjustments. I want someone who actually pushes back and adjusts based on what the data says.',

  whyCoach:
    'I want oversight from someone with real competitive experience. I can do the work — I need someone making the calls so I am not guessing at peak week.',
  structure: 'yes',
  seriousness: 'ready_now',
  financialReadiness: 'yes_if_fit',

  trainingExperience: 'competitor',
  tracksFood: 'yes',
  gymAccess: 'full',
  injuries: '',
  inPrep: true,
  showDate: 'May 2027',
  federation: 'NPC',
  prepStage: 'Offseason, building',
  currentCoach: 'none',

  whatWorthIt: 'Stage-ready conditioning at my first show with zero second-guessing the plan.',
  readinessScore: 10,
  anythingElse: '',
};

const incompletePayload = {
  name: `${TEST_MARKER} Incomplete`,
  email: 'not-an-email',
};

async function http(
  pathname: string,
  init?: RequestInit,
): Promise<{ status: number; text: string; json: unknown }> {
  const res = await fetch(`${BASE_URL}${pathname}`, init);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, text, json };
}

function expect(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    console.log(`  ✗ ${label}${detail ? `\n      ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log(`\nTesting against ${BASE_URL}`);
  console.log('-'.repeat(60));

  const { prisma } = await import('../src/lib/db');

  // ── Test 1: GET /apply renders ───────────────────────────────────────
  console.log('\n[1] GET /apply');
  {
    const r = await http('/apply');
    expect('returns 200', r.status === 200, `got ${r.status}`);
    expect(
      'includes brand wordmark',
      r.text.includes('CoachMax'),
      'wordmark not found in HTML',
    );
    expect(
      'includes intro headline',
      r.text.toLowerCase().includes("isn") && r.text.toLowerCase().includes('sales page'),
      'intro headline not found',
    );
  }

  // ── Test 2: POST invalid JSON ────────────────────────────────────────
  console.log('\n[2] POST /api/coaching/apply with invalid JSON');
  {
    const r = await http('/api/coaching/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid',
    });
    expect('returns 400', r.status === 400, `got ${r.status}`);
    expect(
      'error message present',
      typeof (r.json as { error?: unknown })?.error === 'string',
      JSON.stringify(r.json),
    );
  }

  // ── Test 3: POST incomplete payload triggers zod errors ──────────────
  console.log('\n[3] POST /api/coaching/apply with incomplete payload');
  {
    const r = await http('/api/coaching/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompletePayload),
    });
    expect('returns 400', r.status === 400, `got ${r.status}`);
    const issues = (r.json as { issues?: unknown[] })?.issues;
    expect(
      'returns zod issues',
      Array.isArray(issues) && issues.length >= 5,
      `issues: ${JSON.stringify(issues).slice(0, 200)}`,
    );
  }

  // ── Test 4: POST valid payload — persists + scores ───────────────────
  console.log('\n[4] POST /api/coaching/apply with valid high-score payload');
  let savedId: string | null = null;
  {
    const r = await http('/api/coaching/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    expect('returns 200', r.status === 200, `got ${r.status} body=${r.text.slice(0, 200)}`);
    const id = (r.json as { id?: string })?.id;
    expect('returns id', typeof id === 'string' && id.length > 0, `id=${id}`);
    savedId = id ?? null;
  }

  // ── Test 5: DB row exists with expected score + priority ─────────────
  console.log('\n[5] DB row inspection');
  if (savedId) {
    const row = await prisma.coachingApplication.findUnique({ where: { id: savedId } });
    expect('row exists in DB', !!row);
    if (row) {
      expect('name matches', row.name === validPayload.name);
      expect('email matches', row.email === validPayload.email);
      expect('goalType matches', row.goalType === validPayload.goalType);
      expect(
        'score is high (≥ 10)',
        row.leadScore >= 10,
        `actual: ${row.leadScore}`,
      );
      expect('priority flag set', row.priority === true);
      expect('score version recorded', row.scoreVersion === 'v1');
      expect('payload Json saved', !!row.payload && typeof row.payload === 'object');
      console.log(`      → score=${row.leadScore} priority=${row.priority}`);
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────
  console.log('\n[6] Cleanup');
  const deleted = await prisma.coachingApplication.deleteMany({
    where: { name: { startsWith: TEST_MARKER } },
  });
  console.log(`  ✓ deleted ${deleted.count} test row(s)`);

  await prisma.$disconnect();

  console.log('\n' + '-'.repeat(60));
  console.log(
    process.exitCode === 1 ? 'FAILED — see ✗ lines above' : 'PASSED — all assertions green',
  );
}

main().catch((err) => {
  console.error('Test crashed:', err);
  process.exit(2);
});
