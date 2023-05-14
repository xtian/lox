import Lox from "./lox.js";
import { Token, TokenType } from "./Token.js";

export default class Scanner {
  private static readonly keywords: { [key: string]: TokenType } = {};

  static {
    this.keywords["and"] = TokenType.AND;
    this.keywords["class"] = TokenType.CLASS;
    this.keywords["else"] = TokenType.ELSE;
    this.keywords["false"] = TokenType.FALSE;
    this.keywords["for"] = TokenType.FOR;
    this.keywords["fun"] = TokenType.FUN;
    this.keywords["if"] = TokenType.IF;
    this.keywords["nil"] = TokenType.NIL;
    this.keywords["or"] = TokenType.OR;
    this.keywords["print"] = TokenType.PRINT;
    this.keywords["return"] = TokenType.RETURN;
    this.keywords["super"] = TokenType.SUPER;
    this.keywords["this"] = TokenType.THIS;
    this.keywords["true"] = TokenType.TRUE;
    this.keywords["var"] = TokenType.VAR;
    this.keywords["while"] = TokenType.WHILE;
  }

  private readonly source: string;
  private readonly tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

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

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
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
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }

        break;

      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;

      case "\n":
        this.line++;
        break;

      case '"':
        return this.string();

      default:
        if (this.isDigit(c)) return this.number();
        if (this.isAlpha(c)) return this.identifier();
        return Lox.error(this.line, "Unexpected character.");
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);

    this.addToken(Scanner.keywords[text] || TokenType.IDENTIFIER);
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part
    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      // Consume the `.`
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }

  private string(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) return Lox.error(this.line, "Unterminated string.");

    // The closing `"`
    this.advance();

    // Trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c == "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(tokenType: TokenType, literal: any = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(tokenType, text, literal, this.line));
  }
}
