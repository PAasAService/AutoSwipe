/**
 * Vehicle Validation Utility
 * ──────────────────────────────────────────────────────────────────────────
 * Compares seller-entered form values against official government API data.
 * Detects mismatches in brand, model, and year so the seller can either
 * accept the official data or keep their own values.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareFields {
  brand?: string
  model?: string
  year?: number
}

export interface MismatchField {
  field: 'brand' | 'model' | 'year'
  labelHe: string
  formValue: string
  apiValue: string
}

export interface MismatchResult {
  hasMismatch: boolean
  mismatches: MismatchField[]
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Lowercase, collapse whitespace, trim.
 * Used for fuzzy comparison — we don't want "Toyota" ≠ "TOYOTA".
 */
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Returns true when two model strings are considered matching.
 * Government API often returns the full commercial name, e.g.
 * "ALFA ROMEO 147" while the form might have just "147".
 * We consider it a match if one string contains the other.
 */
function modelsMatch(formModel: string, apiModel: string): boolean {
  const f = norm(formModel)
  const a = norm(apiModel)
  return f === a || f.includes(a) || a.includes(f)
}

// ─── Core comparison ──────────────────────────────────────────────────────────

/**
 * Detects mismatches between what the seller typed and what the government
 * API returned.  Only checks fields that both sides have a value for —
 * a missing form value is not a mismatch, it's just an empty field.
 *
 * @param form   Values currently in the seller's form
 * @param api    Normalised values returned from the government API
 */
export function detectMismatches(
  form: CompareFields,
  api: CompareFields,
): MismatchResult {
  const mismatches: MismatchField[] = []

  // Brand
  if (form.brand && api.brand) {
    const fv = norm(form.brand)
    const av = norm(api.brand)
    if (fv !== av && !fv.includes(av) && !av.includes(fv)) {
      mismatches.push({
        field:     'brand',
        labelHe:   'מותג',
        formValue: form.brand,
        apiValue:  api.brand,
      })
    }
  }

  // Model — partial match tolerated
  if (form.model && api.model && !modelsMatch(form.model, api.model)) {
    mismatches.push({
      field:     'model',
      labelHe:   'דגם',
      formValue: form.model,
      apiValue:  api.model,
    })
  }

  // Year — exact numeric match required
  if (form.year && api.year && form.year !== api.year) {
    mismatches.push({
      field:     'year',
      labelHe:   'שנה',
      formValue: form.year.toString(),
      apiValue:  api.year.toString(),
    })
  }

  return {
    hasMismatch: mismatches.length > 0,
    mismatches,
  }
}
