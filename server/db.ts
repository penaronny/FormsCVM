import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'forms.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL and foreign key cascade
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      slug TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      is_required INTEGER DEFAULT 0,
      options TEXT DEFAULT '[]',
      position INTEGER DEFAULT 0,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      value TEXT DEFAULT '',
      FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
      FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
    );
  `);

  // Check if we need to seed initial demo user and form
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    seedInitialData();
  }
}

function seedInitialData() {
  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync('Empresa2026!', 10);
  const now = new Date().toISOString();

  // Create default corporate admin
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, 'Administrador Corporativo', 'admin@empresa.com', passwordHash, now);

  // Create demo Form 1: IT Equipment & Access Request
  const form1Id = crypto.randomUUID();
  const form1Slug = 'req-' + crypto.randomBytes(6).toString('hex');
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form1Id,
    userId,
    'Solicitud de Equipamiento y Accesos IT',
    'Formulario interno para solicitar computadoras, periféricos y permisos a los sistemas corporativos.',
    form1Slug,
    now,
    now
  );

  // Fields for Form 1
  const field1_1 = crypto.randomUUID();
  const field1_2 = crypto.randomUUID();
  const field1_3 = crypto.randomUUID();
  const field1_4 = crypto.randomUUID();
  const field1_5 = crypto.randomUUID();

  const insertField = db.prepare(`
    INSERT INTO fields (id, form_id, label, type, is_required, options, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertField.run(field1_1, form1Id, 'Nombre completo del colaborador', 'text', 1, '[]', 0);
  insertField.run(field1_2, form1Id, 'Correo corporativo', 'email', 1, '[]', 1);
  insertField.run(
    field1_3,
    form1Id,
    'Departamento',
    'select',
    1,
    JSON.stringify(['Operaciones', 'Recursos Humanos', 'Finanzas', 'Tecnología', 'Logística', 'Comercial']),
    2
  );
  insertField.run(field1_4, form1Id, 'Fecha de ingreso o requerimiento', 'date', 1, '[]', 3);
  insertField.run(
    field1_5,
    form1Id,
    'Detalle de equipos o accesos necesarios',
    'textarea',
    1,
    '[]',
    4
  );

  // Seed 2 initial responses for Form 1
  const resp1Id = crypto.randomUUID();
  const resp1Date = new Date(Date.now() - 86400000 * 2).toISOString();
  db.prepare(`INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)`).run(resp1Id, form1Id, resp1Date);

  const insertAnswer = db.prepare(`INSERT INTO answers (id, response_id, field_id, value) VALUES (?, ?, ?, ?)`);
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_1, 'Carlos Mendoza');
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_2, 'cmendoza@empresa.com');
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_3, 'Tecnología');
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_4, '2026-11-01');
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_5, 'Laptop Dell Latitude 16GB RAM + Monitor 27" y acceso a repositorio Git.');

  const resp2Id = crypto.randomUUID();
  const resp2Date = new Date(Date.now() - 86400000).toISOString();
  db.prepare(`INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)`).run(resp2Id, form1Id, resp2Date);
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_1, 'Lucía Valenzuela');
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_2, 'lvalenzuela@empresa.com');
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_3, 'Recursos Humanos');
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_4, '2026-10-25');
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_5, 'Ratón ergonómico, teclado inalámbrico y licencia ERP RRHH.');

  // Create demo Form 2: Encuesta de Clima Laboral
  const form2Id = crypto.randomUUID();
  const form2Slug = 'enc-' + crypto.randomBytes(6).toString('hex');
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form2Id,
    userId,
    'Encuesta Trimestral de Clima y Bienestar',
    'Espacio confidencial para recolectar opiniones sobre el ambiente de trabajo y sugerencias de mejora.',
    form2Slug,
    now,
    now
  );

  const field2_1 = crypto.randomUUID();
  const field2_2 = crypto.randomUUID();
  const field2_3 = crypto.randomUUID();

  insertField.run(
    field2_1,
    form2Id,
    'Nivel de satisfacción general con tu equipo',
    'select',
    1,
    JSON.stringify(['1 - Muy insatisfecho', '2 - Insatisfecho', '3 - Neutral', '4 - Satisfecho', '5 - Muy satisfecho']),
    0
  );
  insertField.run(field2_2, form2Id, 'Horas promedio semanales dedicadas a reuniones', 'number', 0, '[]', 1);
  insertField.run(field2_3, form2Id, '¿Qué iniciativa o cambio mejoraría tu día a día laboral?', 'textarea', 0, '[]', 2);
}
