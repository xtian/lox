const print = @import("std").debug.print;

const Chunk = @import("./Chunk.zig");

pub fn disassembleChunk(chunk: *Chunk, name: []const u8) void {
    print("== {s} ==\n", .{name});

    var offset: usize = 0;
    while (offset < chunk.count) {
        offset = disassembleInstruction(chunk, offset);
    }
}

pub fn disassembleInstruction(chunk: *Chunk, offset: usize) usize {
    print("{d:0>4} ", .{offset});

    return switch (chunk.code[offset]) {
        .ret => simpleInstruction("ret", offset),
        else => |instruction| {
            print("Unknown opcode {d}\n", .{instruction});
            return offset + 1;
        },
    };
}

fn simpleInstruction(name: []const u8, offset: usize) usize {
    print("{s}\n", .{name});
    return offset + 1;
}
