import { test, expect } from "bun:test";
import Lox from "../Lox.js";

test("fibonacci", async () => {
  let result = "";
  console.log = (...args) => (result += args.join(" ") + "\n");

  await Lox.main([`${__dirname}/fibonacci.lox`]);
  expect(result).toMatchSnapshot();
});
