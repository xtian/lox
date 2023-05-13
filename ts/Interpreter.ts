import assert from "node:assert";
import Environment from "./Environment.js";
import { Binary, Expr, Grouping, Literal, Unary } from "./Expr.js";
import Lox from "./lox.js";
import RuntimeError from "./RuntimeError.js";
import { Token, TokenType } from "./Token.js";

import type { Variable as ExprVariable, Visitor as ExprVisitor } from "./Expr.js";
import type {
  Expression as StmtExpression,
  Print as StmtPrint,
  Stmt,
  Var as StmtVar,
  Visitor as StmtVisitor,
} from "./Stmt.js";

export default class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
  private environment: Environment = new Environment();

  public interpret(statements: Stmt[]): void {
    try {
      for (const statement of statements) this.execute(statement);
    } catch (error) {
      if (error instanceof RuntimeError) return Lox.runtimeError(error);
      throw error;
    }
  }

  public visitBinaryExpr(expr: Binary): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);

      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);

      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return left > right;

      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return left >= right;

      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return left < right;

      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return left <= right;

      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return left - right;

      case TokenType.PLUS:
        if (typeof left === "number" && typeof right === "number") return left + right;
        if (typeof left === "string" && typeof right === "string") return left + right;

        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings");

      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return left / right;

      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return left * right;
    }

    assert(false);
  }

  public visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression);
  }

  public visitLiteralExpr(expr: Literal): any {
    return expr.value;
  }

  public visitUnaryExpr(expr: Unary): any {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, right);
        return -right;
    }

    assert(false);
  }

  public visitVariableExpr(expr: ExprVariable): any {
    return this.environment.get(expr.name);
  }

  private checkNumberOperands(operator: Token, ...operands: any[]): void {
    if (operands.every((o) => typeof o === "number")) return;
    if (operands.length > 1) throw new RuntimeError(operator, "Operands must be numbers.");
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  private isTruthy(value: any): boolean {
    if (value == null) return false;
    if (typeof value === "boolean") return value;

    return true;
  }

  private isEqual(a: any, b: any): boolean {
    if (a == null && b == null) return true;
    return a === b;
  }

  private stringify(object: any): string {
    if (object == null) return "nil";
    return object.toString();
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.evaluate(stmt.expression);
  }

  public visitPrintStmt(stmt: StmtPrint): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  public visitVarStmt(stmt: StmtVar): void {
    let value = null;
    if (stmt.initializer != null) value = this.evaluate(stmt.initializer);

    this.environment.define(stmt.name.lexeme, value);
  }
}