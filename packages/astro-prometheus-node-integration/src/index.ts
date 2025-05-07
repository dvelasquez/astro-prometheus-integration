import * as Prometheus from "prom-client";
import { integration, integrationSchema } from "./integration.js";

// Public API for Astro Prometheus Node integration
export { integration, integrationSchema, Prometheus };

export default integration;
