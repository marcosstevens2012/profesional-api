// Type extensions for Express Request
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      requestId?: string;
      user?: {
        sub: string;
        email: string;
        name: string;
        roles: string[];
      };
    }
  }
}

export {};
