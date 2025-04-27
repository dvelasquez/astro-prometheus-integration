import * as Prometheus from "prom-client";
import { integration } from "./integration.js";

// Public API for Astro Prometheus Node integration
export { integration, Prometheus };

export default integration;
