import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CAR_BRANDS_MODELS } from '@/lib/constants/cars'
import type { BuyerPreferences, FuelType, VehicleType } from '@/types'

// Partial preferences during onboarding wizard
type OnboardingPreferences = Partial<BuyerPreferences> & {
  step: number
  roles: string[]
}

interface PreferencesState {
  onboarding: OnboardingPreferences
  setStep: (step: number) => void
  setRoles: (roles: string[]) => void
  updatePrefs: (updates: Partial<BuyerPreferences>) => void
  toggleBrand: (brand: string) => void
  toggleModel: (model: string) => void
  toggleFuelType: (fuel: FuelType) => void
  toggleVehicleType: (type: VehicleType) => void
  resetOnboarding: () => void
}

const defaultOnboarding: OnboardingPreferences = {
  step: 0,
  roles: [],
  budgetMax: 200_000,
  budgetMin: 0,
  preferredBrands: [],
  preferredModels: [],
  fuelPreferences: [],
  vehicleTypes: [],
  location: '',
  searchRadius: 50,
  ownershipYears: 3,
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      onboarding: defaultOnboarding,

      setStep: (step) =>
        set((s) => ({ onboarding: { ...s.onboarding, step } })),

      setRoles: (roles) =>
        set((s) => ({ onboarding: { ...s.onboarding, roles } })),

      updatePrefs: (updates) =>
        set((s) => ({ onboarding: { ...s.onboarding, ...updates } })),

      toggleBrand: (brand) =>
        set((s) => {
          const brands = s.onboarding.preferredBrands ?? []
          const isRemoving = brands.includes(brand)
          const removedBrandModels = new Set(CAR_BRANDS_MODELS[brand] ?? [])
          return {
            onboarding: {
              ...s.onboarding,
              preferredBrands: isRemoving
                ? brands.filter((b) => b !== brand)
                : [...brands, brand],
              preferredModels: isRemoving
                ? (s.onboarding.preferredModels ?? []).filter((m) => !removedBrandModels.has(m))
                : s.onboarding.preferredModels,
            },
          }
        }),

      toggleModel: (model) =>
        set((s) => {
          const models = s.onboarding.preferredModels ?? []
          return {
            onboarding: {
              ...s.onboarding,
              preferredModels: models.includes(model)
                ? models.filter((m) => m !== model)
                : [...models, model],
            },
          }
        }),

      toggleFuelType: (fuel) =>
        set((s) => {
          const fuels = s.onboarding.fuelPreferences ?? []
          return {
            onboarding: {
              ...s.onboarding,
              fuelPreferences: fuels.includes(fuel)
                ? fuels.filter((f) => f !== fuel)
                : [...fuels, fuel],
            },
          }
        }),

      toggleVehicleType: (type) =>
        set((s) => {
          const types = s.onboarding.vehicleTypes ?? []
          return {
            onboarding: {
              ...s.onboarding,
              vehicleTypes: types.includes(type)
                ? types.filter((t) => t !== type)
                : [...types, type],
            },
          }
        }),

      resetOnboarding: () => set({ onboarding: defaultOnboarding }),
    }),
    {
      name: 'autoswipe-onboarding',
      partialize: (state) => ({ onboarding: state.onboarding }),
    }
  )
)
