// src/lib/bloodwork-parser.ts
//
// Unified Coaching Hub — Phase 3. Parses pasted bloodwork text into structured
// markers via OpenAI, then computes out-of-range flags deterministically (we
// never trust the model for the flag — we derive it from value vs ref range).
//
// Decision (ADR 008 open item): text extraction + LLM structuring, not PDF
// vision. The client uploads the PDF for the record AND pastes the values (or
// we accept text); this is reliable, cheap, and testable. Pure-PDF-only uploads
// are stored with parseStatus 'pending' for manual coach entry.

import { getOpenAI } from './openai';

export interface BloodMarker {
  name: string;
  value: number | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  flag: 'low' | 'high' | 'normal' | 'unknown';
}

const SYSTEM = `You extract structured lab markers from bloodwork text. Respond with JSON only:
{"markers":[{"name":string,"value":number|null,"unit":string|null,"refLow":number|null,"refHigh":number|null}]}
Rules: one entry per marker. Parse reference ranges like "264-916" into refLow/refHigh. For ">40" set refLow=40,refHigh=null. For "<5" set refHigh=5,refLow=null. Numbers only for value/refLow/refHigh (no units inside them). Do not invent markers. Do not include commentary.`;

/** Derive the flag from value vs range — never trust the model for this. */
export function flagFor(m: { value: number | null; refLow: number | null; refHigh: number | null }): BloodMarker['flag'] {
  if (m.value == null) return 'unknown';
  if (m.refLow != null && m.value < m.refLow) return 'low';
  if (m.refHigh != null && m.value > m.refHigh) return 'high';
  if (m.refLow == null && m.refHigh == null) return 'unknown';
  return 'normal';
}

export async function parseBloodworkText(text: string): Promise<BloodMarker[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: trimmed.slice(0, 12000) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: { markers?: Array<Partial<BloodMarker>> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const markers = Array.isArray(parsed.markers) ? parsed.markers : [];
  return markers
    .filter((m) => m && typeof m.name === 'string' && m.name.trim())
    .map((m) => {
      const value = typeof m.value === 'number' ? m.value : null;
      const refLow = typeof m.refLow === 'number' ? m.refLow : null;
      const refHigh = typeof m.refHigh === 'number' ? m.refHigh : null;
      return {
        name: String(m.name).trim(),
        value,
        unit: m.unit ? String(m.unit) : null,
        refLow,
        refHigh,
        flag: flagFor({ value, refLow, refHigh }),
      } satisfies BloodMarker;
    });
}

export function outOfRangeCount(markers: BloodMarker[]): number {
  return markers.filter((m) => m.flag === 'low' || m.flag === 'high').length;
}
