import { Status, Priority } from '@prisma/client';

export class BusinessRuleError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = 'BusinessRuleError';
    this.statusCode = statusCode;
  }
}

export const VALID_TRANSITIONS: Record<Status, Status[]> = {
  [Status.Pendiente]: [Status.En_progreso, Status.Cancelada],
  [Status.En_progreso]: [Status.Resuelta, Status.Cancelada],
  [Status.Resuelta]: [], // Regla: Una solicitud resuelta no podrá volver a estar en progreso ni reabrirse
  [Status.Cancelada]: [], // Regla: Una solicitud cancelada no podrá volver a estar en progreso
};

export function validateStatusTransition(
  currentStatus: Status,
  newStatus: Status,
  priority: Priority,
  observation?: string
): void {
  if (currentStatus === newStatus) {
    throw new BusinessRuleError(
      `La solicitud ya se encuentra en estado ${currentStatus}.`,
      400
    );
  }

  // Regla específica: Una solicitud cancelada no podrá volver a estar en progreso
  if (currentStatus === Status.Cancelada && newStatus === Status.En_progreso) {
    throw new BusinessRuleError(
      'Una solicitud cancelada no puede volver a estar en progreso.',
      422
    );
  }

  // Regla específica: Una solicitud resuelta no podrá volver a estar en progreso
  if (currentStatus === Status.Resuelta && newStatus === Status.En_progreso) {
    throw new BusinessRuleError(
      'Una solicitud resuelta no puede volver a estar en progreso.',
      422
    );
  }

  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext.includes(newStatus)) {
    throw new BusinessRuleError(
      `Transición no permitida: no se puede pasar de '${currentStatus}' a '${newStatus}'.`,
      422
    );
  }

  // Regla obligatoria: Prioridad Crítica debe registrar observación al ser resuelta
  if (priority === Priority.Critica && newStatus === Status.Resuelta) {
    if (!observation || observation.trim().length === 0) {
      throw new BusinessRuleError(
        'Una solicitud con prioridad Crítica requiere obligatoriamente una observación al ser resuelta.',
        422
      );
    }
  }
}
