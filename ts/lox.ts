#!/usr/bin/env bun

import { argv, exit } from "node:process";
import Scanner from "./scanner.js";

export default class Lox {
  static hadError: boolean = false;

  static async main(args: string[]): Promise<void> {
    if (args.length > 1) {
      console.log("Usage: lox.ts [script]");
      exit(64);
    } else if (args.length == 1 && args[0]) {
      await this.runFile(args[0]);
    } else {
      await this.runPrompt();
    }
  }

  private static async runFile(path: string): Promise<void> {
    const fileContents = await Bun.file(path).text();
    this.run(fileContents);

    // Indicate an error in the exit code.
    if (this.hadError) exit(65);
  }

  private static async runPrompt(): Promise<void> {
    console.write("> ");

    for await (const line of console) {
      if (line == null) break;
      this.run(line);
      this.hadError = false;
      console.write("> ");
    }
  }

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    for (const token of tokens) {
      console.log(token);
    }
  }

  static error(line: number, message: string): void {
    this.report(line, "", message);
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`);
    this.hadError = true;
  }
}

await Lox.main(argv.slice(2));
