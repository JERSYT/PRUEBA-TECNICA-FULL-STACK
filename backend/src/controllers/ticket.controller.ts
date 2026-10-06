import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service.js';
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  ChangeStatusSchema,
  TicketQuerySchema,
} from '../schemas/ticket.schema.js';

export class TicketController {
  async listTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedQuery = TicketQuerySchema.parse(req.query);
      const result = await ticketService.listTickets(parsedQuery);
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ticketService.getTicketStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const ticket = await ticketService.getTicketById(id);
      return res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const body = CreateTicketSchema.parse(req.body);
      const ticket = await ticketService.createTicket(body);
      return res.status(201).json({
        success: true,
        message: 'Solicitud creada exitosamente.',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = UpdateTicketSchema.parse(req.body);
      const ticket = await ticketService.updateTicket(id, body);
      return res.status(200).json({
        success: true,
        message: 'Solicitud actualizada exitosamente.',
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const body = ChangeStatusSchema.parse(req.body);
      const ticket = await ticketService.changeStatus(id, body);
      return res.status(200).json({
        success: true,
        message: `Estado de la solicitud actualizado a '${ticket.status}'.`,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await ticketService.deleteTicket(id);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTicketHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const history = await ticketService.getTicketHistory(id);
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
