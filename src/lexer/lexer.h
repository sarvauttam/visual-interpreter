#pragma once
#include <string>
#include <vector>
#include <optional>
#include "lexer/token.h"
#include "common/loc.h"

struct LexError {
  std::string message;
  Loc loc;            // where the error starts
};

class Lexer {
public:
  explicit Lexer(std::string source);

  // Returns next token and advances.
  Token next();

  // Convenience: tokenize whole input (stops on first Invalid token).
  std::vector<Token> tokenize_all();

  // If an error occurred, kind will be Invalid and this will be set.
  const std::optional<LexError>& last_error() const { return last_error_; }

private:
  std::string src_;
  size_t i_ = 0;
  Loc loc_{1, 1};

  std::optional<LexError> last_error_;

  // helpers
  bool eof() const;
  char peek() const;
  char peek2() const;
  char advance(); // consumes one char and updates loc

  void skip_ws_and_comments();

  Token make(TokenKind kind, Loc start, size_t start_index, size_t end_index);
  Token error_token(const std::string& msg, Loc at);

  Token lex_number();
  Token lex_identifier_or_keyword();
  Token lex_string();
};
