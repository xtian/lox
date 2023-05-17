const Allocator = @import("std").mem.Allocator;

const ValueArray = @import("./ValueArray.zig");
const memory = @import("./memory.zig");

pub const OpCode = enum(u8) {
    constant,
    add,
    subtract,
    multiply,
    divide,
    negate,
    ret,
    _,
};

allocator: Allocator,
count: usize = 0,
code: []OpCode = @as([*]OpCode, undefined)[0..0],
lines: []usize = @as([*]usize, undefined)[0..0],
constants: ValueArray,

pub fn init(allocator: Allocator) @This() {
    return .{
        .allocator = allocator,
        .constants = ValueArray.init(allocator),
    };
}

pub fn free(self: *@This()) void {
    self.count = 0;
    self.code = self.allocator.realloc(self.code, 0) catch unreachable;
    self.lines = self.allocator.realloc(self.lines, 0) catch unreachable;
    self.constants.free();
}

pub fn write(self: *@This(), opcode: OpCode, line: usize) !void {
    if (self.code.len < self.count + 1) {
        const new_capacity = memory.growCapacity(self.code.len);
        self.code = try self.allocator.realloc(self.code, new_capacity);
        self.lines = try self.allocator.realloc(self.lines, new_capacity);
    }

    self.code[self.count] = opcode;
    self.lines[self.count] = line;
    self.count += 1;
}

pub fn addConstant(self: *@This(), value: ValueArray.Value) !u8 {
    try self.constants.write(value);
    return self.constants.count - 1;
}
