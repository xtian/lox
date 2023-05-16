const std = @import("std");

const Chunk = @import("./Chunk.zig");
const debug = @import("./debug.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var chunk = Chunk.init(allocator);
    defer chunk.free();

    try chunk.write(.ret);
    debug.disassembleChunk(&chunk, "test chunk");
}
