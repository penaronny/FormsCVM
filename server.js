// server.ts
import express from "express";
import cookieParser from "cookie-parser";
import path2 from "node:path";
import fs2 from "node:fs";
import { fileURLToPath } from "node:url";

// server/db.ts
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
var DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var DB_PATH = path.join(DATA_DIR, "forms.db");
var db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
function initDatabase() {
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
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount === 0) {
    seedInitialData();
  }
}
function seedInitialData() {
  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync("Empresa2026!", 10);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, "Administrador Corporativo", "admin@empresa.com", passwordHash, now);
  const form1Id = crypto.randomUUID();
  const form1Slug = "req-" + crypto.randomBytes(6).toString("hex");
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form1Id,
    userId,
    "Solicitud de Equipamiento y Accesos IT",
    "Formulario interno para solicitar computadoras, perif\xE9ricos y permisos a los sistemas corporativos.",
    form1Slug,
    now,
    now
  );
  const field1_1 = crypto.randomUUID();
  const field1_2 = crypto.randomUUID();
  const field1_3 = crypto.randomUUID();
  const field1_4 = crypto.randomUUID();
  const field1_5 = crypto.randomUUID();
  const insertField = db.prepare(`
    INSERT INTO fields (id, form_id, label, type, is_required, options, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertField.run(field1_1, form1Id, "Nombre completo del colaborador", "text", 1, "[]", 0);
  insertField.run(field1_2, form1Id, "Correo corporativo", "email", 1, "[]", 1);
  insertField.run(
    field1_3,
    form1Id,
    "Departamento",
    "select",
    1,
    JSON.stringify(["Operaciones", "Recursos Humanos", "Finanzas", "Tecnolog\xEDa", "Log\xEDstica", "Comercial"]),
    2
  );
  insertField.run(field1_4, form1Id, "Fecha de ingreso o requerimiento", "date", 1, "[]", 3);
  insertField.run(
    field1_5,
    form1Id,
    "Detalle de equipos o accesos necesarios",
    "textarea",
    1,
    "[]",
    4
  );
  const resp1Id = crypto.randomUUID();
  const resp1Date = new Date(Date.now() - 864e5 * 2).toISOString();
  db.prepare(`INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)`).run(resp1Id, form1Id, resp1Date);
  const insertAnswer = db.prepare(`INSERT INTO answers (id, response_id, field_id, value) VALUES (?, ?, ?, ?)`);
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_1, "Carlos Mendoza");
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_2, "cmendoza@empresa.com");
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_3, "Tecnolog\xEDa");
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_4, "2026-11-01");
  insertAnswer.run(crypto.randomUUID(), resp1Id, field1_5, 'Laptop Dell Latitude 16GB RAM + Monitor 27" y acceso a repositorio Git.');
  const resp2Id = crypto.randomUUID();
  const resp2Date = new Date(Date.now() - 864e5).toISOString();
  db.prepare(`INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)`).run(resp2Id, form1Id, resp2Date);
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_1, "Luc\xEDa Valenzuela");
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_2, "lvalenzuela@empresa.com");
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_3, "Recursos Humanos");
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_4, "2026-10-25");
  insertAnswer.run(crypto.randomUUID(), resp2Id, field1_5, "Rat\xF3n ergon\xF3mico, teclado inal\xE1mbrico y licencia ERP RRHH.");
  const form2Id = crypto.randomUUID();
  const form2Slug = "enc-" + crypto.randomBytes(6).toString("hex");
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form2Id,
    userId,
    "Encuesta Trimestral de Clima y Bienestar",
    "Espacio confidencial para recolectar opiniones sobre el ambiente de trabajo y sugerencias de mejora.",
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
    "Nivel de satisfacci\xF3n general con tu equipo",
    "select",
    1,
    JSON.stringify(["1 - Muy insatisfecho", "2 - Insatisfecho", "3 - Neutral", "4 - Satisfecho", "5 - Muy satisfecho"]),
    0
  );
  insertField.run(field2_2, form2Id, "Horas promedio semanales dedicadas a reuniones", "number", 0, "[]", 1);
  insertField.run(field2_3, form2Id, "\xBFQu\xE9 iniciativa o cambio mejorar\xEDa tu d\xEDa a d\xEDa laboral?", "textarea", 0, "[]", 2);
}

// server/routes/auth.ts
import { Router } from "express";
import bcrypt2 from "bcryptjs";
import crypto2 from "node:crypto";

// server/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "formapulse-enterprise-secret-key-2026";
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  let token = req.cookies?.auth_token;
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ error: "No autenticado. Por favor inicia sesi\xF3n." });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Sesi\xF3n inv\xE1lida o expirada." });
  }
  const userInDb = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(user.id);
  if (!userInDb) {
    return res.status(401).json({ error: "Usuario no encontrado." });
  }
  req.user = userInDb;
  next();
}

// server/routes/auth.ts
var authRouter = Router();
authRouter.post("/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Ingresa un correo electr\xF3nico corporativo v\xE1lido." });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "La contrase\xF1a debe tener al menos 8 caracteres." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: "El correo electr\xF3nico ya se encuentra registrado." });
    }
    const id = crypto2.randomUUID();
    const passwordHash = bcrypt2.hashSync(password, 10);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name.trim(), normalizedEmail, passwordHash, createdAt);
    const user = { id, name: name.trim(), email: normalizedEmail };
    const token = generateToken(user);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("Error en register:", err);
    return res.status(500).json({ error: "Error interno al registrar el usuario." });
  }
});
authRouter.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Correo y contrase\xF1a requeridos." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?").get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inv\xE1lidas. Verifica tu correo o reg\xEDstrate." });
    }
    const validPassword = bcrypt2.compareSync(String(password), user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inv\xE1lidas. Verifica tu contrase\xF1a." });
    }
    const authUser = { id: user.id, name: user.name, email: user.email };
    const token = generateToken(authUser);
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    return res.json({ user: authUser, token });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error interno al iniciar sesi\xF3n." });
  }
});
authRouter.post("/logout", (_req, res) => {
  res.clearCookie("auth_token");
  return res.json({ message: "Sesi\xF3n cerrada exitosamente." });
});
authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

// server/routes/forms.ts
import { Router as Router2 } from "express";
import crypto3 from "node:crypto";
var formsRouter = Router2();
formsRouter.use(requireAuth);
function generateUniqueSlug() {
  let slug = "";
  let exists = true;
  while (exists) {
    slug = "f-" + crypto3.randomBytes(6).toString("hex");
    const row = db.prepare("SELECT id FROM forms WHERE slug = ?").get(slug);
    if (!row) {
      exists = false;
    }
  }
  return slug;
}
formsRouter.get("/", (req, res) => {
  try {
    const userId = req.user.id;
    const forms = db.prepare(`
      SELECT 
        f.id,
        f.title,
        f.description,
        f.slug,
        f.is_active,
        f.created_at,
        f.updated_at,
        (SELECT COUNT(*) FROM fields WHERE form_id = f.id) as field_count,
        (SELECT COUNT(*) FROM responses WHERE form_id = f.id) as response_count
      FROM forms f
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);
    const formatted = forms.map((f) => ({
      ...f,
      is_active: Boolean(f.is_active)
    }));
    return res.json({ forms: formatted });
  } catch (err) {
    console.error("Error al listar formularios:", err);
    return res.status(500).json({ error: "Error al obtener formularios." });
  }
});
formsRouter.get("/:id", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const form = db.prepare(`
      SELECT id, user_id, title, description, slug, is_active, created_at, updated_at
      FROM forms
      WHERE id = ? AND user_id = ?
    `).get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado o no tienes permisos para acceder." });
    }
    const fields = db.prepare(`
      SELECT id, form_id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id);
    const formattedFields = fields.map((f) => {
      let optionsList = [];
      try {
        optionsList = JSON.parse(f.options || "[]");
      } catch {
        optionsList = [];
      }
      return {
        ...f,
        is_required: Boolean(f.is_required),
        options: optionsList
      };
    });
    return res.json({
      form: {
        ...form,
        is_active: Boolean(form.is_active),
        fields: formattedFields
      }
    });
  } catch (err) {
    console.error("Error al obtener formulario:", err);
    return res.status(500).json({ error: "Error al obtener el formulario." });
  }
});
formsRouter.post("/", (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, fields } = req.body;
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "El t\xEDtulo del formulario es obligatorio." });
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "Un formulario debe tener al menos un campo para poder guardarse." });
    }
    const validTypes = ["text", "textarea", "email", "number", "date", "select"];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label || typeof f.label !== "string" || f.label.trim().length === 0) {
        return res.status(400).json({ error: `La etiqueta del campo #${i + 1} no puede estar vac\xEDa.` });
      }
      if (!validTypes.includes(f.type)) {
        return res.status(400).json({ error: `El tipo de campo "${f.type}" no es v\xE1lido.` });
      }
      if (f.type === "select") {
        const opts = Array.isArray(f.options) ? f.options : [];
        if (opts.length === 0) {
          return res.status(400).json({ error: `El campo "${f.label}" requiere al menos una opci\xF3n disponible.` });
        }
      }
    }
    const formId = crypto3.randomUUID();
    const slug = generateUniqueSlug();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(formId, userId, title.trim(), (description || "").trim(), slug, now, now);
    const insertField = db.prepare(`
      INSERT INTO fields (id, form_id, label, type, is_required, options, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const fieldId = crypto3.randomUUID();
      const opts = Array.isArray(f.options) ? JSON.stringify(f.options) : "[]";
      insertField.run(
        fieldId,
        formId,
        f.label.trim(),
        f.type,
        f.is_required ? 1 : 0,
        opts,
        i
      );
    }
    return res.status(201).json({
      message: "Formulario creado exitosamente.",
      formId,
      slug
    });
  } catch (err) {
    console.error("Error al crear formulario:", err);
    return res.status(500).json({ error: "Error interno al guardar el formulario." });
  }
});
formsRouter.put("/:id", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, fields, is_active } = req.body;
    const existing = db.prepare("SELECT id FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: "Formulario no encontrado o sin permisos de edici\xF3n." });
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "El t\xEDtulo del formulario es obligatorio." });
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: "El formulario debe contener al menos un campo." });
    }
    const validTypes = ["text", "textarea", "email", "number", "date", "select"];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.label || typeof f.label !== "string" || f.label.trim().length === 0) {
        return res.status(400).json({ error: `La etiqueta del campo #${i + 1} no puede estar vac\xEDa.` });
      }
      if (!validTypes.includes(f.type)) {
        return res.status(400).json({ error: `El tipo de campo "${f.type}" no es v\xE1lido.` });
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const activeVal = is_active !== void 0 ? is_active ? 1 : 0 : 1;
    db.prepare(`
      UPDATE forms
      SET title = ?, description = ?, is_active = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(title.trim(), (description || "").trim(), activeVal, now, id, userId);
    const currentFields = db.prepare("SELECT id FROM fields WHERE form_id = ?").all(id);
    const currentFieldIds = new Set(currentFields.map((cf) => cf.id));
    const newFieldIds = /* @__PURE__ */ new Set();
    const updateFieldStmt = db.prepare(`
      UPDATE fields
      SET label = ?, type = ?, is_required = ?, options = ?, position = ?
      WHERE id = ? AND form_id = ?
    `);
    const insertFieldStmt = db.prepare(`
      INSERT INTO fields (id, form_id, label, type, is_required, options, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const opts = Array.isArray(f.options) ? JSON.stringify(f.options) : "[]";
      const reqVal = f.is_required ? 1 : 0;
      if (f.id && currentFieldIds.has(f.id)) {
        newFieldIds.add(f.id);
        updateFieldStmt.run(f.label.trim(), f.type, reqVal, opts, i, f.id, id);
      } else {
        const fieldId = crypto3.randomUUID();
        newFieldIds.add(fieldId);
        insertFieldStmt.run(fieldId, id, f.label.trim(), f.type, reqVal, opts, i);
      }
    }
    for (const cf of currentFields) {
      if (!newFieldIds.has(cf.id)) {
        db.prepare("DELETE FROM fields WHERE id = ?").run(cf.id);
      }
    }
    return res.json({ message: "Formulario actualizado correctamente." });
  } catch (err) {
    console.error("Error al actualizar formulario:", err);
    return res.status(500).json({ error: "Error al actualizar el formulario." });
  }
});
formsRouter.patch("/:id/status", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_active } = req.body;
    const form = db.prepare("SELECT id, is_active FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado." });
    }
    const newActiveState = is_active !== void 0 ? is_active ? 1 : 0 : form.is_active ? 0 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare("UPDATE forms SET is_active = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(newActiveState, now, id, userId);
    return res.json({
      message: `Formulario ${newActiveState ? "activado" : "desactivado"} con \xE9xito.`,
      is_active: Boolean(newActiveState)
    });
  } catch (err) {
    console.error("Error al cambiar estado del formulario:", err);
    return res.status(500).json({ error: "Error al cambiar estado del formulario." });
  }
});
formsRouter.delete("/:id", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const form = db.prepare("SELECT id FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado." });
    }
    db.prepare("DELETE FROM forms WHERE id = ? AND user_id = ?").run(id, userId);
    return res.json({ message: "Formulario y respuestas eliminados exitosamente." });
  } catch (err) {
    console.error("Error al eliminar formulario:", err);
    return res.status(500).json({ error: "Error al eliminar el formulario." });
  }
});

