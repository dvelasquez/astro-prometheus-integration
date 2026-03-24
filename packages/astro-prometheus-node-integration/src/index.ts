import * as Prometheus from "prom-client";
import { integration, integrationSchema } from "./integration.js";

export type {
	ObservedEntry,
	OutboundMetricContext,
} from "./outbound/types.js";
// Public API for Astro Prometheus Node integration
export { integration, integrationSchema, Prometheus };

export default integration;
