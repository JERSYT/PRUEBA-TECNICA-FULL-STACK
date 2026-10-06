import { describe, it, expect } from 'vitest';
import {
  validateStatusTransition,
  BusinessRuleError,
} from '../src/services/businessRules.service.js';
import { Status, Priority } from '@prisma/client';

describe('Reglas de Negocio - Máquina de Estados de Solicitudes', () => {
  it('Debe permitir transición de Pendiente a En_progreso', () => {
    expect(() =>
      validateStatusTransition(Status.Pendiente, Status.En_progreso, Priority.Media)
    ).not.toThrow();
  });

  it('Debe permitir transición de En_progreso a Resuelta (Prioridad normal)', () => {
    expect(() =>
      validateStatusTransition(Status.En_progreso, Status.Resuelta, Priority.Alta)
    ).not.toThrow();
  });

  it('Debe permitir transición de Pendiente a Cancelada', () => {
    expect(() =>
      validateStatusTransition(Status.Pendiente, Status.Cancelada, Priority.Baja)
    ).not.toThrow();
  });

  it('Debe RECHAZAR que una solicitud Cancelada vuelva a estar En_progreso', () => {
    expect(() =>
      validateStatusTransition(Status.Cancelada, Status.En_progreso, Priority.Media)
    ).toThrowError(BusinessRuleError);
  });

  it('Debe RECHAZAR que una solicitud Resuelta vuelva a estar En_progreso', () => {
    expect(() =>
      validateStatusTransition(Status.Resuelta, Status.En_progreso, Priority.Alta)
    ).toThrowError(BusinessRuleError);
  });

  it('Debe RECHAZAR transición si el estado actual es igual al nuevo', () => {
    expect(() =>
      validateStatusTransition(Status.Pendiente, Status.Pendiente, Priority.Media)
    ).toThrowError('La solicitud ya se encuentra en estado Pendiente.');
  });

  it('Debe RECHAZAR resolver una solicitud de prioridad Crítica SIN observación', () => {
    expect(() =>
      validateStatusTransition(Status.En_progreso, Status.Resuelta, Priority.Critica, '')
    ).toThrowError('Una solicitud con prioridad Crítica requiere obligatoriamente una observación');

    expect(() =>
      validateStatusTransition(Status.En_progreso, Status.Resuelta, Priority.Critica, undefined)
    ).toThrowError(BusinessRuleError);
  });

  it('Debe PERMITIR resolver una solicitud de prioridad Crítica CON observación válida', () => {
    expect(() =>
      validateStatusTransition(
        Status.En_progreso,
        Status.Resuelta,
        Priority.Critica,
        'Se aplicó parche de emergencia y se reiniciaron los servicios.'
      )
    ).not.toThrow();
  });
});
