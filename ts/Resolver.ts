import Lox from "./Lox.js";

import type Interpreter from "./Interpreter.js";
import type { Token } from "./Token.js";

import type {
  Assign,
  Binary,
  Call,
  Expr,
  Get,
  Grouping,
  Logical,
  Set as ExprSet,
  Unary,
  Variable as ExprVariable,
  Visitor as ExprVisitor,
} from "./Expr.js";

import type {
  Block,
  Class,
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

const enum FunctionType {
  NONE,
  FUNCTION,
}

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunction = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  public visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitClassStmt(stmt: Class): void {
    this.declare(stmt.name);
    this.define(stmt.name);
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.resolve(stmt.expression);
  }

  public visitFuncStmt(stmt: Func): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  public visitIfStmt(stmt: If): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch != null) this.resolve(stmt.elseBranch);
  }

  public visitPrintStmt(stmt: Print): void {
    this.resolve(stmt.expression);
  }

  public visitReturnStmt(stmt: StmtReturn): void {
    if (this.currentFunction == FunctionType.NONE) {
      Lox.error(stmt.keyword, "Can't return from top-level code.");
    }

    if (stmt.value != null) this.resolve(stmt.value);
  }

  public visitVarStmt(stmt: StmtVar): void {
    this.declare(stmt.name);
    if (stmt.initializer != null) this.resolve(stmt.initializer);
    this.define(stmt.name);
  }

  public visitWhileStmt(stmt: While): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  public visitAssignExpr(expr: Assign): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitBinaryExpr(expr: Binary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitCallExpr(expr: Call): void {
    this.resolve(expr.callee);
    for (const arg of expr.args) this.resolve(arg);
  }

  public visitGetExpr(expr: Get): void {
    this.resolve(expr.object);
  }

  public visitGroupingExpr(expr: Grouping): void {
    this.resolve(expr.expression);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public visitLiteralExpr(): void {}

  public visitLogicalExpr(expr: Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitSetExpr(expr: ExprSet): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  public visitUnaryExpr(expr: Unary): void {
    this.resolve(expr.right);
  }

  public visitVariableExpr(expr: ExprVariable): void {
    const scope = this.scopes[this.scopes.length - 1];

    if (scope && scope.get(expr.name.lexeme) === false) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  public resolve(arg: Expr | Stmt | Stmt[]): void {
    if (Array.isArray(arg)) {
      for (const statement of arg) this.resolve(statement);
    } else {
      arg.accept(this);
    }
  }

  private resolveFunction(func: Func, type: FunctionType): void {
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

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];

      if (scope && scope.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
