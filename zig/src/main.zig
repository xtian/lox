const std = @import("std");

const Chunk = @import("./Chunk.zig");
const OpCode = Chunk.OpCode;
const VM = @import("./VM.zig");
const debug = @import("./debug.zig");

pub const debug_trace_execution = false;

var vm = VM.init();

pub fn main() !void {
    defer vm.free();

    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var chunk = Chunk.init(allocator);
    defer chunk.free();

    const constant = try chunk.addConstant(1.2);
    try chunk.write(.constant, 123);
    try chunk.write(@intToEnum(OpCode, constant), 123);

    try chunk.write(.ret, 123);

    debug.disassembleChunk(&chunk, "test chunk");
    _ = vm.interpret(&chunk);
}
