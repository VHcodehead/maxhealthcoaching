/**
 * Convert camelCase Prisma objects to snake_case for API responses.
 * Matches the frontend type definitions in types/database.ts.
 */

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Recursively convert all keys from camelCase to snake_case */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Keep JSON blob fields as-is (plan_data, grocery_list, etc.)
      // These are already stored as snake_case in the DB JSON columns
      const snakeKey = camelToSnake(key);
      if (
        snakeKey === 'plan_data' ||
        snakeKey === 'grocery_list' ||
        snakeKey === 'quiz_answers'
      ) {
        result[snakeKey] = value;
      } else {
        result[snakeKey] = toSnakeCase(value);
      }
    }
    return result;
  }
  return obj;
}
