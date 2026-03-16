#include "lexer/lexer.h"
#include <cctype>
#include <unordered_map>

Lexer::Lexer(std::string source) : src_(std::move(source)) {
  // Strip UTF-8 BOM if present (EF BB BF)
  if (src_.size() >= 3 &&
      static_cast<unsigned char>(src_[0]) == 0xEF &&
      static_cast<unsigned char>(src_[1]) == 0xBB &&
      static_cast<unsigned char>(src_[2]) == 0xBF) {
    src_.erase(0, 3);
  }
}


bool Lexer::eof() const { return i_ >= src_.size(); }

char Lexer::peek() const { return eof() ? '\0' : src_[i_]; }

char Lexer::peek2() const { return (i_ + 1 >= src_.size()) ? '\0' : src_[i_ + 1]; }

char Lexer::advance() {
  if (eof()) return '\0';
  char ch = src_[i_++];
  loc_ = advance_loc(loc_, ch);
  return ch;
}

Token Lexer::make(TokenKind kind, Loc start, size_t start_index, size_t end_index) {
  Token t;
  t.kind = kind;
  t.loc = start;
  t.lexeme = src_.substr(start_index, end_index - start_index);
  return t;
}

Token Lexer::error_token(const std::string& msg, Loc at) {
  last_error_ = LexError{msg, at};
  Token t;
  t.kind = TokenKind::Invalid;
  t.loc = at;
  t.lexeme = "";
  return t;
}

void Lexer::skip_ws_and_comments() {
  while (!eof()) {
    char ch = peek();

    // whitespace (robust)
    // std::isspace covers: space, tab, CR, LF, VT, FF, etc.
    // Also treat non-breaking space (0xA0) as whitespace (common copy/paste issue).
    unsigned char uch = static_cast<unsigned char>(ch);
    if (std::isspace(uch) || uch == 0xA0) {
      advance();
      continue;
    }

    if (ch == '/' && peek2() == '*') {
      Loc start = loc_;
      advance(); advance(); // consume /*
      bool closed = false;

      while (!eof()) {
        if (peek() == '*' && peek2() == '/') {
          advance(); advance(); // consume */
          closed = true;
          break;
        }
        advance();
      }

      if (!closed) {
        last_error_ = LexError{"Unterminated block comment", start};
      }
      continue;
    }

    break;
  }
}


Token Lexer::lex_number() {
  Loc start = loc_;
  size_t start_i = i_;
  while (std::isdigit(static_cast<unsigned char>(peek()))) advance();
  return make(TokenKind::IntLiteral, start, start_i, i_);
}

static bool is_ident_start(char c) {
  return std::isalpha(static_cast<unsigned char>(c)) || c == '_';
}
static bool is_ident_cont(char c) {
  return std::isalnum(static_cast<unsigned char>(c)) || c == '_';
}

Token Lexer::lex_identifier_or_keyword() {
  Loc start = loc_;
  size_t start_i = i_;
  advance(); // first char
  while (is_ident_cont(peek())) advance();
  std::string text = src_.substr(start_i, i_ - start_i);

  static const std::unordered_map<std::string, TokenKind> kw = {
    {"let", TokenKind::KwLet},
    {"func", TokenKind::KwFunc},
    {"return", TokenKind::KwReturn},
    {"if", TokenKind::KwIf},
    {"else", TokenKind::KwElse},
    {"while", TokenKind::KwWhile},
    {"true", TokenKind::KwTrue},
    {"false", TokenKind::KwFalse},
    {"print", TokenKind::KwPrint},
    {"input", TokenKind::KwInput},
  };

  auto it = kw.find(text);
  if (it != kw.end()) return make(it->second, start, start_i, i_);
  return make(TokenKind::Identifier, start, start_i, i_);
}

