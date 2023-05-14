import Lox from "./Lox.js";

import type Interpreter from "./Interpreter.js";
import type { Token } from "./Token.js";

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

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly scopes: { [key: string]: boolean }[] = [];

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  public visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitExpressionStmt(stmt: StmtExpression): void {
    this.resolve(stmt.expression);
  }

  public visitFuncStmt(stmt: Func): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunc(stmt);
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

  public visitGroupingExpr(expr: Grouping): void {
    this.resolve(expr.expression);
  }

  public visitLiteralExpr(_expr: Literal): void {}

  public visitLogicalExpr(expr: Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitUnaryExpr(expr: Unary): void {
    this.resolve(expr.right);
  }

  public visitVariableExpr(expr: ExprVariable): void {
    const scope = this.scopes[this.scopes.length - 1];

    if (scope && scope[expr.name.lexeme] === false) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  private resolve(arg: Expr | Stmt | Stmt[]): void {
    if (Array.isArray(arg)) {
      for (const statement of arg) this.resolve(statement);
    } else {
      arg.accept(this);
    }
  }

  private resolveFunc(func: Func): void {
    this.beginScope();

    for (const param of func.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(func.body);
    this.endScope();
  }

  private beginScope(): void {
    this.scopes.push({});
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope) scope[name.lexeme] = false;
  }

  private define(name: Token): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope) scope[name.lexeme] = true;
  }

  private resolveLocal(expr: Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const scope = this.scopes[i];

      if (scope && scope[name.lexeme] !== undefined) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
