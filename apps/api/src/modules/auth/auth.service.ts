import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { memoryDb } from '@prosumate/database';
import { config } from '../../config';
import { RegisterInput, LoginInput } from '@prosumate/validation';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../common/errors';
import {
  AgencyRole,
  LocationRole,
  AuditAction,
  AuthTokens,
  User,
  Agency,
  Location,
} from '@prosumate/types';

export class AuthService {
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  private verifyPassword(password: string, hash: string): boolean {
    // Also support simple test hash for seeded accounts if needed
    if (hash.length === 64 && /^[0-9a-f]+$/i.test(hash)) {
      const testHash = crypto.createHash('sha256').update(password).digest('hex');
      return testHash === hash;
    }
    return bcrypt.compareSync(password, hash);
  }

  private generateTokens(userId: string, email: string, isPlatformAdmin: boolean, agencyId?: string, locationId?: string): AuthTokens {
    const accessToken = jwt.sign(
      {
        sub: userId,
        email,
        isPlatformAdmin,
        agencyId,
        locationId,
      },
      config.jwtSecret,
      { expiresIn: '15m' }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.jwtRefreshExpiresInDays);

    memoryDb.createSession({
      userId,
      refreshTokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
    };
  }

  async register(input: RegisterInput, ipAddress?: string): Promise<{
    user: User;
    agency: Agency;
    location: Location;
    tokens: AuthTokens;
  }> {
    const existing = memoryDb.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError(`User with email '${input.email}' already exists`);
    }

    const passwordHash = this.hashPassword(input.password);

    // 1. Create User
    const userRecord = memoryDb.createUser({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      isPlatformAdmin: false,
    });

    // 2. Create Agency
    const agency = memoryDb.createAgency({
      name: input.agencyName,
      billingTier: 'starter',
    });

    // 3. Create Initial Location
    const locationName = input.initialLocationName || `${input.agencyName} Main`;
    const location = memoryDb.createLocation({
      agencyId: agency.id,
      name: locationName,
    });

    // 4. Assign Memberships
    memoryDb.createAgencyMembership({
      userId: userRecord.id,
      agencyId: agency.id,
      role: AgencyRole.OWNER,
    });

    memoryDb.createLocationMembership({
      userId: userRecord.id,
      locationId: location.id,
      role: LocationRole.LOCATION_ADMIN,
    });

    // 5. Generate Auth Tokens
    const tokens = this.generateTokens(userRecord.id, userRecord.email, false, agency.id, location.id);

    // 6. Record Audit Logs
    memoryDb.addAuditLog({
      agencyId: agency.id,
      actorId: userRecord.id,
      actorEmail: userRecord.email,
      action: AuditAction.USER_REGISTERED,
      entityType: 'user',
      entityId: userRecord.id,
      metadata: { email: userRecord.email, agencyId: agency.id },
      ipAddress,
    });

    memoryDb.addAuditLog({
      agencyId: agency.id,
      actorId: userRecord.id,
      actorEmail: userRecord.email,
      action: AuditAction.AGENCY_CREATED,
      entityType: 'agency',
      entityId: agency.id,
      metadata: { name: agency.name },
      ipAddress,
    });

    memoryDb.addAuditLog({
      agencyId: agency.id,
      locationId: location.id,
      actorId: userRecord.id,
      actorEmail: userRecord.email,
      action: AuditAction.LOCATION_CREATED,
      entityType: 'location',
      entityId: location.id,
      metadata: { name: location.name },
      ipAddress,
    });

    const { passwordHash: _, ...safeUser } = userRecord;
    return {
      user: safeUser,
      agency,
      location,
      tokens,
    };
  }

  async login(input: LoginInput, ipAddress?: string): Promise<{
    user: User;
    tokens: AuthTokens;
    agencies: Agency[];
    locations: Location[];
  }> {
    const user = memoryDb.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is inactive or suspended');
    }

    const isValid = this.verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Resolve tenant memberships
    const agencyMemberships = memoryDb.getUserAgencyMemberships(user.id);
    const agencies = agencyMemberships
      .map((m) => memoryDb.findAgencyById(m.agencyId))
      .filter((a): a is Agency => a !== undefined);

    const locationMemberships = memoryDb.getUserLocationMemberships(user.id);
    const locations = locationMemberships
      .map((m) => memoryDb.findLocationById(m.locationId))
      .filter((l): l is Location => l !== undefined);

    const primaryAgency = agencies[0];
    const primaryLocation = locations[0];

    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.isPlatformAdmin,
      primaryAgency?.id,
      primaryLocation?.id
    );

    memoryDb.addAuditLog({
      agencyId: primaryAgency?.id,
      locationId: primaryLocation?.id,
      actorId: user.id,
      actorEmail: user.email,
      action: AuditAction.USER_LOGIN,
      entityType: 'session',
      entityId: user.id,
      ipAddress,
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      user: safeUser,
      tokens,
      agencies,
      locations,
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<AuthTokens> {
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const session = memoryDb.findSessionByTokenHash(refreshTokenHash);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = memoryDb.findUserById(session.userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('User not found or suspended');
    }

    // Rotate refresh token
    memoryDb.revokeSession(session.id);

    const agencyMemberships = memoryDb.getUserAgencyMemberships(user.id);
    const primaryAgencyId = agencyMemberships[0]?.agencyId;

    return this.generateTokens(user.id, user.email, user.isPlatformAdmin, primaryAgencyId);
  }

  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const session = memoryDb.findSessionByTokenHash(refreshTokenHash);
      if (session) {
        memoryDb.revokeSession(session.id);
      }
    } else {
      memoryDb.revokeAllUserSessions(userId);
    }

    const user = memoryDb.findUserById(userId);
    if (user) {
      memoryDb.addAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        action: AuditAction.USER_LOGOUT,
        entityType: 'session',
        entityId: user.id,
      });
    }
  }

  async getCurrentProfile(userId: string) {
    const user = memoryDb.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const agencyMemberships = memoryDb.getUserAgencyMemberships(user.id).map((m) => {
      const agency = memoryDb.findAgencyById(m.agencyId);
      return {
        agency,
        role: m.role,
      };
    });

    const locationMemberships = memoryDb.getUserLocationMemberships(user.id).map((m) => {
      const location = memoryDb.findLocationById(m.locationId);
      return {
        location,
        role: m.role,
        permissionsOverride: m.permissionsOverride,
      };
    });

    const { passwordHash: _, ...safeUser } = user;
    return {
      user: safeUser,
      agencies: agencyMemberships,
      locations: locationMemberships,
    };
  }
}

export const authService = new AuthService();