// server/routes/public.ts
import { Router as Router3 } from "express";
import crypto4 from "node:crypto";
var publicRouter = Router3();
publicRouter.get("/forms/:slug", (req, res) => {
  try {
    const { slug } = req.params;
    const form = db.prepare(`
      SELECT id, title, description, slug, is_active
      FROM forms
      WHERE slug = ?
    `).get(slug);
    if (!form) {
      return res.status(404).json({ error: "El formulario solicitado no existe o el enlace es incorrecto." });
    }
    if (!Boolean(form.is_active)) {
      return res.json({
        form: {
          id: form.id,
          title: form.title,
          description: form.description,
          slug: form.slug,
          is_active: false,
          fields: []
        }
      });
    }
    const fields = db.prepare(`
      SELECT id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(form.id);
    const formattedFields = fields.map((f) => {
      let optionsList = [];
      try {
        optionsList = JSON.parse(f.options || "[]");
      } catch {
        optionsList = [];
      }
      return {
        id: f.id,
        label: f.label,
        type: f.type,
        is_required: Boolean(f.is_required),
        options: optionsList,
        position: f.position
      };
    });
    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        is_active: true,
        fields: formattedFields
      }
    });
  } catch (err) {
    console.error("Error al obtener formulario p\xFAblico:", err);
    return res.status(500).json({ error: "Error al cargar el formulario." });
  }
});
publicRouter.post("/forms/:slug/submit", (req, res) => {
  try {
    const { slug } = req.params;
    const { answers } = req.body;
    const form = db.prepare("SELECT id, is_active FROM forms WHERE slug = ?").get(slug);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado." });
    }
    if (!Boolean(form.is_active)) {
      return res.status(400).json({ error: "Este formulario no est\xE1 aceptando respuestas actualmente." });
    }
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Los datos de la respuesta son inv\xE1lidos." });
    }
    const fields = db.prepare(`
      SELECT id, label, type, is_required, options
      FROM fields
      WHERE form_id = ?
    `).all(form.id);
    for (const field of fields) {
      const val = answers[field.id];
      const isPresent = val !== void 0 && val !== null && String(val).trim() !== "";
      if (Boolean(field.is_required) && !isPresent) {
        return res.status(400).json({
          error: `El campo "${field.label}" es obligatorio.`
        });
      }
      if (isPresent) {
        const strVal = String(val).trim();
        if (field.type === "email") {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            return res.status(400).json({
              error: `El valor proporcionado en "${field.label}" no es un correo electr\xF3nico v\xE1lido.`
            });
          }
        }
        if (field.type === "number") {
          if (isNaN(Number(strVal))) {
            return res.status(400).json({
              error: `El valor proporcionado en "${field.label}" debe ser un n\xFAmero v\xE1lido.`
            });
          }
        }
        if (field.type === "date") {
          if (isNaN(Date.parse(strVal))) {
            return res.status(400).json({
              error: `La fecha proporcionada en "${field.label}" no es v\xE1lida.`
            });
          }
        }
        if (field.type === "select") {
          let opts = [];
          try {
            opts = JSON.parse(field.options || "[]");
          } catch {
            opts = [];
          }
          if (opts.length > 0 && !opts.includes(strVal)) {
            return res.status(400).json({
              error: `La opci\xF3n seleccionada en "${field.label}" no es v\xE1lida.`
            });
          }
        }
      }
    }
    const responseId = crypto4.randomUUID();
    const submittedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO responses (id, form_id, submitted_at)
      VALUES (?, ?, ?)
    `).run(responseId, form.id, submittedAt);
    const insertAnswer = db.prepare(`
      INSERT INTO answers (id, response_id, field_id, value)
      VALUES (?, ?, ?, ?)
    `);
    for (const field of fields) {
      const val = answers[field.id];
      const answerVal = val !== void 0 && val !== null ? String(val).trim() : "";
      const answerId = crypto4.randomUUID();
      insertAnswer.run(answerId, responseId, field.id, answerVal);
    }
    return res.status(201).json({
      success: true,
      message: "\xA1Gracias por tu respuesta! Ha sido registrada exitosamente."
    });
  } catch (err) {
    console.error("Error al enviar respuesta de formulario:", err);
    return res.status(500).json({ error: "Error interno al procesar el env\xEDo del formulario." });
  }
});

