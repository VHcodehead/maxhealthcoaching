/**
 * Sunday check-in schedule utilities.
 *
 * Check-in window: Saturday 18:00 UTC → Tuesday 23:59 UTC (~78 hours)
 * This covers "Sunday" in every timezone worldwide.
 */

interface CheckInWindow {
  opens: Date;
  closes: Date;
  targetSunday: Date;
}

/**
 * Get the current (or most recent/next) check-in window relative to `now`.
 * The window always opens Saturday 18:00 UTC and closes Tuesday 23:59 UTC.
 */
export function getCurrentCheckInWindow(now: Date = new Date()): CheckInWindow {
  const d = new Date(now);
  const day = d.getUTCDay(); // 0=Sun,1=Mon,2=Tue,...,6=Sat
  const hours = d.getUTCHours();

  // Find the target Sunday for the current window.
  // We need to figure out which window `now` belongs to.
  // Window: Sat 18:00 → Tue 23:59
  //   Sat 18:00+ → target Sunday is tomorrow (day+1)
  //   Sun         → target Sunday is today
  //   Mon         → target Sunday is yesterday
  //   Tue         → target Sunday is 2 days ago (still in window until 23:59)
  //   Tue 23:59+  → next window (but this is Wed, handled below)
  //   Wed-Fri     → next upcoming Sunday
  //   Sat <18:00  → next upcoming Sunday

  let targetSunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  if (day === 6 && hours >= 18) {
    // Saturday 18:00+ → Sunday is tomorrow
    targetSunday.setUTCDate(targetSunday.getUTCDate() + 1);
  } else if (day === 0) {
    // Sunday → today is the target
    // targetSunday is already correct
  } else if (day === 1) {
    // Monday → Sunday was yesterday
    targetSunday.setUTCDate(targetSunday.getUTCDate() - 1);
  } else if (day === 2) {
    // Tuesday → Sunday was 2 days ago (still in window until 23:59)
    targetSunday.setUTCDate(targetSunday.getUTCDate() - 2);
  } else {
    // Wed(3), Thu(4), Fri(5), Sat(6) before 18:00 → next Sunday
    const daysUntilSunday = (7 - day) % 7 || 7;
    targetSunday.setUTCDate(targetSunday.getUTCDate() + daysUntilSunday);
  }

  // Window opens Saturday before target Sunday at 18:00 UTC
  const opens = new Date(targetSunday);
  opens.setUTCDate(opens.getUTCDate() - 1);
  opens.setUTCHours(18, 0, 0, 0);

  // Window closes Tuesday after target Sunday at 23:59:59.999 UTC
  const closes = new Date(targetSunday);
  closes.setUTCDate(closes.getUTCDate() + 2);
  closes.setUTCHours(23, 59, 59, 999);

  return { opens, closes, targetSunday };
}

/** Is `now` inside the current check-in window? */
export function isWithinCheckInWindow(now: Date = new Date()): boolean {
  const { opens, closes } = getCurrentCheckInWindow(now);
  return now >= opens && now <= closes;
}

/** When does the next window open? Returns next Saturday 18:00 UTC after `now`. */
export function getNextWindowOpens(now: Date = new Date()): Date {
  const current = getCurrentCheckInWindow(now);

  // If we're before the current window opens, return current opens
  if (now < current.opens) {
    return current.opens;
  }

  // Otherwise return next week's Saturday 18:00 UTC
  const nextSaturday = new Date(current.targetSunday);
  nextSaturday.setUTCDate(nextSaturday.getUTCDate() + 6); // next Saturday
  nextSaturday.setUTCHours(18, 0, 0, 0);
  return nextSaturday;
}

/** Did the client already check in during the current window? */
export function hasCheckedInThisWeek(
  lastCheckInDate: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lastCheckInDate) return false;
  const last = new Date(lastCheckInDate);
  const { opens, closes } = getCurrentCheckInWindow(now);
  return last >= opens && last <= closes;
}

/**
 * Is the client overdue?
 * Overdue = the current window has closed AND they didn't check in during it.
 * Only applies to clients who have completed onboarding.
 */
export function isClientOverdue(
  lastCheckInDate: Date | string | null | undefined,
  onboardingCompleted: boolean,
  now: Date = new Date()
): boolean {
  if (!onboardingCompleted) return false;

  const { closes } = getCurrentCheckInWindow(now);

  // Window hasn't closed yet → not overdue
  if (now <= closes) return false;

  // Window closed — did they check in during it?
  return !hasCheckedInThisWeek(lastCheckInDate, now);
}
