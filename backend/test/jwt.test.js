import { describe, it, expect, vi, beforeEach } from "vitest";
import { protect } from "../middleware/authMiddleware.js";

// Mock delle dipendenze
vi.mock('jsonwebtoken');
vi.mock('jwks-rsa');
vi.mock('axios');

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';

describe("Controllo token di sessione", () => {
  let req, res, next;

  beforeEach(() => {
    // Reset dei mock
    vi.clearAllMocks();

    // Setup request/response mock
    req = {
      headers: {},
      cookies: {},
      accessToken: null
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis()
    };

    next = vi.fn();

    // Mock jwksClient
    jwksClient.mockReturnValue({
      getSigningKey: vi.fn((kid, callback) => {
        callback(null, {
          getPublicKey: () => 'mocked-public-key'
        });
      })
    });
  });

  it("access_token presente e valido", async () => {
    const mockDecoded = {
      sub: 'user-123',
      email: 'test@example.com',
      preferred_username: 'testuser',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600,
      realm_access: { roles: ['user'] }
    };

    // Mock jwt.verify per restituire un token valido
    jwt.verify.mockImplementation((token, getKey, options, callback) => {
      callback(null, mockDecoded);
    });

    req.cookies['access_token'] = 'valid-token-here';

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(expect.objectContaining({
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser'
    }));
  });

  it("access_token mancante, refresh_token presente", async () => {
    const mockDecoded = {
      sub: 'user-456',
      email: 'refresh@example.com',
      preferred_username: 'refreshuser',
      exp: Math.floor(Date.now() / 1000) + 3600,
      realm_access: { roles: ['user'] }
    };

    // Mock refresh token success
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 300
      }
    });

    // Mock jwt.verify per il nuovo token
    jwt.verify.mockImplementation((token, getKey, options, callback) => {
      callback(null, mockDecoded);
    });

    req.cookies['refresh_token'] = 'valid-refresh-token';

    await protect(req, res, next);

    expect(axios.post).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-access-token', expect.any(Object));
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('user-456');
  });

  it("access_token mancante, refresh_token mancante", async () => {
    // Nessun token nei cookies
    req.cookies = {};

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Autenticazione richiesta' });
    expect(next).not.toHaveBeenCalled();
  });

  it("access_token scaduto, refresh_token valido", async () => {
    const expiredError = new Error('Token expired');
    expiredError.name = 'TokenExpiredError';

    const mockDecoded = {
      sub: 'user-789',
      email: 'expired@example.com',
      preferred_username: 'expireduser',
      exp: Math.floor(Date.now() / 1000) + 3600,
      realm_access: { roles: ['user'] }
    };

    // Prima chiamata: token scaduto
    jwt.verify.mockImplementationOnce((token, getKey, options, callback) => {
      callback(expiredError, null);
    });

    // Seconda chiamata (dopo refresh): token valido
    jwt.verify.mockImplementationOnce((token, getKey, options, callback) => {
      callback(null, mockDecoded);
    });

    // Mock refresh success
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'refreshed-token',
        refresh_token: 'new-refresh-token',
        expires_in: 300
      }
    });

    req.cookies['access_token'] = 'expired-token';
    req.cookies['refresh_token'] = 'valid-refresh-token';

    await protect(req, res, next);

    expect(axios.post).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('user-789');
  });
});