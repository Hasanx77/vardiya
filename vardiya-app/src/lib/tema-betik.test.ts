import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TEMA_BETIGI, TEMA_BETIGI_HASH } from "./tema-betik";

describe("tema betiği CSP özeti", () => {
  it("CSP'de kullanılan sha256 özeti metinle birebir uyuşuyor", () => {
    const hesaplanan =
      "sha256-" + createHash("sha256").update(TEMA_BETIGI, "utf8").digest("base64");
    expect(hesaplanan).toBe(TEMA_BETIGI_HASH);
  });
});
