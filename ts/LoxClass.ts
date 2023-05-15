import LoxInstance from "./LoxInstance.js";

import type Interpreter from "./Interpreter.js";
import type LoxCallable from "./LoxCallable.js";

export default class LoxClass implements LoxCallable {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  public toString(): string {
    return this.name;
  }

  public call(interpreter: Interpreter, args: any[]) {
    return new LoxInstance(this);
  }

  public arity(): number {
    return 0;
  }
}
