import Environment from "./Environment.js";
import Interpreter from "./Interpreter.js";
import Return from "./Return.js";

import type LoxCallable from "./LoxCallable.js";
import type { Func } from "./Stmt.js";

export default class LoxFunction implements LoxCallable {
  private readonly declaration: Func;
  private readonly closure: Environment;

  constructor(declaration: Func, closure: Environment) {
    this.closure = closure;
    this.declaration = declaration;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: any[]): any {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      if (param === undefined) continue;

      environment.define(param.lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (error instanceof Return) return error.value;
      throw error;
    }

    return null;
  }
}
