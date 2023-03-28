import { TokenType } from "./TokenType.js";

export type literal = unknown;

export default class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: literal;
  readonly line: number;

  constructor(type: TokenType, lexeme: string, literal: literal, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
