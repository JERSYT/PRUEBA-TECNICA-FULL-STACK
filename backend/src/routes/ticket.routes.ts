import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

router.get('/notifications', (req, res, next) =>
  notificationController.listRecent(req, res, next)
);
router.post('/notifications/test', (req, res, next) =>
  notificationController.sendTest(req, res, next)
);

router.get('/tickets/stats', (req, res, next) => ticketController.getStats(req, res, next));
router.get('/tickets', (req, res, next) => ticketController.listTickets(req, res, next));
router.post('/tickets', (req, res, next) => ticketController.createTicket(req, res, next));
router.get('/tickets/:id', (req, res, next) => ticketController.getTicketById(req, res, next));
router.put('/tickets/:id', (req, res, next) => ticketController.updateTicket(req, res, next));
router.patch('/tickets/:id/status', (req, res, next) => ticketController.changeStatus(req, res, next));
router.delete('/tickets/:id', (req, res, next) => ticketController.deleteTicket(req, res, next));
router.get('/tickets/:id/history', (req, res, next) => ticketController.getTicketHistory(req, res, next));

export default router;
