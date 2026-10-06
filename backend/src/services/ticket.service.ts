import { prisma } from '../prisma.js';
import {
  CreateTicketDTO,
  UpdateTicketDTO,
  ChangeStatusDTO,
  TicketQueryDTO,
} from '../schemas/ticket.schema.js';
import {
  validateStatusTransition,
  BusinessRuleError,
} from './businessRules.service.js';
import { notificationService } from './notification.service.js';
import { Prisma, Status } from '@prisma/client';

export class TicketService {
  async listTickets(query: TicketQueryDTO) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      priority,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { applicant: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          history: {
            orderBy: { changedAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getTicketStats() {
    const [total, pending, inProgress, resolved, cancelled] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: Status.Pendiente } }),
      prisma.ticket.count({ where: { status: Status.En_progreso } }),
      prisma.ticket.count({ where: { status: Status.Resuelta } }),
      prisma.ticket.count({ where: { status: Status.Cancelada } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      resolved,
      cancelled,
    };
  }

  async getTicketById(id: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new BusinessRuleError('Solicitud no encontrada', 404);
    }

    return ticket;
  }

  async createTicket(dto: CreateTicketDTO) {
    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          title: dto.title,
          description: dto.description,
          applicant: dto.applicant,
          category: dto.category,
          priority: dto.priority,
          status: Status.Pendiente,
        },
      });

      // Registro inicial en el historial
      await tx.ticketHistory.create({
        data: {
          ticketId: created.id,
          previousStatus: Status.Pendiente,
          newStatus: Status.Pendiente,
          responsible: dto.applicant,
          observation: 'Creación inicial de la solicitud de soporte.',
        },
      });

      return created;
    });

    // Notificación por correo en segundo plano: no se espera (await) para que
    // un SMTP lento o caído jamás retrase ni rompa la respuesta de la API.
    notificationService
      .notifyTicketCreated({
        id: ticket.id,
        title: ticket.title,
        applicant: ticket.applicant,
        category: ticket.category,
        priority: ticket.priority,
      })
      .catch(() => undefined);

    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDTO) {
    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      throw new BusinessRuleError('Solicitud no encontrada', 404);
    }

    if (existing.status === Status.Resuelta || existing.status === Status.Cancelada) {
      throw new BusinessRuleError(
        `No se puede editar una solicitud en estado ${existing.status}.`,
        422
      );
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: dto,
    });

    // Segundo plano: ver comentario en createTicket.
    notificationService
      .notifyTicketUpdated({
        id: updatedTicket.id,
        title: updatedTicket.title,
        applicant: updatedTicket.applicant,
        category: updatedTicket.category,
        priority: updatedTicket.priority,
        status: updatedTicket.status,
      })
      .catch(() => undefined);

    return updatedTicket;
  }

  async changeStatus(id: string, dto: ChangeStatusDTO) {
    const previousStatusHolder: { value: Status | null } = { value: null };
    const updated = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id } });
      if (!ticket) {
        throw new BusinessRuleError('Solicitud no encontrada', 404);
      }

      // Validar reglas de transición y obligatoriedad de observación
      validateStatusTransition(
        ticket.status,
        dto.newStatus,
        ticket.priority,
        dto.observation
      );

      previousStatusHolder.value = ticket.status;

      const changed = await tx.ticket.update({
        where: { id },
        data: { status: dto.newStatus },
      });

      // Crear entrada en historial
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          previousStatus: ticket.status,
          newStatus: dto.newStatus,
          responsible: dto.responsible,
          observation: dto.observation || null,
        },
      });

      return changed;
    });

    // Segundo plano: ver comentario en createTicket.
    notificationService
      .notifyStatusChanged(
        {
          id: updated.id,
          title: updated.title,
          priority: updated.priority,
          status: updated.status,
        },
        previousStatusHolder.value ?? Status.Pendiente,
        dto.responsible,
        dto.observation
      )
      .catch(() => undefined);

    return updated;
  }

  async deleteTicket(id: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new BusinessRuleError('Solicitud no encontrada', 404);
    }

    await prisma.ticket.delete({ where: { id } });
    return { success: true, message: 'Solicitud eliminada correctamente.' };
  }

  async getTicketHistory(id: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      throw new BusinessRuleError('Solicitud no encontrada', 404);
    }

    return prisma.ticketHistory.findMany({
      where: { ticketId: id },
      orderBy: { changedAt: 'desc' },
    });
  }
}

export const ticketService = new TicketService();
