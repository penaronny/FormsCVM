import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

export const formsRouter = Router();

formsRouter.use(requireAuth);

interface FieldInput {
  id?: string;
  label: string;
  type: string;
  is_required?: boolean | number;
  options?: string[] | string;
  position?: number;
}

// Helper to generate unique slug
function generateUniqueSlug(): string {
  let slug = '';
  let exists = true;
  while (exists) {
    slug = 'f-' + crypto.randomBytes(6).toString('hex');
    const row = db.prepare('SELECT id FROM forms WHERE slug = ?').get(slug);
    if (!row) {
      exists = false;
    }
  }
  return slug;
}

// GET /api/forms - List all forms for current user with statistics
formsRouter.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
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
    `).all(userId) as any[];

    // Format boolean
    const formatted = forms.map(f => ({
      ...f,
      is_active: Boolean(f.is_active)
    }));

    return res.json({ forms: formatted });
  } catch (err: any) {
    console.error('Error al listar formularios:', err);
    return res.status(500).json({ error: 'Error al obtener formularios.' });
  }
});

// GET /api/forms/:id - Get a specific form with all its fields
formsRouter.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const form = db.prepare(`
      SELECT id, user_id, title, description, slug, is_active, created_at, updated_at
      FROM forms
      WHERE id = ? AND user_id = ?
    `).get(id, userId) as any;

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permisos para acceder.' });
    }

    const fields = db.prepare(`
      SELECT id, form_id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id) as any[];

    const formattedFields = fields.map(f => {
      let optionsList: string[] = [];
      try {
        optionsList = JSON.parse(f.options || '[]');
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
  } catch (err: any) {
    console.error('Error al obtener formulario:', err);
    return res.status(500).json({ error: 'Error al obtener el formulario.' });
  }
});

// POST /api/forms - Create a new form
formsRouter.post('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, fields } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'El título del formulario es obligatorio.' });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'Un formulario debe tener al menos un campo para poder guardarse.' });
    }

    const validTypes = ['text', 'textarea', 'email', 'number', 'date', 'select'];

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const f: FieldInput = fields[i];
      if (!f.label || typeof f.label !== 'string' || f.label.trim().length === 0) {
        return res.status(400).json({ error: `La etiqueta del campo #${i + 1} no puede estar vacía.` });
      }
      if (!validTypes.includes(f.type)) {
        return res.status(400).json({ error: `El tipo de campo "${f.type}" no es válido.` });
      }
      if (f.type === 'select') {
        const opts = Array.isArray(f.options) ? f.options : [];
        if (opts.length === 0) {
          return res.status(400).json({ error: `El campo "${f.label}" requiere al menos una opción disponible.` });
        }
      }
    }

    const formId = crypto.randomUUID();
    const slug = generateUniqueSlug();
    const now = new Date().toISOString();

    // Insert form
    db.prepare(`
      INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(formId, userId, title.trim(), (description || '').trim(), slug, now, now);

    // Insert fields
    const insertField = db.prepare(`
      INSERT INTO fields (id, form_id, label, type, is_required, options, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < fields.length; i++) {
      const f: FieldInput = fields[i];
      const fieldId = crypto.randomUUID();
      const opts = Array.isArray(f.options) ? JSON.stringify(f.options) : '[]';
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
      message: 'Formulario creado exitosamente.',
      formId,
      slug
    });
  } catch (err: any) {
    console.error('Error al crear formulario:', err);
    return res.status(500).json({ error: 'Error interno al guardar el formulario.' });
  }
});

// PUT /api/forms/:id - Update an existing form
formsRouter.put('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, fields, is_active } = req.body;

    const existing = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Formulario no encontrado o sin permisos de edición.' });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'El título del formulario es obligatorio.' });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'El formulario debe contener al menos un campo.' });
    }

    const validTypes = ['text', 'textarea', 'email', 'number', 'date', 'select'];
    for (let i = 0; i < fields.length; i++) {
      const f: FieldInput = fields[i];
      if (!f.label || typeof f.label !== 'string' || f.label.trim().length === 0) {
        return res.status(400).json({ error: `La etiqueta del campo #${i + 1} no puede estar vacía.` });
      }
      if (!validTypes.includes(f.type)) {
        return res.status(400).json({ error: `El tipo de campo "${f.type}" no es válido.` });
      }
    }

    const now = new Date().toISOString();
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    db.prepare(`
      UPDATE forms
      SET title = ?, description = ?, is_active = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(title.trim(), (description || '').trim(), activeVal, now, id, userId);

    // Update fields: we can preserve existing field IDs if sent to retain answer references, or insert new
    // First retrieve current fields
    const currentFields = db.prepare('SELECT id FROM fields WHERE form_id = ?').all(id) as { id: string }[];
    const currentFieldIds = new Set(currentFields.map(cf => cf.id));
    const newFieldIds = new Set<string>();

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
      const f: FieldInput = fields[i];
      const opts = Array.isArray(f.options) ? JSON.stringify(f.options) : '[]';
      const reqVal = f.is_required ? 1 : 0;

      if (f.id && currentFieldIds.has(f.id)) {
        newFieldIds.add(f.id);
        updateFieldStmt.run(f.label.trim(), f.type, reqVal, opts, i, f.id, id);
      } else {
        const fieldId = crypto.randomUUID();
        newFieldIds.add(fieldId);
        insertFieldStmt.run(fieldId, id, f.label.trim(), f.type, reqVal, opts, i);
      }
    }

    // Delete fields that were removed by the user in the editor
    for (const cf of currentFields) {
      if (!newFieldIds.has(cf.id)) {
        db.prepare('DELETE FROM fields WHERE id = ?').run(cf.id);
      }
    }

    return res.json({ message: 'Formulario actualizado correctamente.' });
  } catch (err: any) {
    console.error('Error al actualizar formulario:', err);
    return res.status(500).json({ error: 'Error al actualizar el formulario.' });
  }
});

// PATCH /api/forms/:id/status - Toggle active/inactive
formsRouter.patch('/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { is_active } = req.body;

    const form = db.prepare('SELECT id, is_active FROM forms WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado.' });
    }

    const newActiveState = is_active !== undefined ? (is_active ? 1 : 0) : (form.is_active ? 0 : 1);
    const now = new Date().toISOString();

    db.prepare('UPDATE forms SET is_active = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(newActiveState, now, id, userId);

    return res.json({
      message: `Formulario ${newActiveState ? 'activado' : 'desactivado'} con éxito.`,
      is_active: Boolean(newActiveState)
    });
  } catch (err: any) {
    console.error('Error al cambiar estado del formulario:', err);
    return res.status(500).json({ error: 'Error al cambiar estado del formulario.' });
  }
});

// DELETE /api/forms/:id - Delete a form with cascade
formsRouter.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(id, userId);
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado.' });
    }

    // Delete form (foreign key cascade removes fields, responses, answers)
    db.prepare('DELETE FROM forms WHERE id = ? AND user_id = ?').run(id, userId);

    return res.json({ message: 'Formulario y respuestas eliminados exitosamente.' });
  } catch (err: any) {
    console.error('Error al eliminar formulario:', err);
    return res.status(500).json({ error: 'Error al eliminar el formulario.' });
  }
});
