import { prisma } from '../src/prisma.js';
import { Category, Priority, Status } from '@prisma/client';

async function main() {
  console.log('🌱 Sembrando datos iniciales en la base de datos...');

  // Limpiar datos existentes
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();

  const tickets = [
    {
      title: 'Falla recurrente en pantalla principal',
      description: 'El monitor secundario se apaga al reproducir videos de alta resolución en el área de diseño.',
      applicant: 'Sofía Martínez',
      category: Category.Hardware,
      priority: Priority.Media,
      status: Status.Pendiente,
    },
    {
      title: 'Acceso a repositorio de GitHub del proyecto ERP',
      description: 'Solicito permisos de escritura en la organización de GitHub para el nuevo desarrollador.',
      applicant: 'Carlos Delgado',
      category: Category.Accesos,
      priority: Priority.Alta,
      status: Status.En_progreso,
    },
    {
      title: 'Impresora de red en Piso 3 no responde',
      description: 'Los colaboradores no pueden imprimir documentos debido a error de timeout en la IP de la impresora.',
      applicant: 'Elena Torres',
      category: Category.Red,
      priority: Priority.Baja,
      status: Status.Pendiente,
    },
    {
      title: 'Caída de base de datos en ambiente de producción',
      description: 'El servidor de base de datos se saturó de conexiones y no responde a las solicitudes del frontend.',
      applicant: 'Andrés Ramírez',
      category: Category.Software,
      priority: Priority.Critica,
      status: Status.Resuelta,
    },
    {
      title: 'Solicitud de mouse ergonómico',
      description: 'El colaborador presenta dolor en el túnel carpiano y solicita dispositivo avalado por SST.',
      applicant: 'Camila Reyes',
      category: Category.Otros,
      priority: Priority.Baja,
      status: Status.Cancelada,
    },
    {
      title: 'Error de compilación en Docker local',
      description: 'El contenedor de backend no levanta las dependencias al ejecutar npm install dentro del volumen.',
      applicant: 'Diego Navarro',
      category: Category.Software,
      priority: Priority.Alta,
      status: Status.En_progreso,
    },
  ];

  for (const t of tickets) {
    const created = await prisma.ticket.create({
      data: t,
    });

    // Historial inicial
    await prisma.ticketHistory.create({
      data: {
        ticketId: created.id,
        previousStatus: Status.Pendiente,
        newStatus: Status.Pendiente,
        responsible: t.applicant,
        observation: 'Registro inicial de la solicitud.',
      },
    });

    if (t.status === Status.En_progreso) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: created.id,
          previousStatus: Status.Pendiente,
          newStatus: Status.En_progreso,
          responsible: 'Ing. Soporte Nivel 2',
          observation: 'Asignado a especialista para revisión técnica.',
        },
      });
    } else if (t.status === Status.Resuelta) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: created.id,
          previousStatus: Status.Pendiente,
          newStatus: Status.En_progreso,
          responsible: 'Ing. Soporte Nivel 2',
          observation: 'Asignado a especialista de guardia.',
        },
      });
      await prisma.ticketHistory.create({
        data: {
          ticketId: created.id,
          previousStatus: Status.En_progreso,
          newStatus: Status.Resuelta,
          responsible: 'Líder Técnico Infraestructura',
          observation: 'Se reinició el pool de conexiones y se escaló la memoria RAM del contenedor.',
        },
      });
    } else if (t.status === Status.Cancelada) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: created.id,
          previousStatus: Status.Pendiente,
          newStatus: Status.Cancelada,
          responsible: 'Coordinador Administrativo',
          observation: 'Cancelada por duplicidad con solicitud anterior.',
        },
      });
    }
  }

  console.log(`✅ ${tickets.length} solicitudes sembradas exitosamente con su historial.`);
}

main()
  .catch((e) => {
    console.error('Error sembrando datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
