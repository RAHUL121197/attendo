CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  employee_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id)
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  department TEXT,
  position TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_employee_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Present',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS audit_questions (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_reports (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_answers (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL REFERENCES audit_reports(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES audit_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, question_id)
);

CREATE INDEX IF NOT EXISTS attendance_employee_date_idx ON attendance (employee_id, date DESC);
CREATE INDEX IF NOT EXISTS audit_reports_employee_date_idx ON audit_reports (employee_id, report_date DESC);
CREATE INDEX IF NOT EXISTS audit_answers_report_idx ON audit_answers (report_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
