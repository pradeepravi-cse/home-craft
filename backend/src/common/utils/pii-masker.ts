/**
 * Fields that are always treated as PII and masked in logs and the audit_logs table.
 *
 * Rule: direct personal identifiers (contact info, auth secrets, free-text notes).
 * Business entity names (product, service, material) are NOT in this list because
 * they are not personal data.
 */
const PII_FIELDS = new Set([
  // Contact info
  'email',
  'phone',
  'phoneNumber',
  'mobile',
  'contactNumber',
  // Social handles
  'instagram',
  'twitter',
  'facebook',
  'socialHandle',
  'handle',
  // Auth / secrets — always redact
  'password',
  'passwordHash',
  'hashedPassword',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'privateKey',
  // Payment
  'cardNumber',
  'maskedNumber',
  'cvv',
  'ssn',
  'taxId',
  // Platform-specific identifiers
  'identifier', // UPI ID
  // Free-text — could contain anything a user typed
  'notes',
  'comment',
  'comments',
  'remarks',
  'bio',
]);

/**
 * Recursively walk an object/array and replace PII field values with '[REDACTED]'.
 * Safe to call on TypeORM entities; ignores non-plain-object values.
 */
export function maskPii<T>(value: T, depth = 0): T {
  if (depth > 6 || value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => maskPii(item, depth + 1)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = PII_FIELDS.has(key) ? '[REDACTED]' : maskPii(val, depth + 1);
  }
  return result as T;
}
