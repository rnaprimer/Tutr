import { Database } from '@/types/database'

export type TeachingLocationPreference = Database['public']['Enums']['teaching_location']

export const VALID_TEACHING_LOCATIONS: TeachingLocationPreference[] = [
  'STUDENT_HOME',
  'TEACHER_LOCATION',
  'BOTH',
]

const METADATA_PREFIX = '---METADATA---'
const METADATA_SUFFIX = '---END_METADATA---'
const METADATA_REGEX = /^---METADATA---\r?\n([\s\S]*?)\r?\n---END_METADATA---\r?\n?/

/**
 * Validates whether a value is a valid TeachingLocationPreference.
 */
export function isValidTeachingLocation(val: unknown): val is TeachingLocationPreference {
  return typeof val === 'string' && VALID_TEACHING_LOCATIONS.includes(val as TeachingLocationPreference)
}

/**
 * Returns a human-friendly display label for a teaching location preference.
 */
export function getTeachingLocationLabel(preference: TeachingLocationPreference | null | undefined): string {
  switch (preference) {
    case 'STUDENT_HOME':
      return "At Student's Home"
    case 'TEACHER_LOCATION':
      return "At Tutor's Location"
    case 'BOTH':
      return "Flexible (Student's Home or Tutor's Location)"
    default:
      return 'Not specified'
  }
}

/**
 * Encodes a teaching location preference along with the user's free-text message.
 */
export function encodeRequestMessage(
  preference: TeachingLocationPreference | null | undefined,
  userMessage: string | null | undefined
): string | null {
  const cleanMessage = (userMessage || '').trim()

  if (!preference) {
    return cleanMessage || null
  }

  const metaBlock = `${METADATA_PREFIX}\nTEACHING_LOCATION: ${preference}\n${METADATA_SUFFIX}\n`
  return `${metaBlock}${cleanMessage}`
}

/**
 * Decodes a raw message string into the extracted teaching location preference and original free-text message.
 */
export function decodeRequestMessage(rawMessage: string | null | undefined): {
  preference: TeachingLocationPreference | null
  message: string
} {
  if (!rawMessage) {
    return { preference: null, message: '' }
  }

  const match = rawMessage.match(METADATA_REGEX)
  if (!match) {
    return { preference: null, message: rawMessage }
  }

  const metadataContent = match[1]
  const cleanMessage = rawMessage.slice(match[0].length).trim()

  let preference: TeachingLocationPreference | null = null
  const lines = metadataContent.split(/\r?\n/)
  for (const line of lines) {
    const parts = line.split(':')
    if (parts.length >= 2 && parts[0].trim() === 'TEACHING_LOCATION') {
      const parsedVal = parts.slice(1).join(':').trim()
      if (isValidTeachingLocation(parsedVal)) {
        preference = parsedVal
      }
    }
  }

  return {
    preference,
    message: cleanMessage,
  }
}
