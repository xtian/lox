const root = @import("root");
const std = @import("std");
const print = std.debug.print;

const Chunk = @import("./Chunk.zig");
const ValueArray = @import("./ValueArray.zig");
const Value = ValueArray.Value;
const debug = @import("./debug.zig");

const stack_max = 256;

chunk: *Chunk = undefined,
ip: [*]Chunk.OpCode = undefined,
stack: [stack_max]Value = [_]Value{0.0} ** stack_max,
stack_top: [*]Value = undefined,

pub const Result = enum { ok, compile_error, runtime_error };

pub fn init(self: *@This()) void {
    self.resetStack();
}

pub fn free(_: @This()) void {}

pub fn push(self: *@This(), value: Value) void {
    self.stack_top[0] = value;
    self.stack_top += 1;
}

pub fn pop(self: *@This()) Value {
    self.stack_top -= 1;
    return self.stack_top[0];
}

pub fn interpret(self: *@This(), chunk: *Chunk) Result {
    self.chunk = chunk;
    self.ip = chunk.code.ptr;
    return self.run();
}

fn run(self: *@This()) Result {
    while (true) : (self.ip += 1) {
        if (root.debug_trace_execution) {
            print("          ", .{});

            var slot: [*]Value = &self.stack;
            while (@ptrToInt(slot) < @ptrToInt(self.stack_top)) : (slot += 1) {
                print("[ ", .{});
                ValueArray.printValue(slot[0]);
                print(" ]", .{});
            }

            print("\n", .{});
            _ = debug.disassembleInstruction(
                self.chunk,
                @ptrToInt(self.ip) - @ptrToInt(self.chunk.code.ptr),
            );
        }

        switch (self.ip[0]) {
            .constant => self.push(self.readConstant()),
            .add => self.binaryOp(.add),
            .subtract => self.binaryOp(.subtract),
            .multiply => self.binaryOp(.multiply),
            .divide => self.binaryOp(.divide),
            .negate => self.push(-self.pop()),
            .@"return" => {
                ValueArray.printValue(self.pop());
                print("\n", .{});
                return .ok;
            },
            else => {},
        }
    }
}

const BinaryOp = enum { add, subtract, multiply, divide };

inline fn binaryOp(self: *@This(), comptime operator: BinaryOp) void {
    const b = self.pop();
    const a = self.pop();
    const result = switch (operator) {
        .add => a + b,
        .subtract => a - b,
        .multiply => a * b,
        .divide => a / b,
    };

    self.push(result);
}

inline fn readConstant(self: *@This()) Value {
    self.ip += 1;
    return self.chunk.constants.values[@enumToInt(self.ip[0])];
}

fn resetStack(self: *@This()) void {
    self.stack_top = &self.stack;
}
