import LoxClass from "./LoxClass.js";
import RuntimeError from "./RuntimeError.js";
import { Token } from "./Token.js";

export default class LoxInstance {
  private loxClass: LoxClass;
  private readonly fields: Map<string, any> = new Map();

  constructor(loxClass: LoxClass) {
    this.loxClass = loxClass;
  }

  public get(name: Token): any {
    if (this.fields.has(name.lexeme)) return this.fields.get(name.lexeme);

    const method = this.loxClass.findMethod(name.lexeme);
    if (method != null) return method.bind(this);

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  public set(name: Token, value: any): void {
    this.fields.set(name.lexeme, value);
  }

  public toString(): string {
    return `${this.loxClass.name} instance`;
  }
}
