const print = @import("std").debug.print;

const Scanner = @import("./Scanner.zig");

pub fn compile(source: []const u8) void {
    var scanner = Scanner.init(source);
    var line: ?usize = null;

    while (true) {
        const token = scanner.scanToken();

        if (token.line != line) {
            print("{d:4} ", .{token.line});
            line = token.line;
        } else {
            print("   | ", .{});
        }
        print("{d:2} '{s}'\n", .{ @enumToInt(token.type), token.lexeme });

        if (token.type == .eof) break;
    }
}
