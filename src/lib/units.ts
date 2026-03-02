export type UnitSystem = 'imperial' | 'metric'

// --- Conversion functions ---

export function kgToLbs(kg: number): number {
  return kg * 2.20462
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462
}

export function cmToIn(cm: number): number {
  return cm / 2.54
}

export function inToCm(inches: number): number {
  return inches * 2.54
}

export function cmToFtIn(cm: number): { feet: number; inches: number; display: string } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches, display: `${feet}'${inches}"` }
}

export function ftInToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54
}

// --- Unit labels ---

export function weightUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'lbs' : 'kg'
}

export function heightUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'ft/in' : 'cm'
}

export function lengthUnit(system: UnitSystem): string {
  return system === 'imperial' ? 'in' : 'cm'
}

// --- Display helpers ---

export function displayWeight(kg: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${Math.round(kgToLbs(kg) * 10) / 10} lbs`
  }
  return `${Math.round(kg * 10) / 10} kg`
}

export function displayHeight(cm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return cmToFtIn(cm).display
  }
  return `${Math.round(cm * 10) / 10} cm`
}

export function displayLength(cm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${Math.round(cmToIn(cm) * 10) / 10} in`
  }
  return `${Math.round(cm * 10) / 10} cm`
}
