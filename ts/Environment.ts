import RuntimeError from "./RuntimeError.js";

import type { Token } from "./Token.js";

export default class Environment {
  readonly enclosing: Environment | null;
  private readonly values: { [key: string]: any } = {};

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  public get(name: Token): any {
    const value = this.values[name.lexeme];
    if (value !== undefined) return value;
    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public assign(name: Token, value: any): void {
    if (this.values[name.lexeme] !== undefined) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public define(name: string, value: any): void {
    this.values[name] = value;
  }
}
