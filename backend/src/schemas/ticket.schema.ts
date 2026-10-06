import { z } from 'zod';
import { Category, Priority, Status } from '@prisma/client';

export const CategoryEnum = z.nativeEnum(Category);
export const PriorityEnum = z.nativeEnum(Priority);
export const StatusEnum = z.nativeEnum(Status);

export const CreateTicketSchema = z.object({
  title: z
    .string({ required_error: 'El título es obligatorio' })
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  description: z
    .string({ required_error: 'La descripción es obligatoria' })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  applicant: z
    .string({ required_error: 'El usuario solicitante es obligatorio' })
    .trim()
    .min(3, 'El nombre del solicitante debe tener al menos 3 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres'),
  category: CategoryEnum,
  priority: PriorityEnum,
});

export const UpdateTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres')
    .optional(),
  description: z
    .string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
  applicant: z
    .string()
    .trim()
    .min(3, 'El nombre del solicitante debe tener al menos 3 caracteres')
    .max(60, 'El nombre no puede exceder 60 caracteres')
    .optional(),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
});

export const ChangeStatusSchema = z.object({
  newStatus: StatusEnum,
  responsible: z
    .string({ required_error: 'El usuario responsable es obligatorio' })
    .trim()
    .min(3, 'El nombre del responsable debe tener al menos 3 caracteres'),
  observation: z
    .string()
    .trim()
    .max(500, 'La observación no puede exceder 500 caracteres')
    .optional(),
});

export const TicketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  status: StatusEnum.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTicketDTO = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketDTO = z.infer<typeof UpdateTicketSchema>;
export type ChangeStatusDTO = z.infer<typeof ChangeStatusSchema>;
export type TicketQueryDTO = z.infer<typeof TicketQuerySchema>;
