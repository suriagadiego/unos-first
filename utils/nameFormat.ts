const ROMAN_NUMERALS = new Set(['ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'])

function titleCaseSegment(segment: string): string {
  if (!segment) return segment

  // Preserve intentional internal capitals such as DeLaCruz.
  if (/[a-z][A-Z]/.test(segment)) {
    return segment.charAt(0).toLocaleUpperCase('en') + segment.slice(1)
  }

  const lower = segment.toLocaleLowerCase('en')
  const lettersOnly = lower.replace(/[^a-z]/g, '')
  if (ROMAN_NUMERALS.has(lettersOnly)) {
    return lower.replace(/[a-z]+/i, lettersOnly.toLocaleUpperCase('en'))
  }

  if (/^mc[a-z]/.test(lower)) {
    return `Mc${lower.charAt(2).toLocaleUpperCase('en')}${lower.slice(3)}`
  }

  return lower.charAt(0).toLocaleUpperCase('en') + lower.slice(1)
}

function titleCaseWord(word: string): string {
  return word
    .split(/([-’'])/)
    .map(part => part === '-' || part === "'" || part === '’' ? part : titleCaseSegment(part))
    .join('')
}

export function toNameTitleCase(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(titleCaseWord)
    .join(' ')
}

export function titleCaseNames(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map(toNameTitleCase)
    .filter(Boolean)
}
