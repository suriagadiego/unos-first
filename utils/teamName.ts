function seed(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function pick<T>(arr: T[], key: string): T {
  return arr[seed(key) % arr.length]
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0]
}

function lastName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1] : parts[0]
}

function pluralize(name: string): string {
  return /[sxz]$/i.test(name) ? `${name}es` : `${name}s`
}

export function getTeamName(
  displayName: string,
  headcount: number | null | undefined,
  guestNames?: string[],
): string {
  if (!headcount || headcount <= 0) return firstName(displayName)

  const first = firstName(displayName)
  const last = lastName(displayName)

  if (headcount === 1) {
    return pick([
      `Flying ${first}`,
      `${first} Unleashed`,
      `Maximum ${first}`,
      `${first} on Pole`,
      `Lone Wolf ${first}`,
      `${first} Redline`,
      `${first} Apex`,
      `${first} Full Send`,
    ], first)
  }

  if (headcount === 2) {
    const a = first
    const b = guestNames?.[1]
      ? firstName(guestNames[1])
      : guestNames?.[0]
      ? firstName(guestNames[0])
      : first
    const pair = a !== b ? `${a} & ${b}` : a
    return pick([
      `${pair} Twin Turbo`,
      `${pair} Full Throttle`,
      `${pair} Double Trouble`,
      `${pair} Tag Team`,
      `${pair} Dynamic Duo`,
      `${pair} Slipstream`,
      `${pair} Wingmen`,
      `Team ${pair} Overdrive`,
    ], first)
  }

  // 3+
  return pick([
    `The Flying ${pluralize(last)}`,
    `${last} Racing Stable`,
    `The ${last} Pit Crew`,
    `${last} Racing Dynasty`,
    `The ${last} Convoy`,
    `${last} Motorsport Club`,
    `House ${last}`,
    `The ${last} Wolfpack`,
  ], first)
}
