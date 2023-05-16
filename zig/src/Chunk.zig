const Allocator = @import("std").mem.Allocator;

const ValueArray = @import("./ValueArray.zig");
const Value = ValueArray.Value;
const memory = @import("./memory.zig");

pub const OpCode = enum(u8) {
    constant,
    ret,
    _,
};

allocator: Allocator,
count: usize = 0,
code: []OpCode = @as([*]OpCode, undefined)[0..0],
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
    self.constants.free();
}

pub fn write(self: *@This(), opcode: OpCode) !void {
    if (self.code.len < self.count + 1) {
        const new_capacity = memory.growCapacity(self.code.len);
        self.code = try self.allocator.realloc(self.code, new_capacity);
    }

    self.code[self.count] = opcode;
    self.count += 1;
}

pub fn addConstant(self: *@This(), value: Value) !u8 {
    try self.constants.write(value);
    return self.constants.count - 1;
}
