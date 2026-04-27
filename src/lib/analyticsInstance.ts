// Analytics singleton — shared across App and hooks.
// Module-level to guarantee a single instance throughout the app lifetime.
import { createVercelAnalyticsPort } from '../infrastructure/observability/vercelAnalyticsAdapter';

export const analytics = createVercelAnalyticsPort();
