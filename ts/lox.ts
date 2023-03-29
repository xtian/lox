#!/usr/bin/env bun

import { argv, exit } from "node:process";
import AstPrinter from "./AstPrinter.js";
import Parser from "./Parser.js";
import Scanner from "./Scanner.js";
import Token, { TokenType } from "./Token.js";

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

    // Indicate an error in the exit code
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
    const tokens = new Scanner(source).scanTokens();
    const expression = new Parser(tokens).parse();

    // Stop if there was a syntax error
    if (this.hadError || !expression) return;

    console.log(new AstPrinter().print(expression));
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error${where}: ${message}`);
    this.hadError = true;
  }

  static error(value: Token | number, message: string): void {
    if (value instanceof Token) {
      const token = value;

      if (token.type == TokenType.EOF) {
        this.report(token.line, " at end", message);
      } else {
        this.report(token.line, ` at '${token.lexeme}'`, message);
      }
    } else {
      const line = value;

      this.report(line, "", message);
    }
  }
}

await Lox.main(argv.slice(2));
