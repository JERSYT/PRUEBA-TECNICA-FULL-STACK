export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API de Gestión de Solicitudes de Soporte Tecnológico',
    version: '1.0.0',
    description:
      'Backend REST API con TypeScript, Express, Prisma, PostgreSQL y validación estricta de reglas de negocio para solicitudes de soporte.',
    contact: {
      name: 'Equipo de Soporte Tecnológico',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Servidor Local / Producción',
    },
  ],
  tags: [
    {
      name: 'Tickets',
      description: 'Operaciones CRUD, búsquedas, filtros y transiciones de estado de tickets',
    },
  ],
  paths: {
    '/tickets/stats': {
      get: {
        tags: ['Tickets'],
        summary: 'Obtiene métricas y conteos por estado de solicitudes',
        responses: {
          200: {
            description: 'Estadísticas obtenidas correctamente',
          },
        },
      },
    },
    '/tickets': {
      get: {
        tags: ['Tickets'],
        summary: 'Lista solicitudes con filtros, búsqueda, orden y paginación',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['Hardware', 'Software', 'Red', 'Accesos', 'Otros'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Critica'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pendiente', 'En_progreso', 'Resuelta', 'Cancelada'] } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'Listado de solicitudes paginadas' },
        },
      },
      post: {
        tags: ['Tickets'],
        summary: 'Crea una nueva solicitud de soporte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTicket' },
            },
          },
        },
        responses: {
          201: { description: 'Solicitud creada exitosamente' },
          400: { description: 'Error de validación de datos' },
        },
      },
    },
    '/tickets/{id}': {
      get: {
        tags: ['Tickets'],
        summary: 'Obtiene el detalle de una solicitud por ID junto con su historial',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Detalle de la solicitud' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
      put: {
        tags: ['Tickets'],
        summary: 'Edita los campos de una solicitud existente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTicket' },
            },
          },
        },
        responses: {
          200: { description: 'Solicitud actualizada exitosamente' },
          404: { description: 'Solicitud no encontrada' },
          422: { description: 'No se puede editar una solicitud Resuelta o Cancelada' },
        },
      },
      delete: {
        tags: ['Tickets'],
        summary: 'Elimina una solicitud por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Solicitud eliminada' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
    '/tickets/{id}/status': {
      patch: {
        tags: ['Tickets'],
        summary: 'Cambia el estado de una solicitud aplicando las reglas de negocio de la máquina de estados',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangeStatus' },
            },
          },
        },
        responses: {
          200: { description: 'Estado actualizado y registrado en auditoría' },
          400: { description: 'El ticket ya tiene ese estado o datos inválidos' },
          422: { description: 'Transición prohibida o falta observación en prioridad Crítica' },
        },
      },
    },
    '/tickets/{id}/history': {
      get: {
        tags: ['Tickets'],
        summary: 'Consulta la bitácora completa de cambios de estado de una solicitud',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Historial de cambios cronológico' },
          404: { description: 'Solicitud no encontrada' },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateTicket: {
        type: 'object',
        required: ['title', 'description', 'applicant', 'category', 'priority'],
        properties: {
          title: { type: 'string', example: 'Falla en tarjeta gráfica de estación 4' },
          description: { type: 'string', example: 'La pantalla parpadea en negro recurrentemente.' },
          applicant: { type: 'string', example: 'Carlos Mendoza' },
          category: { type: 'string', enum: ['Hardware', 'Software', 'Red', 'Accesos', 'Otros'], example: 'Hardware' },
          priority: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Critica'], example: 'Alta' },
        },
      },
      UpdateTicket: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          applicant: { type: 'string' },
          category: { type: 'string', enum: ['Hardware', 'Software', 'Red', 'Accesos', 'Otros'] },
          priority: { type: 'string', enum: ['Baja', 'Media', 'Alta', 'Critica'] },
        },
      },
      ChangeStatus: {
        type: 'object',
        required: ['newStatus', 'responsible'],
        properties: {
          newStatus: { type: 'string', enum: ['Pendiente', 'En_progreso', 'Resuelta', 'Cancelada'], example: 'En_progreso' },
          responsible: { type: 'string', example: 'Ing. Laura Gómez' },
          observation: { type: 'string', example: 'Se inicia diagnóstico en el equipo' },
        },
      },
    },
  },
};
