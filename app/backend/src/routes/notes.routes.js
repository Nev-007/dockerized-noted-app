const express = require('express');
const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
} = require('../controllers/notes.controller');

const router = express.Router();

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.patch('/:id/pin', togglePin);

module.exports = router;
