import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { generateToken, requireAuth, AuthRequest } from '../auth.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ingresa un correo electrónico corporativo válido.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), normalizedEmail, passwordHash, createdAt);

    const user = { id, name: name.trim(), email: normalizedEmail };
    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('Error en register:', err);
    return res.status(500).json({ error: 'Error interno al registrar el usuario.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(normalizedEmail) as {
      id: string;
      name: string;
      email: string;
      password_hash: string;
    } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo o regístrate.' });
    }

    const validPassword = bcrypt.compareSync(String(password), user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu contraseña.' });
    }

    const authUser = { id: user.id, name: user.name, email: user.email };
    const token = generateToken(authUser);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ user: authUser, token });
  } catch (err: any) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  return res.json({ message: 'Sesión cerrada exitosamente.' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});
