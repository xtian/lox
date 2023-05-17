start: [*]const u8,
current: [*]const u8,
line: usize = 1,

pub fn init(source: []const u8) @This() {
    return .{ .start = source.ptr, .current = source.ptr };
}
