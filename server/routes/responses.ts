import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

export const responsesRouter = Router();

responsesRouter.use(requireAuth);

// GET /api/forms/:id/responses - Get responses for a specific form
responsesRouter.get('/:id/responses', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { search, from, to } = req.query;

    // Verify ownership
    const form = db.prepare('SELECT id, title, description, slug, is_active FROM forms WHERE id = ? AND user_id = ?')
      .get(id, userId) as any;

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permisos para ver sus respuestas.' });
    }

    // Get fields
    const fields = db.prepare(`
      SELECT id, label, type, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id) as any[];

    // Build query for responses
    let query = `
      SELECT r.id, r.submitted_at
      FROM responses r
      WHERE r.form_id = ?
    `;
    const params: any[] = [id];

    if (from && typeof from === 'string') {
      query += ` AND date(r.submitted_at) >= date(?)`;
      params.push(from);
    }

    if (to && typeof to === 'string') {
      query += ` AND date(r.submitted_at) <= date(?)`;
      params.push(to);
    }

    query += ` ORDER BY r.submitted_at DESC`;

    const responsesRows = db.prepare(query).all(...params) as any[];

    // Fetch all answers for these responses
    const responseIds = responsesRows.map(r => r.id);
    let answersByResponse: Record<string, Record<string, string>> = {};

    if (responseIds.length > 0) {
      // In SQLite, we can query answers for this form
      const answers = db.prepare(`
        SELECT a.response_id, a.field_id, a.value
        FROM answers a
        JOIN responses r ON a.response_id = r.id
        WHERE r.form_id = ?
      `).all(id) as any[];

      for (const ans of answers) {
        if (!answersByResponse[ans.response_id]) {
          answersByResponse[ans.response_id] = {};
        }
        answersByResponse[ans.response_id][ans.field_id] = ans.value;
      }
    }

    // Assemble responses
    let list = responsesRows.map(r => ({
      id: r.id,
      submitted_at: r.submitted_at,
      answers: answersByResponse[r.id] || {}
    }));

    // Text search filter if present
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      list = list.filter(item => {
        // Search in submitted date or any answer value
        if (item.submitted_at.toLowerCase().includes(term)) return true;
        for (const fieldId in item.answers) {
          const val = String(item.answers[fieldId] || '').toLowerCase();
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
  } catch (err: any) {
    console.error('Error al obtener respuestas:', err);
    return res.status(500).json({ error: 'Error al consultar respuestas.' });
  }
});

// GET /api/forms/:id/responses/export - Export responses as CSV
responsesRouter.get('/:id/responses/export', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const form = db.prepare('SELECT id, title FROM forms WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado.' });
    }

    const fields = db.prepare('SELECT id, label FROM fields WHERE form_id = ? ORDER BY position ASC').all(id) as any[];
    const responses = db.prepare('SELECT id, submitted_at FROM responses WHERE form_id = ? ORDER BY submitted_at DESC').all(id) as any[];

    const answers = db.prepare(`
      SELECT a.response_id, a.field_id, a.value
      FROM answers a
      JOIN responses r ON a.response_id = r.id
      WHERE r.form_id = ?
    `).all(id) as any[];

    const answerMap: Record<string, Record<string, string>> = {};
    for (const ans of answers) {
      if (!answerMap[ans.response_id]) {
        answerMap[ans.response_id] = {};
      }
      answerMap[ans.response_id][ans.field_id] = ans.value;
    }

    // Build CSV
    const headers = ['ID Respuesta', 'Fecha de Envío', ...fields.map(f => `"${f.label.replace(/"/g, '""')}"`)];
    const rows = [headers.join(',')];

    for (const r of responses) {
      const row = [
        `"${r.id}"`,
        `"${r.submitted_at}"`,
        ...fields.map(f => {
          const val = answerMap[r.id]?.[f.id] || '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
      ];
      rows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + rows.join('\r\n'); // Add BOM for Excel UTF-8 compatibility
    const safeTitle = form.title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="respuestas_${safeTitle}.csv"`);
    return res.send(csvContent);
  } catch (err: any) {
    console.error('Error al exportar respuestas:', err);
    return res.status(500).json({ error: 'Error al exportar respuestas.' });
  }
});

// DELETE /api/forms/:id/responses/:responseId - Delete individual response
responsesRouter.delete('/:id/responses/:responseId', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id, responseId } = req.params;

    const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(id, userId);
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado.' });
    }

    db.prepare('DELETE FROM responses WHERE id = ? AND form_id = ?').run(responseId, id);

    return res.json({ message: 'Respuesta eliminada correctamente.' });
  } catch (err: any) {
    console.error('Error al eliminar respuesta:', err);
    return res.status(500).json({ error: 'Error al eliminar respuesta.' });
  }
});
