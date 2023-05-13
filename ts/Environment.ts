import RuntimeError from "./RuntimeError.js";

import type { Token } from "./Token.js";

export default class Environment {
  private readonly values: { [key: string]: any } = {};

  public get(name: Token): any {
    const value = this.values[name.lexeme];
    if (value !== undefined) return value;

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public assign(name: Token, value: any): void {
    if (this.values[name.lexeme] !== undefined) {
      this.values[name.lexeme] = value;
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public define(name: string, value: any): void {
    this.values[name] = value;
  }
}
