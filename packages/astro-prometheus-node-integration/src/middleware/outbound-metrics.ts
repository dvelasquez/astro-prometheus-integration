import { defineMiddleware } from "astro/middleware";
import { initializeOutboundObserver } from "../outbound/observer.js";

let initialized = false;

export const onRequest = defineMiddleware(async (_context, next) => {
	if (!initialized) {
		initializeOutboundObserver();
		initialized = true;
	}
	return next();
});
