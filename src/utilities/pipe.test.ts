import { describe, expect, it } from "vitest";
import { pipe } from "./pipe";

describe("pipe", () => {
  const add = (a: number) => (b: number) => a + b;
  const add1 = add(1);

  it("pipes many times", () => {
    const result = pipe([0, 1, 2])
      ._((a) => a.map(add1)) // [1, 2, 3]
      ._((a) => a.map((n) => n.toString())) // ["1", "2", "3"]
      ._((nums) => nums.reduce((prev, curr) => prev + curr)) // "123"
      ._(Number) // 123
      .done();

    expect(result).toBe(123);
  });
});
