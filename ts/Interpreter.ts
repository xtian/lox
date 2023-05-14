import Environment from "./Environment.js";
import Lox from "./Lox.js";
import LoxFunction from "./LoxFunction.js";
import Return from "./Return.js";
import RuntimeError from "./RuntimeError.js";
import assert from "node:assert";
import { Token, TokenType } from "./Token.js";
import { isCallable } from "./LoxCallable.js";

import type LoxCallable from "./LoxCallable.js";
import type {
  Assign,
  Binary,
  Call,
  Expr,
  Grouping,
  Literal,
  Logical,
  Unary,
  Variable as ExprVariable,
  Visitor as ExprVisitor,
} from "./Expr.js";

import type {
  Block,
  Expression as StmtExpression,
  Func,
  If,
  Print,
  Return as StmtReturn,
  Stmt,
  Var as StmtVar,
  Visitor as StmtVisitor,
  While,
} from "./Stmt.js";

export default class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
  readonly globals: Environment = new Environment();
  private environment: Environment = this.globals;

  constructor() {
    const Clock = class implements LoxCallable {
      public arity() {
        return 0;
      }

      public call() {
        return performance.now() / 1000;
      }

      public toString() {
        return "<native fn>";
      }
    };

    this.globals.define("clock", new Clock());
  }

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

  public visitCallExpr(expr: Call): any {
    const callee = this.evaluate(expr.callee);
    const args = expr.args.map(this.evaluate.bind(this));

    if (!isCallable(callee)) {
      throw new RuntimeError(expr.paren, "Can only call functions and classes.");
    }

    const func: LoxCallable = callee;

    if (args.length != func.arity()) {
      throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`);
    }

    return func.call(this, args);
  }

  public visitGroupingExpr(expr: Grouping): any {
    return this.evaluate(expr.expression);
  }

  public visitLiteralExpr(expr: Literal): any {
    return expr.value;
  }

  public visitLogicalExpr(expr: Logical): any {
    const left = this.evaluate(expr.left);

    if (expr.operator.type == TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
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
    if (typeof object === "string") return `"${object}"`;
    return object.toString();
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  public executeBlock(statements: Stmt[], environment: Environment): void {
    const previous = this.environment;

    try {
      this.environment = environment;
      for (const statement of statements) this.execute(statement);
    } finally {
      this.environment = previous;
    }
  }

  public visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.evaluate(stmt.expression);
  }

  public visitFuncStmt(stmt: Func): void {
    const func = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  public visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
  }

  public visitPrintStmt(stmt: Print): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  public visitReturnStmt(stmt: StmtReturn): void {
    let value = null;
    if (stmt.value != null) value = this.evaluate(stmt.value);

    throw new Return(value);
  }

  public visitVarStmt(stmt: StmtVar): void {
    let value = null;
    if (stmt.initializer != null) value = this.evaluate(stmt.initializer);

    this.environment.define(stmt.name.lexeme, value);
  }

  public visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) this.execute(stmt.body);
  }

  public visitAssignExpr(expr: Assign) {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }
}
