# `astro-prometheus-integration`

This is an [Astro integration](https://docs.astro.build/en/guides/integrations-guide/) that TODO:description

## Usage

### Prerequisites

TODO:

### Installation

Install the integration **automatically** using the Astro CLI:

```bash
pnpm astro add astro-prometheus-integration
```

```bash
npx astro add astro-prometheus-integration
```

```bash
yarn astro add astro-prometheus-integration
```

Or install it **manually**:

1. Install the required dependencies

```bash
pnpm add astro-prometheus-integration
```

```bash
npm install astro-prometheus-integration
```

```bash
yarn add astro-prometheus-integration
```

2. Add the integration to your astro config

```diff
+import integration from "astro-prometheus-integration";

export default defineConfig({
  integrations: [
+    integration(),
  ],
});
```

### Configuration

TODO:configuration

## Contributing

This package is structured as a monorepo:

- `playground` contains code for testing the package
- `package` contains the actual package

Install dependencies using pnpm: 

```bash
pnpm i --frozen-lockfile
```

Start the playground and package watcher:

```bash
pnpm dev
```

You can now edit files in `package`. Please note that making changes to those files may require restarting the playground dev server.

## Licensing

[MIT Licensed](https://github.com/TODO:/blob/main/LICENSE). Made with ❤️ by [TODO:](https://github.com/TODO:).

## Acknowledgements

- Created using [astro-integration-template](https://github.com/florian-lefebvre/astro-integration-template).
- TODO: