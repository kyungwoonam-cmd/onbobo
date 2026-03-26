import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { SolapiMessageService } from 'solapi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite Database
const db = new Database('onboarding.db');

// Setup tables
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    joinDate TEXT NOT NULL,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    body TEXT NOT NULL
  );
`);

// Seed default templates if empty
const stmt = db.prepare('SELECT COUNT(*) as count FROM templates');
const { count } = stmt.get() as { count: number };
if (count === 0) {
  const insertTemplate = db.prepare('INSERT INTO templates (id, subject, body) VALUES (?, ?, ?)');
  insertTemplate.run('D-15', '[환영합니다] 입사 15일 전 안내', '안녕하세요 {{name}}님,\\n\\n{{team}}팀 합류를 환영합니다! 입사일은 {{date}}입니다.');
  insertTemplate.run('D-10', '[안내] 입사 10일 전 준비사항', '안녕하세요 {{name}}님,\\n\\n입사 10일 전 안내드립니다.');
  insertTemplate.run('D-5', '[최종안내] 입사 5일 전 최종 안내', '안녕하세요 {{name}}님,\\n\\n입사 5일 전 최종 안내드립니다.');
}

// API Routes
app.get('/api/employees', (req, res) => {
  const employees = db.prepare('SELECT * FROM employees ORDER BY joinDate ASC').all();
  res.json(employees);
});

app.post('/api/employees', (req, res) => {
  const { name, team, phone, email, joinDate } = req.body;
  const info = db.prepare('INSERT INTO employees (name, team, phone, email, joinDate) VALUES (?, ?, ?, ?, ?)').run(name, team, phone, email, joinDate);
  res.json({ id: info.lastInsertRowid, ...req.body, status: 'pending' });
});

app.delete('/api/employees/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/templates', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates').all();
  res.json(templates);
});

app.get('/api/schedules', (req, res) => {
  const employees = db.prepare('SELECT * FROM employees').all() as any[];
  const schedules: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  employees.forEach(emp => {
    const joinDate = new Date(emp.joinDate);
    
    // Calculate dates
    const d15 = new Date(joinDate); d15.setDate(d15.getDate() - 15);
    const d10 = new Date(joinDate); d10.setDate(d10.getDate() - 10);
    const d5 = new Date(joinDate); d5.setDate(d5.getDate() - 5);

    const addSchedule = (date: Date, templateId: string) => {
      // Create a simple date string for comparison
      date.setHours(0, 0, 0, 0);
      schedules.push({
        employeeId: emp.id,
        employeeName: emp.name,
        team: emp.team,
        templateId,
        scheduledDate: date.toISOString().split('T')[0],
        isToday: date.getTime() === today.getTime(),
        isPast: date.getTime() < today.getTime(),
        status: emp.status || ''
      });
    };

    addSchedule(d15, 'D-15');
    addSchedule(d10, 'D-10');
    addSchedule(d5, 'D-5');
  });

  // Sort by date ascending
  schedules.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  res.json(schedules);
});

app.put('/api/templates/:id', (req, res) => {
  const { subject, body } = req.body;
  db.prepare('UPDATE templates SET subject = ?, body = ? WHERE id = ?').run(subject, body, req.params.id);
  res.json({ success: true });
});

// Email/SMS Helper
async function sendNotification(employee: any, templateId: string) {
  const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as any;
  if (!template) return false;

  const subject = template.subject
    .replace(/{{name}}/g, employee.name)
    .replace(/{{team}}/g, employee.team)
    .replace(/{{date}}/g, employee.joinDate);
    
  const body = template.body
    .replace(/{{name}}/g, employee.name)
    .replace(/{{team}}/g, employee.team)
    .replace(/{{date}}/g, employee.joinDate);

  // Mock Email Sending (or real if SMTP_USER is set)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: employee.email,
        subject,
        text: body,
      });
      console.log(`Email sent to ${employee.email}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  } else {
    console.log(`[MOCK EMAIL] To: ${employee.email}, Subject: ${subject}\nBody: ${body}`);
  }

  // Mock SMS Sending
  if (process.env.SMS_KEY && process.env.SMS_SECRET && process.env.SMS_SENDER) {
    try {
      const messageService = new SolapiMessageService(process.env.SMS_KEY, process.env.SMS_SECRET);
      await messageService.sendOne({
        to: employee.phone.replace(/[^0-9]/g, ''), // Remove non-numeric characters
        from: process.env.SMS_SENDER.replace(/[^0-9]/g, ''),
        text: body,
      });
      console.log(`SMS sent to ${employee.phone}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // We don't return false here to allow email to succeed even if SMS fails, 
      // or we can choose to fail the whole process. Let's just log it for now.
    }
  } else {
    console.log(`[MOCK SMS] To: ${employee.phone}, Body: ${body}`);
  }

  return true;
}

app.post('/api/send-now', async (req, res) => {
  const { employeeId, templateId } = req.body;
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const success = await sendNotification(employee, templateId);
  if (success) {
    db.prepare('UPDATE employees SET status = ? WHERE id = ?').run(`Sent ${templateId}`, employeeId);
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to send' });
  }
});

app.all('/api/cron/send-reminders', async (req, res) => {
  // In a real app, this would be triggered by Vercel Cron (usually GET)
  // We calculate D-15, D-10, D-5
  const today = new Date();
  const employees = db.prepare('SELECT * FROM employees').all() as any[];
  
  let sentCount = 0;

  for (const emp of employees) {
    const joinDate = new Date(emp.joinDate);
    const diffTime = joinDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let templateId = null;
    if (diffDays === 15) templateId = 'D-15';
    else if (diffDays === 10) templateId = 'D-10';
    else if (diffDays === 5) templateId = 'D-5';

    if (templateId) {
      const success = await sendNotification(emp, templateId);
      if (success) {
        db.prepare('UPDATE employees SET status = ? WHERE id = ?').run(`Auto Sent ${templateId}`, emp.id);
        sentCount++;
      }
    }
  }

  res.json({ success: true, sentCount });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
