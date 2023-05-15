import Lox from "./Lox.js";

import type Interpreter from "./Interpreter.js";
import type { Token } from "./Token.js";

import type * as Expr from "./Expr.js";
import type * as Stmt from "./Stmt.js";

const enum FunctionType {
  NONE,
  FUNCTION,
  METHOD,
}

const enum ClassType {
  NONE,
  CLASS,
}

export default class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  private readonly interpreter: Interpreter;
  private readonly scopes: Map<string, boolean>[] = [];
  private currentClass = ClassType.NONE;
  private currentFunction = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  public visitBlockStmt(stmt: Stmt.Block): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitClassStmt(stmt: Stmt.Class): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;
    this.declare(stmt.name);
    this.define(stmt.name);

    this.beginScope();
    const scope = this.scopes[this.scopes.length - 1];
    if (scope) scope.set("this", true);

    for (const method of stmt.methods) this.resolveFunction(method, FunctionType.METHOD);
    this.endScope();
    this.currentClass = enclosingClass;
  }

  public visitExpressionStmt(stmt: Stmt.Expression): void {
    this.resolve(stmt.expression);
  }

  public visitFuncStmt(stmt: Stmt.Func): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  public visitIfStmt(stmt: Stmt.If): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch != null) this.resolve(stmt.elseBranch);
  }

  public visitPrintStmt(stmt: Stmt.Print): void {
    this.resolve(stmt.expression);
  }

  public visitReturnStmt(stmt: Stmt.Return): void {
    if (this.currentFunction == FunctionType.NONE) {
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value != null) this.resolve(stmt.value);
  }

  public visitVarStmt(stmt: Stmt.Var): void {
    this.declare(stmt.name);
    if (stmt.initializer != null) this.resolve(stmt.initializer);
    this.define(stmt.name);
  }

  public visitWhileStmt(stmt: Stmt.While): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  public visitAssignExpr(expr: Expr.Assign): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitBinaryExpr(expr: Expr.Binary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitCallExpr(expr: Expr.Call): void {
    this.resolve(expr.callee);
    for (const arg of expr.args) this.resolve(arg);
  }

  public visitGetExpr(expr: Expr.Get): void {
    this.resolve(expr.object);
  }

  public visitGroupingExpr(expr: Expr.Grouping): void {
    this.resolve(expr.expression);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public visitLiteralExpr(): void {}

  public visitLogicalExpr(expr: Expr.Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitSetExpr(expr: Expr.Set): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  public visitThisExpr(expr: Expr.This): void {
    if (this.currentClass == ClassType.NONE) Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
    this.resolveLocal(expr, expr.keyword);
  }

  public visitUnaryExpr(expr: Expr.Unary): void {
    this.resolve(expr.right);
  }

  public visitVariableExpr(expr: Expr.Variable): void {
    const scope = this.scopes[this.scopes.length - 1];

    if (scope && scope.get(expr.name.lexeme) === false) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  public resolve(arg: Expr.Expr | Stmt.Stmt | Stmt.Stmt[]): void {
    if (Array.isArray(arg)) {
      for (const statement of arg) this.resolve(statement);
    } else {
      arg.accept(this);
    }
  }

  private resolveFunction(func: Stmt.Func, type: FunctionType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;
    this.beginScope();

    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(func.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push(new Map());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (!scope) return;

    if (scope.has(name.lexeme)) Lox.error(name, "Already a variable with this name in this scope.");
    scope.set(name.lexeme, false);
  }

  private define(name: Token): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope) scope.set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr.Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];

      if (scope && scope.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
