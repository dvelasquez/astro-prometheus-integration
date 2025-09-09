export const ALLOWED_ADAPTERS = ["@astrojs/node"];
export const INTEGRATION_NAME = "astro-opentelemetry-integration";
export const GET_APP_CONSOLE_NAME = () => {
	const formattedTime = new Date().toLocaleTimeString("en-US", {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
	return `\x1b[90m${formattedTime}\x1b[0m \x1b[34m[${INTEGRATION_NAME}]\x1b[0m`;
};
