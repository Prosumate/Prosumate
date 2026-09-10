import { FastifyInstance } from 'fastify';
import { db } from '../../database';
import { sendSuccess } from '../../common/response';
import { authGuard } from '../../common/guards/auth.guard';
import { tenantGuard } from '../../common/guards/tenant.guard';
import { requirePermissions } from '../../common/guards/permission.guard';
import {
  createCalendarSchema,
  bookAppointmentSchema,
  updateAppointmentSchema,
} from '@prosumate/validation';
import { ValidationError, NotFoundError, ConflictError } from '../../common/errors';

export async function calendarRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authGuard);

  // GET /api/v1/locations/:locationId/calendars - List calendars
  fastify.get<{ Params: { locationId: string } }>(
    '/:locationId/calendars',
    { preHandler: [tenantGuard, requirePermissions('calendars:read')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const calendars = db().listCalendarsByLocation(locationId);

      const enriched = calendars.map((cal) => {
        const appts = db().listAppointmentsByCalendar(cal.id);
        const upcoming = appts.filter(
          (a) => a.status === 'scheduled' && new Date(a.startTime) >= new Date()
        );
        return { ...cal, upcomingCount: upcoming.length, totalAppointments: appts.length };
      });

      return sendSuccess(reply, enriched, 200, { total: enriched.length });
    }
  );

  // POST /api/v1/locations/:locationId/calendars - Create calendar
  fastify.post<{ Params: { locationId: string } }>(
    '/:locationId/calendars',
    { preHandler: [tenantGuard, requirePermissions('calendars:manage')] },
    async (request, reply) => {
      const { locationId } = request.params;
      const location = db().findLocationById(locationId);
      if (!location) throw new NotFoundError(`Location '${locationId}' not found`);

      const parseResult = createCalendarSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      try {
        const calendar = db().createCalendar({
          agencyId: location.agencyId,
          locationId,
          ...parseResult.data,
        });
        return sendSuccess(reply, calendar, 201);
      } catch (err: any) {
        if (err.message?.includes('already exists')) throw new ConflictError(err.message);
        throw err;
      }
    }
  );

  // GET /api/v1/locations/:locationId/calendars/:calendarId - Calendar details
  fastify.get<{ Params: { locationId: string; calendarId: string } }>(
    '/:locationId/calendars/:calendarId',
    { preHandler: [tenantGuard, requirePermissions('calendars:read')] },
    async (request, reply) => {
      const { locationId, calendarId } = request.params;
      const calendar = db().findCalendarById(calendarId);
      if (!calendar || calendar.locationId !== locationId) {
        throw new NotFoundError(`Calendar '${calendarId}' not found in this location`);
      }

      const appointments = db().listAppointmentsByCalendar(calendarId);
      const enrichedAppts = appointments.map((a) => {
        const contact = db().findContactById(a.contactId);
        return {
          ...a,
          contactName: contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown',
          contactEmail: contact?.email || null,
        };
      });

      return sendSuccess(reply, { ...calendar, appointments: enrichedAppts }, 200);
    }
  );

  // GET /api/v1/locations/:locationId/calendars/:calendarId/slots - Available slots
  fastify.get<{ Params: { locationId: string; calendarId: string }; Querystring: { date?: string } }>(
    '/:locationId/calendars/:calendarId/slots',
    { preHandler: [tenantGuard, requirePermissions('calendars:read')] },
    async (request, reply) => {
      const { locationId, calendarId } = request.params;
      const { date } = request.query;

      const calendar = db().findCalendarById(calendarId);
      if (!calendar || calendar.locationId !== locationId) {
        throw new NotFoundError(`Calendar '${calendarId}' not found in this location`);
      }

      const dateStr = date || new Date().toISOString().split('T')[0]!;
      const slots = db().getAvailableSlots(calendarId, dateStr);

      return sendSuccess(reply, { date: dateStr, calendarId, slots, totalSlots: slots.length }, 200);
    }
  );

  // POST /api/v1/locations/:locationId/calendars/:calendarId/book - Book appointment
  fastify.post<{ Params: { locationId: string; calendarId: string } }>(
    '/:locationId/calendars/:calendarId/book',
    { preHandler: [tenantGuard, requirePermissions('calendars:manage')] },
    async (request, reply) => {
      const { locationId, calendarId } = request.params;
      const calendar = db().findCalendarById(calendarId);
      if (!calendar || calendar.locationId !== locationId) {
        throw new NotFoundError(`Calendar '${calendarId}' not found in this location`);
      }

      const parseResult = bookAppointmentSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const { contactId, startTime, title, notes } = parseResult.data;

      // Resolve or require contactId
      if (!contactId) {
        throw new ValidationError('contactId is required to book an appointment');
      }

      const contact = db().findContactById(contactId);
      if (!contact || contact.locationId !== locationId) {
        throw new NotFoundError(`Contact '${contactId}' not found in this location`);
      }

      // Calculate endTime from calendar duration
      const start = new Date(startTime);
      const end = new Date(start.getTime() + calendar.defaultDurationMinutes * 60 * 1000);

      try {
        const appointment = db().bookAppointment({
          calendarId,
          agencyId: calendar.agencyId,
          locationId,
          contactId,
          assignedUserId: request.user!.userId,
          title: title || 'Appointment',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: notes || null,
        });

        return sendSuccess(reply, appointment, 201);
      } catch (err: any) {
        if (err.message?.includes('conflict')) throw new ConflictError(err.message);
        throw err;
      }
    }
  );

  // PATCH /api/v1/locations/:locationId/appointments/:appointmentId - Update status
  fastify.patch<{ Params: { locationId: string; appointmentId: string } }>(
    '/:locationId/appointments/:appointmentId',
    { preHandler: [tenantGuard, requirePermissions('calendars:manage')] },
    async (request, reply) => {
      const { locationId, appointmentId } = request.params;
      const appt = db().findAppointmentById(appointmentId);
      if (!appt || appt.locationId !== locationId) {
        throw new NotFoundError(`Appointment '${appointmentId}' not found in this location`);
      }

      const parseResult = updateAppointmentSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed', parseResult.error.flatten());
      }

      const updated = db().updateAppointmentStatus(
        appointmentId,
        parseResult.data.status,
        parseResult.data.notes
      );
      return sendSuccess(reply, updated, 200);
    }
  );
}
