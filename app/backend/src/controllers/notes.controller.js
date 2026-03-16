const { getPool } = require('../config/db');

/* ── helpers ─────────────────────────────────────── */

function isPositiveInt(val) {
  const n = Number(val);
  return Number.isInteger(n) && n > 0;
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

/* ── GET /  ──────────────────────────────────────── */

async function getAllNotes(req, res) {
  try {
    const pool = getPool();
    const { tag, search, pinned } = req.query;

    let sql = 'SELECT * FROM notes WHERE 1=1';
    const params = [];

    if (tag) {
      sql += ' AND tag = ?';
      params.push(tag);
    }
    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (pinned !== undefined) {
      sql += ' AND pinned = ?';
      params.push(Number(pinned));
    }

    sql += ' ORDER BY pinned DESC, updated_at DESC';

    const [rows] = await pool.query(sql, params);
    return ok(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to fetch notes', 500);
  }
}

/* ── GET /:id ────────────────────────────────────── */

async function getNoteById(req, res) {
  try {
    if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid note ID');

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);

    if (rows.length === 0) return fail(res, 'Note not found', 404);
    return ok(res, rows[0]);
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to fetch note', 500);
  }
}

/* ── POST / ──────────────────────────────────────── */

async function createNote(req, res) {
  try {
    const { title, content, tag, pinned } = req.body;

    if (!title || !title.trim()) return fail(res, 'Title is required');
    if (!content || !content.trim()) return fail(res, 'Content is required');

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO notes (title, content, tag, pinned) VALUES (?, ?, ?, ?)',
      [title.trim(), content.trim(), tag || 'general', pinned ? 1 : 0]
    );

    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
    return ok(res, rows[0], 201);
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to create note', 500);
  }
}

/* ── PUT /:id ────────────────────────────────────── */

async function updateNote(req, res) {
  try {
    if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid note ID');

    const { title, content, tag, pinned } = req.body;

    if (!title || !title.trim()) return fail(res, 'Title is required');
    if (!content || !content.trim()) return fail(res, 'Content is required');

    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE notes SET title = ?, content = ?, tag = ?, pinned = ? WHERE id = ?',
      [title.trim(), content.trim(), tag || 'general', pinned ? 1 : 0, req.params.id]
    );

    if (result.affectedRows === 0) return fail(res, 'Note not found', 404);

    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    return ok(res, rows[0]);
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to update note', 500);
  }
}

/* ── DELETE /:id ─────────────────────────────────── */

async function deleteNote(req, res) {
  try {
    if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid note ID');

    const pool = getPool();
    const [result] = await pool.query('DELETE FROM notes WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) return fail(res, 'Note not found', 404);
    return ok(res, { id: Number(req.params.id) });
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to delete note', 500);
  }
}

/* ── PATCH /:id/pin ──────────────────────────────── */

async function togglePin(req, res) {
  try {
    if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid note ID');

    const pool = getPool();
    const [result] = await pool.query(
      'UPDATE notes SET pinned = NOT pinned WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) return fail(res, 'Note not found', 404);

    const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [req.params.id]);
    return ok(res, rows[0]);
  } catch (err) {
    console.error(err);
    return fail(res, 'Failed to toggle pin', 500);
  }
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
};
