import { beforeAll, beforeEach, test, expect } from "bun:test";
import Lox from "../Lox.js";

let result = "";

beforeAll(() => {
  console.log = (...args) => (result += args.join(" ") + "\n");
});

beforeEach(() => {
  result = "";
});

test("fibonacci", async () => {
  await Lox.main([`${__dirname}/fibonacci.lox`]);
  expect(result).toMatchSnapshot();
});

test("inheritance", async () => {
  await Lox.main([`${__dirname}/inheritance.lox`]);
  expect(result).toMatchSnapshot();
});
