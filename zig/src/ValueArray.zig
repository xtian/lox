const std = @import("std");
const Allocator = std.mem.Allocator;

const memory = @import("./memory.zig");

pub const Value = f64;

allocator: Allocator,
count: u8 = 0,
values: []Value = @as([*]Value, undefined)[0..0],

pub fn init(allocator: Allocator) @This() {
    return .{ .allocator = allocator };
}

pub fn free(self: *@This()) void {
    self.count = 0;
    self.values = self.allocator.realloc(self.values, 0) catch unreachable;
}

pub fn write(self: *@This(), value: Value) !void {
    if (self.values.len < self.count + 1) {
        const new_capacity = memory.growCapacity(self.values.len);
        self.values = try self.allocator.realloc(self.values, new_capacity);
    }

    self.values[self.count] = value;
    self.count += 1;
}

pub fn printValue(value: Value) void {
    std.debug.print("{}", .{value});
}
