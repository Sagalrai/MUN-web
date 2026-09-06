import { parse } from 'csv-parse/sync';
import Delegate from '../models/delegate.js';
import Volunteer from '../models/Volunteer.js';

const fields = {
  delegates: ['name', 'email', 'phone', 'school', 'committee', 'country'],
  volunteers: ['name', 'email', 'phone', 'school', 'department', 'position'],
};

const validateRows = (rows, type) => rows.map((row, index) => {
  const missing = fields[type].filter((field) => !String(row[field] || '').trim());
  return { row: index + 2, data: row, valid: missing.length === 0, errors: missing.map((field) => `${field} is required`) };
});

export const previewImport = (req, res) => {
  try {
    const { type } = req.body;
    if (!fields[type]) return res.status(400).json({ message: 'Import type must be delegates or volunteers' });
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
    const rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    const unknownFields = Object.keys(rows[0] || {}).filter((field) => !fields[type].includes(field));
    if (unknownFields.length) return res.status(400).json({ message: `Unexpected columns: ${unknownFields.join(', ')}` });
    const validated = validateRows(rows, type);
    res.json({ type, total: validated.length, valid: validated.filter((row) => row.valid).length, invalid: validated.filter((row) => !row.valid).length, rows: validated });
  } catch (error) {
    res.status(400).json({ message: `Invalid CSV: ${error.message}` });
  }
};

export const confirmImport = async (req, res) => {
  try {
    const { type, rows } = req.body;
    if (!fields[type] || !Array.isArray(rows) || !rows.length) return res.status(400).json({ message: 'A valid import type and rows are required' });
    const cleanRows = rows.map((row) => Object.fromEntries(fields[type].map((field) => [field, String(row[field] || '').trim()])));
    const Model = type === 'delegates' ? Delegate : Volunteer;
    const inserted = await Promise.all(cleanRows.map((row) => Model.create(row)));
    res.status(201).json({ imported: inserted.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};