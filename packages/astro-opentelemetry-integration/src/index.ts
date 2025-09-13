import { integration } from "./integration.ts";
import {
	type IntegrationSchema,
	integrationSchema,
} from "./integrationSchema.ts";

// Public API for Astro Open Telemetry Node integration
export { integration, integrationSchema, type IntegrationSchema };

export default integration;
