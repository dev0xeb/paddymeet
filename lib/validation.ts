// Shared by signup and checkout so phone/name rules stay in one place
// instead of drifting between the two forms.

// Nigerian phone format: local (0XXXXXXXXXXX, 11 digits) or international
// (+234XXXXXXXXXX). Spaces are stripped before testing so a user can type
// them for readability.
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  const nigerianLocal = /^0[789][01]\d{8}$/
  const nigerianIntl = /^\+234[789][01]\d{8}$/
  return nigerianLocal.test(cleaned) || nigerianIntl.test(cleaned)
}

// Strips everything except digits, a leading +, and spaces as the user
// types, so the field can't accumulate letters or other symbols.
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\s]/g, '')
}

// "+234 801 234 5678" is the longest valid format at 17 characters.
export const PHONE_MAX_LENGTH = 17

const NAME_PATTERN = /^[A-Za-z][A-Za-z'\- ]*$/

// Real names use letters plus spaces, hyphens (Mary-Jane) and apostrophes
// (O'Brien) — anything else (digits, @, etc.) isn't a name.
export function validateName(name: string): boolean {
  return NAME_PATTERN.test(name.trim())
}

export function sanitizeNameInput(value: string): string {
  return value.replace(/[^A-Za-z'\- ]/g, '')
}