// server/routes/responses.ts
import { Router as Router4 } from "express";
var responsesRouter = Router4();
responsesRouter.use(requireAuth);
responsesRouter.get("/:id/responses", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { search, from, to } = req.query;
    const form = db.prepare("SELECT id, title, description, slug, is_active FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado o no tienes permisos para ver sus respuestas." });
    }
    const fields = db.prepare(`
      SELECT id, label, type, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id);
    let query = `
      SELECT r.id, r.submitted_at
      FROM responses r
      WHERE r.form_id = ?
    `;
    const params = [id];
    if (from && typeof from === "string") {
      query += ` AND date(r.submitted_at) >= date(?)`;
      params.push(from);
    }
    if (to && typeof to === "string") {
      query += ` AND date(r.submitted_at) <= date(?)`;
      params.push(to);
    }
    query += ` ORDER BY r.submitted_at DESC`;
    const responsesRows = db.prepare(query).all(...params);
    const responseIds = responsesRows.map((r) => r.id);
    let answersByResponse = {};
    if (responseIds.length > 0) {
      const answers = db.prepare(`
        SELECT a.response_id, a.field_id, a.value
        FROM answers a
        JOIN responses r ON a.response_id = r.id
        WHERE r.form_id = ?
      `).all(id);
      for (const ans of answers) {
        if (!answersByResponse[ans.response_id]) {
          answersByResponse[ans.response_id] = {};
        }
        answersByResponse[ans.response_id][ans.field_id] = ans.value;
      }
    }
    let list = responsesRows.map((r) => ({
      id: r.id,
      submitted_at: r.submitted_at,
      answers: answersByResponse[r.id] || {}
    }));
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim().toLowerCase();
      list = list.filter((item) => {
        if (item.submitted_at.toLowerCase().includes(term)) return true;
        for (const fieldId in item.answers) {
          const val = String(item.answers[fieldId] || "").toLowerCase();
          if (val.includes(term)) return true;
        }
        return false;
      });
    }
    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        is_active: Boolean(form.is_active)
      },
      fields,
      total: list.length,
      responses: list
    });
  } catch (err) {
    console.error("Error al obtener respuestas:", err);
    return res.status(500).json({ error: "Error al consultar respuestas." });
  }
});
responsesRouter.get("/:id/responses/export", (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const form = db.prepare("SELECT id, title FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado." });
    }
    const fields = db.prepare("SELECT id, label FROM fields WHERE form_id = ? ORDER BY position ASC").all(id);
    const responses = db.prepare("SELECT id, submitted_at FROM responses WHERE form_id = ? ORDER BY submitted_at DESC").all(id);
    const answers = db.prepare(`
      SELECT a.response_id, a.field_id, a.value
      FROM answers a
      JOIN responses r ON a.response_id = r.id
      WHERE r.form_id = ?
    `).all(id);
    const answerMap = {};
    for (const ans of answers) {
      if (!answerMap[ans.response_id]) {
        answerMap[ans.response_id] = {};
      }
      answerMap[ans.response_id][ans.field_id] = ans.value;
    }
    const headers = ["ID Respuesta", "Fecha de Env\xEDo", ...fields.map((f) => `"${f.label.replace(/"/g, '""')}"`)];
    const rows = [headers.join(",")];
    for (const r of responses) {
      const row = [
        `"${r.id}"`,
        `"${r.submitted_at}"`,
        ...fields.map((f) => {
          const val = answerMap[r.id]?.[f.id] || "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
      ];
      rows.push(row.join(","));
    }
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const safeTitle = form.title.replace(/[^a-zA-Z0-9_\-]/g, "_").substring(0, 30);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="respuestas_${safeTitle}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    console.error("Error al exportar respuestas:", err);
    return res.status(500).json({ error: "Error al exportar respuestas." });
  }
});
responsesRouter.delete("/:id/responses/:responseId", (req, res) => {
  try {
    const userId = req.user.id;
    const { id, responseId } = req.params;
    const form = db.prepare("SELECT id FROM forms WHERE id = ? AND user_id = ?").get(id, userId);
    if (!form) {
      return res.status(404).json({ error: "Formulario no encontrado." });
    }
    db.prepare("DELETE FROM responses WHERE id = ? AND form_id = ?").run(responseId, id);
    return res.json({ message: "Respuesta eliminada correctamente." });
  } catch (err) {
    console.error("Error al eliminar respuesta:", err);
    return res.status(500).json({ error: "Error al eliminar respuesta." });
  }
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var isProduction = process.env.NODE_ENV === "production";
var PORT = isProduction ? Number(process.env.PORT) || 3e3 : 3e3;
async function startServer() {
  initDatabase();
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/forms", formsRouter);
  app.use("/api/forms", responsesRouter);
  app.use("/api/public", publicRouter);
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs2.readFileSync(path2.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FormaPulse Server] corriendo en http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Error fatal al iniciar servidor:", err);
  process.exit(1);
});
