import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from './config.js';
import { pool, query } from './db.js';
import { asyncHandler, authRequired, requireRole } from './middleware.js';

const router = express.Router();
const loginSchema = z.object({ identifier: z.string().trim().min(1), password: z.string().min(1) });
const employeeSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(255), phone: z.string().trim().max(30).optional(),
  aadharCardNo: z.string().trim().regex(/^\d{12}$/, 'Aadhar Card No. must contain exactly 12 digits').optional(),
  department: z.string().trim().max(100).optional(), position: z.string().trim().max(120).optional(), password: z.string().min(8).max(128).optional(),
});
const aadharLookupSchema = z.object({ aadharCardNo: z.string().trim().regex(/^\d{12}$/, 'Aadhar Card No. must contain exactly 12 digits') });
const attendanceSchema = z.object({ employeeId: z.coerce.number().int().positive(), date: z.string().date(), checkIn: z.string().datetime().optional(), checkOut: z.string().datetime().optional(), status: z.string().trim().min(1).max(40).default('Present') });
const questionSchema = z.object({ question: z.string().trim().min(1).max(500), category: z.string().trim().min(1).max(100) });
const reportSchema = z.object({ employeeId: z.coerce.number().int().positive(), reportDate: z.string().date(), status: z.string().trim().min(1).max(40).default('Draft') });
const answerSchema = z.object({ reportId: z.coerce.number().int().positive(), questionId: z.coerce.number().int().positive(), answer: z.string().trim().min(1).max(2000) });

function parse(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error(result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '));
    error.status = 400;
    throw error;
  }
  return result.data;
}

function tokenFor(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, employeeId: user.employee_id || null, name: user.name, email: user.email }, config.jwtSecret, { expiresIn: '8h' });
}

function publicUser(row) { return { id: row.id, name: row.name, email: row.email, role: row.role, employeeId: row.employee_id || null }; }

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { identifier, password } = parse(loginSchema, req.body);
  const result = await query(`SELECT u.*, e.password_hash AS employee_password_hash FROM users u LEFT JOIN employees e ON e.id = u.employee_id WHERE LOWER(u.email) = LOWER($1) OR LOWER(e.employee_id) = LOWER($1) LIMIT 1`, [identifier]);
  const user = result.rows[0];
  const hash = user?.role === 'employee' ? user.employee_password_hash || user.password_hash : user?.password_hash;
  if (!user || !(await bcrypt.compare(password, hash))) return res.status(401).json({ error: 'Invalid credentials.' });
  return res.json({ token: tokenFor(user), user: publicUser(user) });
}));

router.post('/auth/change-password', authRequired, asyncHandler(async (req, res) => {
  const input = parse(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) }), req.body);
  const result = await query('SELECT id, password_hash FROM users WHERE id = $1', [Number(req.user.sub)]);
  if (!result.rowCount || !(await bcrypt.compare(input.currentPassword, result.rows[0].password_hash))) return res.status(400).json({ error: 'Current password is incorrect.' });
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, Number(req.user.sub)]);
  if (req.user.employeeId) await query('UPDATE employees SET password_hash = $1 WHERE id = $2', [passwordHash, Number(req.user.employeeId)]);
  return res.json({ success: true });
}));

router.post('/auth/reset-password', asyncHandler(async (req, res) => {
  const input = parse(z.object({ identifier: z.string().trim().min(1), role: z.enum(['admin', 'employee']) }), req.body);
  const result = await query(`SELECT u.id, u.email, u.role, u.employee_id, e.employee_id AS employee_code FROM users u LEFT JOIN employees e ON e.id = u.employee_id WHERE u.role = $1 AND (LOWER(u.email) = LOWER($2) OR LOWER(e.employee_id) = LOWER($2)) LIMIT 1`, [input.role, input.identifier]);
  if (!result.rowCount) return res.status(404).json({ error: 'No account found for those details.' });
  const temporaryPassword = `Attendo-${randomUUID().slice(0, 8)}!`;
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, result.rows[0].id]);
  if (result.rows[0].employee_id) await query('UPDATE employees SET password_hash = $1 WHERE id = $2', [passwordHash, result.rows[0].employee_id]);
  return res.json({ email: result.rows[0].email, employeeId: result.rows[0].employee_code, temporaryPassword });
}));

