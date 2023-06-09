const std = @import("std");

start: [*]const u8,
current: [*]const u8,
line: usize = 1,

pub const TokenType = enum {
    // Single-character tokens
    left_paren,
    right_paren,
    left_brace,
    right_brace,
    comma,
    dot,
    minus,
    plus,
    semicolon,
    slash,
    star,

    // One or two character tokens
    bang,
    bang_equal,
    equal,
    equal_equal,
    greater,
    greater_equal,
    less,
    less_equal,

    // Literals
    identifier,
    string,
    number,

    // Keywords
    @"and",
    class,
    @"else",
    false,
    @"for",
    fun,
    @"if",
    nil,
    @"or",
    print,
    @"return",
    super,
    this,
    true,
    @"var",
    @"while",

    @"error",
    eof,
};

pub const Token = struct {
    type: TokenType,
    lexeme: []const u8,
    line: usize,
};

pub fn init(source: []const u8) @This() {
    return .{ .start = source.ptr, .current = source.ptr };
}

pub fn scanToken(self: *@This()) Token {
    self.skipWhitespace();
    self.start = self.current;

    if (self.isAtEnd()) return self.makeToken(.eof);

    const byte = self.advance();

    if (isAlpha(byte)) return self.identifier();
    if (isDigit(byte)) return self.number();

    return switch (byte) {
        '(' => self.makeToken(.left_paren),
        ')' => self.makeToken(.right_paren),
        '{' => self.makeToken(.left_brace),
        '}' => self.makeToken(.right_brace),
        ';' => self.makeToken(.semicolon),
        ',' => self.makeToken(.comma),
        '.' => self.makeToken(.dot),
        '-' => self.makeToken(.minus),
        '+' => self.makeToken(.plus),
        '/' => self.makeToken(.slash),
        '*' => self.makeToken(.star),
        '!' => self.makeToken(if (self.match('=')) .bang_equal else .bang),
        '=' => self.makeToken(if (self.match('=')) .equal_equal else .equal),
        '<' => self.makeToken(if (self.match('=')) .less_equal else .less),
        '>' => self.makeToken(if (self.match('=')) .greater_equal else .greater),
        '"' => self.string(),
        else => self.errorToken("Unexpected character."),
    };
}

fn isAtEnd(self: @This()) bool {
    return self.current[0] == 0;
}

fn advance(self: *@This()) u8 {
    const byte = self.current[0];
    self.current += 1;
    return byte;
}

fn peek(self: @This()) u8 {
    return self.current[0];
}

fn peekNext(self: @This()) u8 {
    if (self.isAtEnd()) return 0;
    return self.current[1];
}

fn match(self: *@This(), expected: u8) bool {
    if (self.isAtEnd()) return false;
    if (self.current[0] != expected) return false;
    self.current += 1;
    return true;
}

fn makeToken(self: @This(), tokenType: TokenType) Token {
    const length = @ptrToInt(self.current) - @ptrToInt(self.start);

    return .{ .type = tokenType, .line = self.line, .lexeme = self.start[0..length] };
}

fn errorToken(self: @This(), message: []const u8) Token {
    return .{ .type = .@"error", .line = self.line, .lexeme = message };
}

fn skipWhitespace(self: *@This()) void {
    while (true) {
        switch (self.peek()) {
            ' ', '\r', '\t' => _ = self.advance(),
            '\n' => {
                self.line += 1;
                _ = self.advance();
            },
            '/' => {
                if (self.peekNext() == '/') {
                    while (self.peek() != '\n' and !self.isAtEnd()) _ = self.advance();
                } else {
                    return;
                }
            },
            else => return,
        }
    }
}

fn checkKeyword(self: @This(), start: usize, rest: []const u8, tokenType: TokenType) TokenType {
    const length = @ptrToInt(self.current) - @ptrToInt(self.start);

    if (length == start + rest.len and
        std.mem.eql(u8, self.start[start..rest.len], rest)) return tokenType;

    return .identifier;
}

fn identifierType(self: @This()) TokenType {
    return switch (self.start[0]) {
        'a' => self.checkKeyword(1, "nd", .@"and"),
        'c' => self.checkKeyword(1, "lass", .class),
        'e' => self.checkKeyword(1, "else", .@"else"),
        'f' => if (@ptrToInt(self.current) - @ptrToInt(self.start) > 1) switch (self.start[1]) {
            'a' => self.checkKeyword(2, "lse", .false),
            'o' => self.checkKeyword(2, "r", .@"for"),
            'u' => self.checkKeyword(2, "n", .fun),
            else => .identifier,
        } else .identifier,
        'i' => self.checkKeyword(1, "if", .@"if"),
        'n' => self.checkKeyword(1, "il", .nil),
        'o' => self.checkKeyword(1, "r", .@"or"),
        'p' => self.checkKeyword(1, "rint", .print),
        'r' => self.checkKeyword(1, "eturn", .@"return"),
        's' => self.checkKeyword(1, "uper", .super),
        't' => if (@ptrToInt(self.current) - @ptrToInt(self.start) > 1) switch (self.start[1]) {
            'h' => self.checkKeyword(2, "is", .this),
            'r' => self.checkKeyword(2, "ue", .true),
            else => .identifier,
        } else .identifier,
        'v' => self.checkKeyword(1, "ar", .@"var"),
        'w' => self.checkKeyword(1, "hile", .@"while"),
        else => .identifier,
    };
}

fn identifier(self: *@This()) Token {
    while (isAlpha(self.peek()) or isDigit(self.peek())) _ = self.advance();
    return self.makeToken(self.identifierType());
}

fn number(self: *@This()) Token {
    while (isDigit(self.peek())) _ = self.advance();

    // Look for a fractional part
    if (self.peek() == '.' and isDigit(self.peekNext())) {
        // Consume the "."
        _ = self.advance();

        while (isDigit(self.peek())) _ = self.advance();
    }

    return self.makeToken(.number);
}

fn string(self: *@This()) Token {
    while (self.peek() != '"' and !self.isAtEnd()) {
        if (self.peek() == '\n') self.line += 1;
        _ = self.advance();
    }

    if (!self.isAtEnd()) return self.errorToken("Unterminated string.");

    // The closing quote
    _ = self.advance();
    return self.makeToken(.string);
}

fn isAlpha(byte: u8) bool {
    return (byte >= 'a' and byte <= 'z') or
        (byte >= 'A' and byte <= 'Z') or
        byte == '_';
}

fn isDigit(byte: u8) bool {
    return byte >= '0' and byte <= '9';
}
