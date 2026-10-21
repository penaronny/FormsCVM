import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db.js';

export const publicRouter = Router();

// GET /api/public/forms/:slug
publicRouter.get('/forms/:slug', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const form = db.prepare(`
      SELECT id, title, description, slug, is_active
      FROM forms
      WHERE slug = ?
    `).get(slug) as any;

    if (!form) {
      return res.status(404).json({ error: 'El formulario solicitado no existe o el enlace es incorrecto.' });
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
    `).all(form.id) as any[];

    const formattedFields = fields.map(f => {
      let optionsList: string[] = [];
      try {
        optionsList = JSON.parse(f.options || '[]');
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
  } catch (err: any) {
    console.error('Error al obtener formulario público:', err);
    return res.status(500).json({ error: 'Error al cargar el formulario.' });
  }
});

// POST /api/public/forms/:slug/submit
publicRouter.post('/forms/:slug/submit', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { answers } = req.body; // map of { [field_id]: value }

    const form = db.prepare('SELECT id, is_active FROM forms WHERE slug = ?').get(slug) as any;
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado.' });
    }

    if (!Boolean(form.is_active)) {
      return res.status(400).json({ error: 'Este formulario no está aceptando respuestas actualmente.' });
    }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Los datos de la respuesta son inválidos.' });
    }

    const fields = db.prepare(`
      SELECT id, label, type, is_required, options
      FROM fields
      WHERE form_id = ?
    `).all(form.id) as any[];

    // Validate answers according to field definitions
    for (const field of fields) {
      const val = answers[field.id];
      const isPresent = val !== undefined && val !== null && String(val).trim() !== '';

      if (Boolean(field.is_required) && !isPresent) {
        return res.status(400).json({
          error: `El campo "${field.label}" es obligatorio.`
        });
      }

      if (isPresent) {
        const strVal = String(val).trim();

        if (field.type === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            return res.status(400).json({
              error: `El valor proporcionado en "${field.label}" no es un correo electrónico válido.`
            });
          }
        }

        if (field.type === 'number') {
          if (isNaN(Number(strVal))) {
            return res.status(400).json({
              error: `El valor proporcionado en "${field.label}" debe ser un número válido.`
            });
          }
        }

        if (field.type === 'date') {
          if (isNaN(Date.parse(strVal))) {
            return res.status(400).json({
              error: `La fecha proporcionada en "${field.label}" no es válida.`
            });
          }
        }

        if (field.type === 'select') {
          let opts: string[] = [];
          try {
            opts = JSON.parse(field.options || '[]');
          } catch {
            opts = [];
          }
          if (opts.length > 0 && !opts.includes(strVal)) {
            return res.status(400).json({
              error: `La opción seleccionada en "${field.label}" no es válida.`
            });
          }
        }
      }
    }

    const responseId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    // Insert response
    db.prepare(`
      INSERT INTO responses (id, form_id, submitted_at)
      VALUES (?, ?, ?)
    `).run(responseId, form.id, submittedAt);

    // Insert answers
    const insertAnswer = db.prepare(`
      INSERT INTO answers (id, response_id, field_id, value)
      VALUES (?, ?, ?, ?)
    `);

    for (const field of fields) {
      const val = answers[field.id];
      const answerVal = val !== undefined && val !== null ? String(val).trim() : '';
      const answerId = crypto.randomUUID();
      insertAnswer.run(answerId, responseId, field.id, answerVal);
    }

    return res.status(201).json({
      success: true,
      message: '¡Gracias por tu respuesta! Ha sido registrada exitosamente.'
    });
  } catch (err: any) {
    console.error('Error al enviar respuesta de formulario:', err);
    return res.status(500).json({ error: 'Error interno al procesar el envío del formulario.' });
  }
});
