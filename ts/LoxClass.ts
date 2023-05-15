import LoxInstance from "./LoxInstance.js";

import type Interpreter from "./Interpreter.js";
import type LoxCallable from "./LoxCallable.js";
import type LoxFunction from "./LoxFunction.js";

export default class LoxClass implements LoxCallable {
  readonly name: string;
  readonly superclass: LoxClass | null;
  private readonly methods: Map<string, LoxFunction>;

  constructor(name: string, superclass: LoxClass | null, methods: Map<string, LoxFunction>) {
    this.superclass = superclass;
    this.name = name;
    this.methods = methods;
  }

  public findMethod(name: string): LoxFunction | undefined {
    return this.methods.get(name) || this.superclass?.findMethod(name);
  }

  public toString(): string {
    return this.name;
  }

  public call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);

    const initializer = this.findMethod("init");
    if (initializer != null) initializer.bind(instance).call(interpreter, args);

    return instance;
  }

  public arity(): number {
    const initializer = this.findMethod("init");
    if (initializer == null) return 0;
    return initializer.arity();
  }
}
