import Interpreter from "./Interpreter.js";

export default interface LoxCallable {
  arity(): number;
  call(interpreter: Interpreter, args: any[]): any;
}

export function isCallable(callee: any): callee is LoxCallable {
  return typeof callee.arity === "function" && typeof callee.call === "function";
}