Token Lexer::lex_string() {
  // current char is '"'
  Loc start = loc_;
  size_t start_i = i_;
  advance(); // consume opening "

  while (!eof()) {
    char ch = peek();
    if (ch == '"') { advance(); return make(TokenKind::StringLiteral, start, start_i, i_); }
    if (ch == '\n' || ch == '\r') {
      return error_token("Unterminated string literal", start);
    }
    if (ch == '\\') {
      advance(); // consume '\'
      if (eof()) return error_token("Unterminated string escape", start);
      char esc = advance();
      switch (esc) {
        case '"': case '\\': case 'n': case 't':
          break;
        default:
          return error_token("Unknown escape sequence", loc_);
      }
      continue;
    }
    advance();
  }
  return error_token("Unterminated string literal", start);
}

Token Lexer::next() {
  skip_ws_and_comments();

  if (last_error_ && last_error_->message == "Unterminated block comment") {
    // Surface as Invalid token at EOF
    return error_token("Unterminated block comment", last_error_->loc);
  }

  if (eof()) {
    Token t;
    t.kind = TokenKind::End;
    t.loc = loc_;
    t.lexeme = "";
    return t;
  }

  Loc start = loc_;
  size_t start_i = i_;
  char ch = peek();

  // number
  if (std::isdigit(static_cast<unsigned char>(ch))) {
    return lex_number();
  }

  // identifier/keyword
  if (is_ident_start(ch)) {
    return lex_identifier_or_keyword();
  }

  // string
  if (ch == '"') {
    return lex_string();
  }

  // two-char operators
  if (ch == '&' && peek2() == '&') { advance(); advance(); return make(TokenKind::AndAnd, start, start_i, i_); }
  if (ch == '|' && peek2() == '|') { advance(); advance(); return make(TokenKind::OrOr, start, start_i, i_); }
  if (ch == '=' && peek2() == '=') { advance(); advance(); return make(TokenKind::EqualEqual, start, start_i, i_); }
  if (ch == '!' && peek2() == '=') { advance(); advance(); return make(TokenKind::BangEqual, start, start_i, i_); }
  if (ch == '<' && peek2() == '=') { advance(); advance(); return make(TokenKind::LessEqual, start, start_i, i_); }
  if (ch == '>' && peek2() == '=') { advance(); advance(); return make(TokenKind::GreaterEqual, start, start_i, i_); }

  // single-char tokens
  switch (ch) {
    case '(': advance(); return make(TokenKind::LParen, start, start_i, i_);
    case ')': advance(); return make(TokenKind::RParen, start, start_i, i_);
    case '{': advance(); return make(TokenKind::LBrace, start, start_i, i_);
    case '}': advance(); return make(TokenKind::RBrace, start, start_i, i_);
    case ',': advance(); return make(TokenKind::Comma, start, start_i, i_);
    case ';': advance(); return make(TokenKind::Semicolon, start, start_i, i_);

    case '+': advance(); return make(TokenKind::Plus, start, start_i, i_);
    case '-': advance(); return make(TokenKind::Minus, start, start_i, i_);
    case '*': advance(); return make(TokenKind::Star, start, start_i, i_);
    case '/': advance(); return make(TokenKind::Slash, start, start_i, i_);
    case '%': advance(); return make(TokenKind::Percent, start, start_i, i_);

    case '!': advance(); return make(TokenKind::Bang, start, start_i, i_);
    case '=': advance(); return make(TokenKind::Assign, start, start_i, i_);
    case '<': advance(); return make(TokenKind::Less, start, start_i, i_);
    case '>': advance(); return make(TokenKind::Greater, start, start_i, i_);
  }

  // unknown character
  advance();
  return error_token("Unexpected character", start);
}

std::vector<Token> Lexer::tokenize_all() {
  std::vector<Token> out;
  while (true) {
    Token t = next();
    out.push_back(t);
    if (t.kind == TokenKind::End) break;
    if (t.kind == TokenKind::Invalid) break;
  }
  return out;
}
