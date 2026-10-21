import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'formapulse-enterprise-secret-key-2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.auth_token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'No autenticado. Por favor inicia sesión.' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }

  // Verify user still exists in database
  const userInDb = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user.id) as AuthUser | undefined;
  if (!userInDb) {
    return res.status(401).json({ error: 'Usuario no encontrado.' });
  }

  req.user = userInDb;
  next();
}
