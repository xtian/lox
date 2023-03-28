import Lox from "./lox.js";
import Token, { literal } from "./Token.js";
import { TokenType } from "./TokenType.js";

export default class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
    return this.tokens;
  }

  private scanToken() {
    switch (this.advance()) {
      case "(":
        return this.addToken(TokenType.LEFT_PAREN);
      case ")":
        return this.addToken(TokenType.RIGHT_PAREN);
      case "{":
        return this.addToken(TokenType.LEFT_BRACE);
      case "}":
        return this.addToken(TokenType.RIGHT_BRACE);
      case ",":
        return this.addToken(TokenType.COMMA);
      case ".":
        return this.addToken(TokenType.DOT);
      case "-":
        return this.addToken(TokenType.MINUS);
      case "+":
        return this.addToken(TokenType.PLUS);
      case ";":
        return this.addToken(TokenType.SEMICOLON);
      case "*":
        return this.addToken(TokenType.STAR);
      case "!":
        return this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
      case "=":
        return this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
      case "<":
        return this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
      case ">":
        return this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
      default:
        return Lox.error(this.line, "Unexpexted character.");
    }
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal: literal = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }
}
