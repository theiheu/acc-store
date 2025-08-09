import { describe, it, expect } from "vitest";
import { getProductById, products } from "./products";

describe("getProductById", () => {
  it("returns a product when id exists", () => {
    const id = products[0].id;
    const p = getProductById(id);
    expect(p).not.toBeNull();
    expect(p!.id).toBe(id);
  });

  it("returns null for unknown id", () => {
    const p = getProductById("unknown-id");
    expect(p).toBeNull();
  });
});

