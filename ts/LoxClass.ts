import LoxInstance from "./LoxInstance.js";

import type Interpreter from "./Interpreter.js";
import type LoxCallable from "./LoxCallable.js";
import type LoxFunction from "./LoxFunction.js";

export default class LoxClass implements LoxCallable {
  readonly name: string;
  private readonly methods: Map<string, LoxFunction>;

  constructor(name: string, methods: Map<string, LoxFunction>) {
    this.name = name;
    this.methods = methods;
  }

  public findMethod(name: string): LoxFunction | undefined {
    return this.methods.get(name);
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
