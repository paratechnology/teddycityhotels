import crypto from 'crypto';

export function genToken(): string {
  // 1. Use a strong random number generator (crypto.randomBytes)
  const buffer = crypto.randomBytes(4); // Generate 3 bytes (24 bits) for 6-digit base-10 token
  // 2. Convert to a 6-digit string in base 10, ensuring no leading zeros
  const number = buffer.readUInt32BE(0) % 1000000; // Read as unsigned 32-bit integer
  return number.toString().padStart(6, '0');
}
