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

    this.defineAst(outputDir, "Expr", [
      ["Binary", "left: Expr, operator: Token, right: Expr"],
      ["Grouping", "expression: Expr"],
      ["Literal", "value: unknown"],
      ["Unary", "operator: Token, right: Expr"],
    ]);
  }

  private static defineAst(outputDir: string, baseName: string, types: [string, string][]): void {
    const path = `${outputDir}/${baseName}.ts`;
    const writer = createWriteStream(path);

    writer.write('import Token from "./Token.js";\n\n');

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

  private static defineVisitor(
    writer: WriteStream,
    baseName: string,
    types: [string, string][]
  ): void {
    writer.write(`\nexport interface Visitor<R> {\n`);

    for (const [typeName, _fields] of types) {
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
      const [name, _typeName] = field.split(": ");
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
