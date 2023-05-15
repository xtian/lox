#!/usr/bin/env bun

import { createWriteStream, WriteStream } from "node:fs";
import { argv, exit } from "node:process";

class GenerateAst {
  static main(args: string[]): void {
    if (args.length != 1 || !args[0]) {
      console.log("Usage: generateAst.ts <output directory>");
      exit(64);
    }

    const outputDir = args[0];

    this.defineAst(
      outputDir,
      "Expr",
      ["Token"],
      [
        ["Assign", "name: Token, value: Expr"],
        ["Binary", "left: Expr, operator: Token, right: Expr"],
        ["Call", "callee: Expr, paren: Token, args: Expr[]"],
        ["Get", "object: Expr, name: Token"],
        ["Grouping", "expression: Expr"],
        ["Literal", "value: any"],
        ["Logical", "left: Expr, operator: Token, right: Expr"],
        ["Set", "object: Expr, name: Token, value: Expr"],
        ["Unary", "operator: Token, right: Expr"],
        ["Variable", "name: Token"],
      ]
    );

    this.defineAst(
      outputDir,
      "Stmt",
      ["Expr", "Token"],
      [
        ["Block", "statements: Stmt[]"],
        ["Class", "name: Token, methods: Func[]"],
        ["Expression", "expression: Expr"],
        ["Func", "name: Token, params: Token[], body: Stmt[]"],
        ["If", "condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null"],
        ["Print", "expression: Expr"],
        ["Return", "keyword: Token, value: Expr | null"],
        ["Var", "name: Token, initializer: Expr | null"],
        ["While", "condition: Expr, body: Stmt"],
      ]
    );
  }

  private static defineAst(
    outputDir: string,
    baseName: string,
    imports: string[],
    types: [string, string][]
  ): void {
    const path = `${outputDir}/${baseName}.ts`;
    const writer = createWriteStream(path);

    for (const name of imports) {
      writer.write(`import type { ${name} } from "./${name}.js";\n`);
    }

    if (imports.length > 0) writer.write("\n");

    writer.write(`export abstract class ${baseName} {\n`);
    writer.write("  abstract accept<R>(visitor: Visitor<R>): R;\n");
    writer.write("}\n");

    this.defineVisitor(writer, baseName, types);

    // The AST classes
    for (const [className, fields] of types) {
      writer.write("\n");
      this.defineType(writer, baseName, className, fields);
    }

    writer.end();
  }

  private static defineVisitor(writer: WriteStream, baseName: string, types: [string, string][]): void {
    writer.write(`\nexport interface Visitor<R> {\n`);

    for (const [typeName] of types) {
      writer.write(`  visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): R;\n`);
    }

    writer.write("}\n");
  }

  private static defineType(
    writer: WriteStream,
    baseName: string,
    className: string,
    fieldList: string
  ): void {
    const fields = fieldList.split(", ");

    writer.write(`export class ${className} extends ${baseName} {\n`);

    // Fields
    for (const field of fields) {
      writer.write(`  readonly ${field};\n`);
    }

    writer.write("\n");

    // Constructor
    writer.write(`  constructor(${fieldList}) {\n`);
    writer.write(`    super();\n\n`);

    // Store parameters in fields
    for (const field of fields) {
      const name = field.split(": ")[0];
      writer.write(`    this.${name} = ${name};\n`);
    }

    writer.write("  }\n\n");

    // Visitor pattern
    writer.write(`  accept<R>(visitor: Visitor<R>): R {\n`);
    writer.write(`    return visitor.visit${className}${baseName}(this);\n`);
    writer.write("  }\n");

    writer.write("}\n");
  }
}

GenerateAst.main(argv.slice(2));
