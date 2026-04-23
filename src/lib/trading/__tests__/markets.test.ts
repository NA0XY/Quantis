import { describe, expect, it } from "vitest";
import { MARKET_SYMBOLS } from "@/lib/trading/markets";

describe("MARKET_SYMBOLS", () => {
  it("contains the full supported 41-market universe", () => {
    expect(MARKET_SYMBOLS).toHaveLength(41);
    expect(MARKET_SYMBOLS).toContain("BTCUSDT");
    expect(MARKET_SYMBOLS).toContain("ETHUSDT");
    expect(MARKET_SYMBOLS).toContain("PEPEUSDT");
  });

  it("contains only unique symbols", () => {
    expect(new Set(MARKET_SYMBOLS).size).toBe(MARKET_SYMBOLS.length);
  });

  it("contains only uppercase USDT spot pairs", () => {
    expect(MARKET_SYMBOLS.every((symbol) => /^[A-Z0-9]+USDT$/.test(symbol))).toBe(true);
  });

  it("does not contain blank or nullish entries", () => {
    expect(MARKET_SYMBOLS.every((symbol) => Boolean(symbol?.trim()))).toBe(true);
  });

  it("can safely derive base assets from every configured pair", () => {
    const baseAssets = MARKET_SYMBOLS.map((symbol) => symbol.replace(/USDT$/, ""));

    expect(baseAssets).toContain("BTC");
    expect(baseAssets).toContain("PEPE");
    expect(baseAssets.every((asset) => asset.length > 0 && !asset.includes("USDT"))).toBe(true);
  });
});
