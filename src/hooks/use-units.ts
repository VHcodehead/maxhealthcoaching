'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type UnitSystem,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  cmToFtIn,
  ftInToCm,
  weightUnit,
  heightUnit,
  lengthUnit,
  displayWeight,
  displayHeight,
  displayLength,
} from '@/lib/units'

const STORAGE_KEY = 'preferred-units'
const DEFAULT_SYSTEM: UnitSystem = 'imperial'

export function useUnits() {
  const [system, setSystemState] = useState<UnitSystem>(DEFAULT_SYSTEM)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'metric' || stored === 'imperial') {
      setSystemState(stored)
    }
    setHydrated(true)
  }, [])

  const setSystem = useCallback((s: UnitSystem) => {
    setSystemState(s)
    localStorage.setItem(STORAGE_KEY, s)
  }, [])

  return {
    system,
    setSystem,
    hydrated,

    // Labels
    weightUnit: weightUnit(system),
    heightUnit: heightUnit(system),
    lengthUnit: lengthUnit(system),

    // Converters
    kgToLbs,
    lbsToKg,
    cmToIn,
    inToCm,
    cmToFtIn,
    ftInToCm,

    // Display helpers (metric value in, formatted string out)
    displayWeight: (kg: number) => displayWeight(kg, system),
    displayHeight: (cm: number) => displayHeight(cm, system),
    displayLength: (cm: number) => displayLength(cm, system),

    // Input converters: convert displayed value → metric for storage
    parseWeight: (value: number) => (system === 'imperial' ? lbsToKg(value) : value),
    parseHeight: (feetOrCm: number, inches?: number) =>
      system === 'imperial' ? ftInToCm(feetOrCm, inches ?? 0) : feetOrCm,
    parseLength: (value: number) => (system === 'imperial' ? inToCm(value) : value),

    // Metric → display value (number, not string)
    weightToDisplay: (kg: number) =>
      system === 'imperial' ? Math.round(kgToLbs(kg) * 10) / 10 : kg,
    lengthToDisplay: (cm: number) =>
      system === 'imperial' ? Math.round(cmToIn(cm) * 10) / 10 : cm,
  }
}
