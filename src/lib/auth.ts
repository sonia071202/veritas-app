import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'veritas-super-secret-jwt-token-key-2026-secure-hash-security';
const encodedSecret = new TextEncoder().encode(SECRET_KEY);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

/**
 * Sign user details into a JWT token
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedSecret);
}

/**
 * Verify JWT token signature and return payload details
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare plain text password to stored hash
 */
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
