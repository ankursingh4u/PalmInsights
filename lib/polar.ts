import { Polar } from "@polar-sh/sdk";
import { config, polarEnabled } from "./config";

// Lazily-constructed Polar client (server only). Returns null in mock mode.
let _polar: Polar | null = null;

export function getPolar(): Polar | null {
  if (!polarEnabled) return null;
  if (!_polar) {
    _polar = new Polar({
      accessToken: config.polar.accessToken,
      server: config.polar.server,
    });
  }
  return _polar;
}
