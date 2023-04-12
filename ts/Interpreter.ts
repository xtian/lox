import assert from "node:assert";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.js";
import { TokenType } from "./Token.js";

import type { Visitor } from "./Expr.js";

export default class Interpreter implements Visitor<unknown> {
  public visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);

      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);

      case TokenType.GREATER:
        assert(typeof left === "number" && typeof right === "number");
        return left > right;

      case TokenType.GREATER_EQUAL:
        assert(typeof left === "number" && typeof right === "number");
        return left >= right;

      case TokenType.LESS:
        assert(typeof left === "number" && typeof right === "number");
        return left < right;

      case TokenType.LESS_EQUAL:
        assert(typeof left === "number" && typeof right === "number");
        return left <= right;

      case TokenType.MINUS:
        assert(typeof left === "number" && typeof right === "number");
        return left - right;

      case TokenType.PLUS:
        if (typeof left !== "string" || typeof left !== "number") break;
        if (typeof right !== "string" || typeof right !== "number") break;
        if (typeof left !== typeof right) break;

        return left + right;

      case TokenType.SLASH:
        assert(typeof left === "number" && typeof right === "number");
        return left / right;

      case TokenType.STAR:
        assert(typeof left === "number" && typeof right === "number");
        return left * right;
    }

    assert(false);
  }

  public visitGroupingExpr(expr: Grouping): unknown {
    return this.evaluate(expr.expression);
  }

  public visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  public visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        assert(typeof right === "number");
        return -right;
    }

    assert(false);
  }

  private isTruthy(value: unknown): boolean {
    if (value == null) return false;
    if (typeof value === "boolean") return value;

    return true;
  }

  private isEqual(a: unknown, b: unknown): boolean {
    if (a == null && b == null) return true;
    return a === b;
  }

  private evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }
}
