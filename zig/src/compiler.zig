const Scanner = @import("./Scanner.zig");

pub fn compile(source: []const u8) void {
    _ = Scanner.init(source);
}
