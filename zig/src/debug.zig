const print = @import("std").debug.print;

const Chunk = @import("./Chunk.zig");
const ValueArray = @import("./ValueArray.zig");

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
        .constant => constantInstruction("constant", chunk, offset),
        .ret => simpleInstruction("ret", offset),
        else => |instruction| {
            print("Unknown opcode {d}\n", .{instruction});
            return offset + 1;
        },
    };
}

fn constantInstruction(name: []const u8, chunk: *Chunk, offset: usize) usize {
    const constant = @enumToInt(chunk.code[offset + 1]);
    print("{s: <16} {d:4} '", .{ name, constant });
    ValueArray.printValue(chunk.constants.values[constant]);
    print("'\n", .{});
    return offset + 2;
}

fn simpleInstruction(name: []const u8, offset: usize) usize {
    print("{s}\n", .{name});
    return offset + 1;
}
