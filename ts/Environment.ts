import assert from "node:assert";
import RuntimeError from "./RuntimeError.js";

import type { Token } from "./Token.js";

export default class Environment {
  readonly enclosing: Environment | null;
  private readonly values: Map<string, any> = new Map();

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing;
  }

  public get(name: Token): any {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);
    if (this.enclosing != null) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public assign(name: Token, value: any): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing != null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  public define(name: string, value: any): void {
    this.values.set(name, value);
  }

  public ancestor(distance: number): Environment {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let environment: Environment | null = this;

    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing;
      assert(environment);
    }

    return environment;
  }

  public getAt(distance: number, name: string): any {
    return this.ancestor(distance).values.get(name);
  }

  public assignAt(distance: number, name: Token, value: any): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }
}
