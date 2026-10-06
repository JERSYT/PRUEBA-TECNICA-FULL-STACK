import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { notificationService } from '../src/services/notification.service.js';

describe('Notificaciones por correo', () => {
  it('POST /api/notifications/test debe procesar en modo log sin SMTP', async () => {
    const res = await request(app).post('/api/notifications/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mode).toBe('log');
    expect(res.body.data.sent).toBe(true);
  });

  it('GET /api/notifications debe listar correos recientes', async () => {
    await notificationService.sendTestEmail();
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Crear un ticket debe disparar notificación sin romper la respuesta 201', async () => {
    const res = await request(app).post('/api/tickets').send({
      title: 'Ticket con notificacion de prueba E2E',
      description: 'Descripcion suficientemente larga para pasar la validacion del backend.',
      applicant: 'QA Notificaciones',
      category: 'Software',
      priority: 'Media',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const recent = notificationService.getRecent();
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].subject).toContain('Nueva solicitud');
  });

  it('notifyTicketCreated nunca debe lanzar aunque falle el transporte', async () => {
    const result = await notificationService.notifyTicketCreated({
      id: 'test-id',
      title: 'Titulo de prueba',
      applicant: 'Alguien',
      category: 'Red',
      priority: 'Alta',
    });
    expect(result.sent).toBe(true);
    expect(['log', 'smtp', 'disabled']).toContain(result.mode);
  });
});
