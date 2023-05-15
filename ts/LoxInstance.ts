import LoxClass from "./LoxClass.js";

export default class LoxInstance {
  private loxClass: LoxClass;

  constructor(loxClass: LoxClass) {
    this.loxClass = loxClass;
  }

  public toString(): string {
    return `${this.loxClass.name} instance`;
  }
}
