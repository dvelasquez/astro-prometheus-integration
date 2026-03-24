import { integration } from "./integration.ts";
import {
	type IntegrationSchema,
	integrationSchema,
} from "./integrationSchema.ts";

// Public API for Astro Open Telemetry Node integration
export { type IntegrationSchema, integration, integrationSchema };

export default integration;