router.post('/employees', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const input = parse(employeeSchema, req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [828374]);
    const duplicate = await client.query('SELECT 1 FROM employees WHERE LOWER(email) = LOWER($1) OR ($2::TEXT IS NOT NULL AND aadhar_card_no = $2)', [input.email, input.aadharCardNo || null]);
    if (duplicate.rowCount) return res.status(409).json({ error: 'An employee with these details already exists.' });
    const highest = await client.query(`SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) AS serial FROM employees WHERE employee_id ~ '^EMP[0-9]+$'`);
    const employeeId = `EMP${String(Number(highest.rows[0].serial) + 1).padStart(3, '0')}`;
    const temporaryPassword = input.password || `Attendo-${randomUUID().slice(0, 8)}!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const employee = await client.query(`INSERT INTO employees (employee_id, name, email, phone, aadhar_card_no, department, position, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, employee_id, name, email, phone, department, position, created_at`, [employeeId, input.name, input.email, input.phone || null, input.aadharCardNo || null, input.department || null, input.position || null, passwordHash]);
    await client.query(`INSERT INTO users (name, email, password_hash, role, employee_id) VALUES ($1,$2,$3,'employee',$4)`, [input.name, input.email, passwordHash, employee.rows[0].id]);
    await client.query('COMMIT');
    return res.status(201).json({ employee: employee.rows[0], temporaryPassword });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'An employee with these details already exists.' });
    throw error;
  } finally { client.release(); }
}));

router.get('/employees', authRequired, requireRole('admin'), asyncHandler(async (_req, res) => {
  const result = await query('SELECT id, employee_id, name, email, phone, aadhar_card_no, department, position, created_at FROM employees ORDER BY id DESC');
  return res.json({ employees: result.rows });
}));

router.post('/employees/lookup-by-aadhar', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const { aadharCardNo } = parse(aadharLookupSchema, req.body);
  const result = await query('SELECT id, employee_id, name, email, phone, department, position, created_at FROM employees WHERE aadhar_card_no = $1 LIMIT 1', [aadharCardNo]);
  if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
  return res.json({ employee: result.rows[0] });
}));

router.get('/employees/:id', authRequired, asyncHandler(async (req, res) => {
  const requestedId = Number(req.params.id);
  if (req.user.role === 'employee' && requestedId !== Number(req.user.employeeId)) return res.status(403).json({ error: 'You can only access your own employee record.' });
  const result = await query('SELECT id, employee_id, name, email, phone, aadhar_card_no, department, position, created_at FROM employees WHERE id = $1', [requestedId]);
  if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
  return res.json({ employee: result.rows[0] });
}));

router.put('/employees/:id', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const input = parse(employeeSchema.partial(), req.body);
  const fields = Object.entries(input);
  if (!fields.length) return res.status(400).json({ error: 'No employee fields supplied.' });
  const assignments = fields.map(([key], index) => `${key === 'aadharCardNo' ? 'aadhar_card_no' : key} = $${index + 1}`).join(', ');
  const normalizedValues = fields.map(([key, value]) => key === 'aadharCardNo' ? value || null : value);
  normalizedValues.push(Number(req.params.id));
  const result = await query(`UPDATE employees SET ${assignments} WHERE id = $${normalizedValues.length} RETURNING id, employee_id, name, email, phone, aadhar_card_no, department, position, created_at`, normalizedValues);
  if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
  return res.json({ employee: result.rows[0] });
}));

router.delete('/employees/:id', authRequired, requireRole('admin'), asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM employees WHERE id = $1 RETURNING id', [Number(req.params.id)]);
  if (!result.rowCount) return res.status(404).json({ error: 'Employee not found.' });
  return res.status(204).send();
}));

router.post('/attendance', authRequired, asyncHandler(async (req, res) => {
  const input = parse(attendanceSchema, req.body);
  if (req.user.role === 'employee' && Number(input.employeeId) !== Number(req.user.employeeId)) return res.status(403).json({ error: 'You can only record your own attendance.' });
  const result = await query(`INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (employee_id,date) DO UPDATE SET check_in = COALESCE(EXCLUDED.check_in, attendance.check_in), check_out = COALESCE(EXCLUDED.check_out, attendance.check_out), status = EXCLUDED.status RETURNING *`, [input.employeeId, input.date, input.checkIn || null, input.checkOut || null, input.status]);
  return res.status(201).json({ attendance: result.rows[0] });
}));

router.get('/attendance', authRequired, asyncHandler(async (req, res) => {
  const employeeId = req.user.role === 'employee' ? Number(req.user.employeeId) : req.query.employeeId ? Number(req.query.employeeId) : null;
  const result = employeeId ? await query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC', [employeeId]) : await query('SELECT * FROM attendance ORDER BY date DESC');
  return res.json({ attendance: result.rows });
}));
router.get('/attendance/:employeeId', authRequired, asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  if (req.user.role === 'employee' && employeeId !== Number(req.user.employeeId)) return res.status(403).json({ error: 'You can only access your own attendance.' });
  const result = await query('SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC', [employeeId]);
  return res.json({ attendance: result.rows });
}));

router.get('/audit/questions', authRequired, asyncHandler(async (_req, res) => { const result = await query('SELECT * FROM audit_questions ORDER BY category, id'); return res.json({ questions: result.rows }); }));
router.post('/audit/questions', authRequired, requireRole('admin'), asyncHandler(async (req, res) => { const input = parse(questionSchema, req.body); const result = await query('INSERT INTO audit_questions (question, category) VALUES ($1,$2) RETURNING *', [input.question, input.category]); return res.status(201).json({ question: result.rows[0] }); }));
router.post('/audit/reports', authRequired, requireRole('admin'), asyncHandler(async (req, res) => { const input = parse(reportSchema, req.body); const result = await query('INSERT INTO audit_reports (employee_id, report_date, status) VALUES ($1,$2,$3) RETURNING *', [input.employeeId, input.reportDate, input.status]); return res.status(201).json({ report: result.rows[0] }); }));
router.get('/audit/reports', authRequired, asyncHandler(async (req, res) => { const employeeId = req.user.role === 'employee' ? Number(req.user.employeeId) : req.query.employeeId ? Number(req.query.employeeId) : null; const result = employeeId ? await query('SELECT * FROM audit_reports WHERE employee_id = $1 ORDER BY report_date DESC', [employeeId]) : await query('SELECT * FROM audit_reports ORDER BY report_date DESC'); return res.json({ reports: result.rows }); }));
router.post('/audit/answers', authRequired, requireRole('admin'), asyncHandler(async (req, res) => { const input = parse(answerSchema, req.body); const result = await query('INSERT INTO audit_answers (report_id, question_id, answer) VALUES ($1,$2,$3) ON CONFLICT (report_id,question_id) DO UPDATE SET answer = EXCLUDED.answer RETURNING *', [input.reportId, input.questionId, input.answer]); return res.status(201).json({ answer: result.rows[0] }); }));

export default router;
