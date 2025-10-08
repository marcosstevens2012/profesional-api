import { Injectable, Logger, LoggerService } from "@nestjs/common";
import * as Sentry from "@sentry/node";
import { PostHog } from "posthog-node";
import { validateEnvironment } from "./environment.schema";

@Injectable()
export class ObservabilityService implements LoggerService {
  private readonly logger = new Logger(ObservabilityService.name);
  private posthog: PostHog | null = null;
  private config = validateEnvironment();

  constructor() {
    this.initializeSentry();
    this.initializePostHog();
  }

  private initializeSentry() {
    if (this.config.SENTRY_DSN) {
      Sentry.init({
        dsn: this.config.SENTRY_DSN,
        environment: this.config.NODE_ENV,
        tracesSampleRate: this.config.NODE_ENV === "production" ? 0.1 : 1.0,
        debug: this.config.NODE_ENV === "development",
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }),
        ],
        beforeSend: event => {
          // Filter out health check noise
          if (event.request?.url?.includes("/health")) {
            return null;
          }
          return event;
        },
      });

      this.logger.log("Sentry initialized for error tracking");
    }
  }

  private initializePostHog() {
    if (this.config.POSTHOG_KEY) {
      this.posthog = new PostHog(this.config.POSTHOG_KEY, {
        host: "https://app.posthog.com",
      });

      this.logger.log("PostHog initialized for analytics");
    }
  }

  // Logger interface implementation
  log(message: any, context?: string) {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, trace, context);

    if (message instanceof Error) {
      Sentry.captureException(message);
    } else {
      Sentry.captureMessage(message, "error");
    }
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, context);
    Sentry.captureMessage(message, "warning");
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, context);
  }

  // Business analytics
  trackBusinessEvent(
    event: string,
    properties: Record<string, any>,
    userId?: string
  ) {
    if (this.posthog) {
      this.posthog.capture({
        distinctId: userId || "system",
        event,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          environment: this.config.NODE_ENV,
        },
      });
    }
  }

  // User identification
  identifyUser(userId: string, properties: Record<string, any>) {
    if (this.posthog) {
      this.posthog.identify({
        distinctId: userId,
        properties,
      });
    }

    Sentry.setUser({
      id: userId,
      ...properties,
    });
  }

  // Business-specific tracking methods
  trackBookingEvent(
    event: "created" | "confirmed" | "cancelled" | "completed",
    bookingId: string,
    data: any
  ) {
    this.trackBusinessEvent(`booking_${event}`, {
      booking_id: bookingId,
      ...data,
    });
  }

  trackPaymentEvent(
    event: "initiated" | "completed" | "failed" | "refunded",
    paymentId: string,
    data: any
  ) {
    this.trackBusinessEvent(`payment_${event}`, {
      payment_id: paymentId,
      ...data,
    });
  }

  trackUserEvent(
    event: "registered" | "login" | "logout",
    userId: string,
    data: any
  ) {
    this.trackBusinessEvent(
      `user_${event}`,
      {
        user_id: userId,
        ...data,
      },
      userId
    );
  }

  trackProfessionalEvent(
    event: "applied" | "approved" | "rejected" | "suspended",
    professionalId: string,
    data: any
  ) {
    this.trackBusinessEvent(`professional_${event}`, {
      professional_id: professionalId,
      ...data,
    });
  }

  trackAdminEvent(event: string, adminId: string, targetId: string, data: any) {
    this.trackBusinessEvent(
      `admin_${event}`,
      {
        admin_id: adminId,
        target_id: targetId,
        ...data,
      },
      adminId
    );
  }

  // Performance monitoring
  trackPerformance(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: any
  ) {
    this.trackBusinessEvent("performance_metric", {
      operation,
      duration_ms: duration,
      success,
      ...metadata,
    });
  }

  // Error context
  setContext(key: string, data: any) {
    Sentry.setContext(key, data);
  }

  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  // Cleanup
  async shutdown() {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
    await Sentry.close(2000);
  }
}
