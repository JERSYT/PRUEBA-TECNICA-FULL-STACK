import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async listRecent(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = notificationService.getRecent();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async sendTest(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.sendTestEmail();
      return res.status(200).json({
        success: true,
        message: result.sent
          ? `Correo de prueba procesado en modo '${result.mode}'.`
          : 'Notificación desactivada o con error SMTP (ver logs).',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
