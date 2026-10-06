import nodemailer, { Transporter } from 'nodemailer';

// Servicio sencillo de notificaciones por correo.
// - Si NOTIFY_ENABLED=false: no hace nada (modo desactivado).
// - Si no hay SMTP_HOST configurado: modo "log" (no requiere credenciales,
//   guarda el correo en memoria y lo imprime en consola). Ideal para la prueba.
// - Si hay SMTP_* configurado: envía con Nodemailer (Gmail, Mailtrap, etc.).
// Nunca lanza excepciones: los fallos se devuelven como { sent: false } para
// no romper el flujo principal (crear/cambiar estado).

export interface NotifyResult {
  sent: boolean;
  mode: 'disabled' | 'log' | 'smtp';
  messageId?: string;
  preview?: string;
  error?: string;
}

export interface LoggedEmail {
  to: string;
  subject: string;
  text: string;
  sentAt: string;
  mode: string;
}

const MAX_LOG = 50;
const emailLog: LoggedEmail[] = [];

function isEnabled(): boolean {
  return (process.env.NOTIFY_ENABLED ?? 'true').toLowerCase() !== 'false';
}

function getTransport(): { transporter: Transporter | null; mode: 'log' | 'smtp' } {
  const host = process.env.SMTP_HOST;
  if (!host) return { transporter: null, mode: 'log' };
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true',
    // Timeouts para que un SMTP lento/caído nunca cuelgue la API.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return { transporter, mode: 'smtp' };
}

async function send(to: string, subject: string, text: string): Promise<NotifyResult> {
  if (!isEnabled()) return { sent: false, mode: 'disabled' };

  const dest = to || process.env.NOTIFY_TO || 'mesa-ayuda@example.com';
  const from = process.env.NOTIFY_FROM || 'Mesa de Ayuda <no-reply@soporte.local>';
  const { transporter, mode } = getTransport();

  const entry: LoggedEmail = {
    to: dest,
    subject,
    text,
    sentAt: new Date().toISOString(),
    mode,
  };
  emailLog.push(entry);
  if (emailLog.length > MAX_LOG) emailLog.splice(0, emailLog.length - MAX_LOG);

  if (mode === 'log') {
    console.log(`[NOTIFY][log] To: ${dest} | ${subject}\n${text}`);
    return { sent: true, mode, preview: text };
  }

  try {
    const info = await transporter!.sendMail({ from, to: dest, subject, text });
    return { sent: true, mode, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error SMTP desconocido';
    console.error(`[NOTIFY][smtp-error] ${message}`);
    return { sent: false, mode, error: message };
  }
}

export const notificationService = {
  getRecent(): LoggedEmail[] {
    return [...emailLog].reverse();
  },

  notifyTicketCreated(ticket: {
    id: string;
    title: string;
    applicant: string;
    category: string;
    priority: string;
  }): Promise<NotifyResult> {
    return send(
      process.env.NOTIFY_TO || 'mesa-ayuda@example.com',
      `Nueva solicitud: ${ticket.title}`,
      [
        'Se registró una nueva solicitud de soporte.',
        `ID: ${ticket.id}`,
        `Título: ${ticket.title}`,
        `Solicitante: ${ticket.applicant}`,
        `Categoría: ${ticket.category} | Prioridad: ${ticket.priority}`,
      ].join('\n')
    );
  },

  notifyStatusChanged(ticket: {
    id: string;
    title: string;
    priority: string;
    status: string;
  }, previousStatus: string, responsible: string, observation?: string): Promise<NotifyResult> {
    return send(
      process.env.NOTIFY_TO || 'mesa-ayuda@example.com',
      `Cambio de estado [${previousStatus} → ${ticket.status}]: ${ticket.title}`,
      [
        'Una solicitud cambió de estado.',
        `ID: ${ticket.id}`,
        `Título: ${ticket.title}`,
        `Transición: ${previousStatus} → ${ticket.status}`,
        `Responsable: ${responsible}`,
        `Prioridad: ${ticket.priority}`,
        observation ? `Observación: ${observation}` : 'Observación: (sin observación)',
      ].join('\n')
    );
  },

  notifyTicketUpdated(ticket: {
    id: string;
    title: string;
    applicant: string;
    category: string;
    priority: string;
    status: string;
  }): Promise<NotifyResult> {
    return send(
      process.env.NOTIFY_TO || 'mesa-ayuda@example.com',
      `Solicitud actualizada: ${ticket.title}`,
      [
        'Se actualizaron los datos de una solicitud de soporte.',
        `ID: ${ticket.id}`,
        `Título: ${ticket.title}`,
        `Solicitante: ${ticket.applicant}`,
        `Categoría: ${ticket.category} | Prioridad: ${ticket.priority} | Estado: ${ticket.status}`,
      ].join('\n')
    );
  },

  sendTestEmail(): Promise<NotifyResult> {
    return send(
      process.env.NOTIFY_TO || 'mesa-ayuda@example.com',
      'Correo de prueba — Mesa de Ayuda',
      'Si lees esto, el servicio de notificaciones por correo funciona correctamente.'
    );
  },
};
