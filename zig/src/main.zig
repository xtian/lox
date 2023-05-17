const std = @import("std");
const print = std.debug.print;

const Chunk = @import("./Chunk.zig");
const OpCode = Chunk.OpCode;
const VM = @import("./VM.zig");
const compiler = @import("./compiler.zig");
const debug = @import("./debug.zig");

pub const debug_trace_execution = true;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

var vm = VM{};

pub fn main() !void {
    defer _ = gpa.deinit();

    vm.init();
    defer vm.free();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    switch (args.len) {
        1 => try repl(),
        2 => runFile(args[1]),
        else => {
            print("Usage: zlox [path]\n", .{});
            std.os.exit(64);
        },
    }
}

fn repl() !void {
    const max_line = 1024;
    var buffer: [max_line]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&buffer);
    const fba_allocator = fba.allocator();
    const stdin = std.io.getStdIn().reader();

    while (true) {
        defer fba.reset();

        print("> ", .{});
        const maybe_input = try stdin.readUntilDelimiterOrEofAlloc(fba_allocator, '\n', max_line);

        if (maybe_input) |input| {
            _ = interpret(input);
        } else {
            print("\n", .{});
            break;
        }
    }
}

fn runFile(path: []const u8) void {
    const file = std.fs.cwd().openFile(path, .{}) catch {
        print("Could not open file \"{s}\".\n", .{path});
        std.os.exit(74);
    };

    defer file.close();

    if (file.readToEndAllocOptions(allocator, std.math.maxInt(u32), null, @alignOf(u8), 0)) |source| {
        defer allocator.free(source);

        switch (interpret(source)) {
            .ok => {},
            .compile_error => std.os.exit(65),
            .runtime_error => std.os.exit(70),
        }
    } else |err| switch (err) {
        error.OutOfMemory => {
            print("Not enough memory to read \"{s}\".\n", .{path});
            std.os.exit(74);
        },
        else => {
            print("Could not read file \"{s}\".\n", .{path});
            std.os.exit(74);
        },
    }
}

fn interpret(source: []const u8) VM.Result {
    compiler.compile(source);
    return .ok;
}
