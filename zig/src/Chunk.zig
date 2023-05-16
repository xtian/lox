const Allocator = @import("std").mem.Allocator;

const memory = @import("./memory.zig");

pub const OpCode = enum(u8) {
    ret,
    _,
};

allocator: Allocator,
count: usize = 0,
code: []OpCode = @as([*]OpCode, undefined)[0..0],

pub fn init(allocator: Allocator) @This() {
    return .{ .allocator = allocator };
}

pub fn free(self: *@This()) void {
    self.count = 0;
    self.code = self.allocator.realloc(self.code, 0) catch unreachable;
}

pub fn write(self: *@This(), opcode: OpCode) !void {
    if (self.code.len < self.count + 1) {
        const new_capacity = memory.growCapacity(self.code.len);
        self.code = try self.allocator.realloc(self.code, new_capacity);
    }

    self.code[self.count] = opcode;
    self.count += 1;
}
