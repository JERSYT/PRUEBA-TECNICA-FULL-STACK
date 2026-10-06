import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('API Integration Tests - /api/tickets', () => {
  let createdTicketId: string;

  it('GET /health debe responder 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/tickets debe devolver listado paginado y estructura correcta', async () => {
    const res = await request(app).get('/api/tickets?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  it('GET /api/tickets/stats debe devolver contadores de estado válidos', async () => {
    const res = await request(app).get('/api/tickets/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('pending');
    expect(res.body.data).toHaveProperty('inProgress');
    expect(res.body.data).toHaveProperty('resolved');
    expect(res.body.data).toHaveProperty('cancelled');
  });

  it('POST /api/tickets debe fallar con 400 si faltan campos obligatorios (validación Zod)', async () => {
    const res = await request(app).post('/api/tickets').send({
      title: 'No', // Menor a 5 caracteres
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/tickets debe crear una solicitud válida en estado Pendiente e iniciar su historial', async () => {
    const res = await request(app).post('/api/tickets').send({
      title: 'Teclado mecánico con tecla espaciadora averiada',
      description: 'El colaborador no puede escribir fluidamente debido a que la tecla se traba continuamente.',
      applicant: 'Mateo Osorio',
      category: 'Hardware',
      priority: 'Critica',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('Pendiente');
    createdTicketId = res.body.data.id;
  });

  it('GET /api/tickets/:id debe devolver el detalle y el historial del ticket recién creado', async () => {
    const res = await request(app).get(`/api/tickets/${createdTicketId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdTicketId);
    expect(Array.isArray(res.body.data.history)).toBe(true);
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/tickets/:id/status debe cambiar de Pendiente a En_progreso', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .send({
        newStatus: 'En_progreso',
        responsible: 'Técnico Andrés L.',
        observation: 'Se procede a revisión física del teclado en puesto de trabajo.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('En_progreso');
  });

  it('PATCH /api/tickets/:id/status debe RECHAZAR resolver ticket Crítico SIN observación (Regla de negocio)', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .send({
        newStatus: 'Resuelta',
        responsible: 'Técnico Andrés L.',
        observation: '', // Vacío para probar la regla
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('prioridad Crítica requiere obligatoriamente una observación');
  });

  it('PATCH /api/tickets/:id/status debe PERMITIR resolver ticket Crítico CON observación válida', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .send({
        newStatus: 'Resuelta',
        responsible: 'Técnico Andrés L.',
        observation: 'Se reemplazó el switch de la barra espaciadora y se realizaron pruebas satisfactorias.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Resuelta');
  });

  it('PATCH /api/tickets/:id/status debe RECHAZAR volver a En_progreso cuando ya está Resuelta', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}/status`)
      .send({
        newStatus: 'En_progreso',
        responsible: 'Técnico Andrés L.',
        observation: 'Intento reabrir',
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Una solicitud resuelta no puede volver a estar en progreso');
  });

  it('GET /api/tickets/:id/history debe listar la bitácora completa acumulada', async () => {
    const res = await request(app).get(`/api/tickets/${createdTicketId}/history`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3); // Creación -> En progreso -> Resuelta
  });
});
