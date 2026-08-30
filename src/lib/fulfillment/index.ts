import { FulfillmentProvider, ProviderKey } from "./types";
import { PrintifyProvider } from "./printify";

const registry: Partial<Record<ProviderKey, FulfillmentProvider>> = {
  PRINTIFY: new PrintifyProvider(),
  // PRINTFUL: new PrintfulProvider(),  — future
  // MANUAL: handled in-app, no external call
};

export function getProvider(key: ProviderKey): FulfillmentProvider {
  const provider = registry[key];
  if (!provider) throw new Error(`No fulfillment provider registered for ${key}`);
  return provider;
}

export function configuredProviders(): ProviderKey[] {
  return (Object.keys(registry) as ProviderKey[]).filter(
    (key) => registry[key]?.isConfigured
  );
}

export * from "./types";
