function seed(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}


function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0]
}

function lastName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : parts[0]
}

export function getTeamName(
  displayName: string,
  headcount: number | null | undefined,
  guestNames?: string[],
  salt?: number | string,
): string {
  if (!headcount || headcount <= 0) return firstName(displayName)

  const first = firstName(displayName)
  const last = lastName(displayName)
  const idx = (n: number) => typeof salt === 'number' ? salt % n : seed(`${first}:${salt ?? ''}`) % n

  if (headcount === 1) {
    const arr = [
      `${first} Unleashed`,
      `Maximum ${first}`,
      `${first} on Pole`,
      `Lone Wolf ${first}`,
      `${first} Redline`,
      `Flying ${first}`,
      `${first} Apex`,
      `${first} Full Send`,
    ]
    return arr[idx(arr.length)]
  }

  if (headcount === 2) {
    const a = first
    const b = guestNames?.[1]
      ? firstName(guestNames[1])
      : guestNames?.[0]
      ? firstName(guestNames[0])
      : first
    const pair = a !== b ? `${a} & ${b}` : a
    const arr = [
      `${pair} Twin Turbo`,
      `${pair} Full Throttle`,
      `${pair} Double Trouble`,
      `${pair} Tag Team`,
      `${pair} Dynamic Duo`,
      `${pair} Slipstream`,
      `${pair} Wingmen`,
      `Team ${pair} Overdrive`,
    ]
    return arr[idx(arr.length)]
  }

  // 3+
  const arr = [
    `Flying Team ${last}`,
    `${last} Racing Stable`,
    `The ${last} Pit Crew`,
    `${last} Racing Dynasty`,
    `The ${last} Convoy`,
    `${last} Motorsport Club`,
    `House ${last}`,
    `The ${last} Wolfpack`,
  ]
  return arr[idx(arr.length)]
}

export function reserveUniqueTeamName(
  displayName: string,
  headcount: number | null | undefined,
  guestNames: string[] | undefined,
  salt: number,
  usedNames: Set<string>,
): string {
  const reserve = (candidate: string) => {
    const key = candidate.trim().toLocaleLowerCase('en')
    if (usedNames.has(key)) return false
    usedNames.add(key)
    return true
  }

  // Each headcount category currently has eight generated racing patterns.
  for (let offset = 0; offset < 8; offset++) {
    const candidate = getTeamName(displayName, headcount, guestNames, salt + offset)
    if (reserve(candidate)) return candidate
  }

  // If every surname-based pattern is already occupied, switch to a more
  // personal first-name title before ever exposing a duplicate.
  const first = firstName(displayName)
  const fallbacks = [
    `Team ${first}`,
    `${first}'s Pit Crew`,
    `${first} Racing`,
    `${first} Motorsport`,
    `${first} on the Grid`,
    `${first} Full Throttle`,
  ]
  for (const candidate of fallbacks) {
    if (reserve(candidate)) return candidate
  }

  // Extremely rare final guard: keep the suffix thematic and deterministic.
  const gridPosition = String(usedNames.size + 1).padStart(2, '0')
  const candidate = `Team ${first} · P${gridPosition}`
  usedNames.add(candidate.toLocaleLowerCase('en'))
  return candidate
}
