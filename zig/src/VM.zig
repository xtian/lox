const root = @import("root");
const std = @import("std");

const Chunk = @import("./Chunk.zig");
const ValueArray = @import("./ValueArray.zig");
const debug = @import("./debug.zig");

chunk: ?*Chunk = null,
ip: ?[*]Chunk.OpCode = null,

pub const Result = enum { ok, compile_error, runtime_error };

pub fn init() @This() {
    return .{};
}

pub fn free(_: @This()) void {}

pub fn interpret(self: *@This(), chunk: *Chunk) Result {
    self.chunk = chunk;
    self.ip = chunk.code.ptr;
    return self.run();
}

fn run(self: *@This()) Result {
    while (true) {
        if (root.debug_trace_execution) {
            _ = debug.disassembleInstruction(
                self.chunk.?,
                @ptrToInt(self.ip.?) - @ptrToInt(self.chunk.?.code.ptr),
            );
        }

        switch (self.ip.?[0]) {
            .constant => {
                const constant = self.readConstant();
                ValueArray.printValue(constant);
                std.debug.print("\n", .{});
            },
            .ret => return .ok,
            else => {},
        }

        self.ip.? += 1;
    }
}

inline fn readConstant(self: *@This()) ValueArray.Value {
    const constant = self.chunk.?.constants.values[@enumToInt(self.ip.?[0])];
    self.ip.? += 1;
    return constant;
}
