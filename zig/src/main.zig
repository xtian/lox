const std = @import("std");

const Chunk = @import("./Chunk.zig");
const OpCode = Chunk.OpCode;
const debug = @import("./debug.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var chunk = Chunk.init(allocator);
    defer chunk.free();

    const constant = try chunk.addConstant(1.2);
    try chunk.write(.constant);
    try chunk.write(@intToEnum(OpCode, constant));

    try chunk.write(.ret);
    debug.disassembleChunk(&chunk, "test chunk");
}
