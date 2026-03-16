#pragma once
#include <cstdint>
#include <string>
#include "common/loc.h"

enum class TokenKind : uint16_t {
  // Special
  End,
  Invalid,

  // Literals / identifiers
  Identifier,
  IntLiteral,
  StringLiteral,

  // Keywords
  KwLet,
  KwFunc,
  KwReturn,
  KwIf,
  KwElse,
  KwWhile,
  KwTrue,
  KwFalse,
  KwPrint,
  KwInput,

  // Punctuators
  LParen,    // (
  RParen,    // )
  LBrace,    // {
  RBrace,    // }
  Comma,     // ,
  Semicolon, // ;

  // Operators
  Plus,      // +
  Minus,     // -
  Star,      // *
  Slash,     // /
  Percent,   // %
  Bang,      // !
  Assign,    // =
  AndAnd,    // &&
  OrOr,      // ||
  EqualEqual,// ==
  BangEqual, // !=
  Less,      // <
  LessEqual, // <=
  Greater,   // >
  GreaterEqual // >=
};

struct Token {
  TokenKind kind = TokenKind::Invalid;
  std::string lexeme; // exact source substring
  Loc loc;            // start location (line/col)
};

inline const char* token_kind_name(TokenKind k) {
  switch (k) {
    case TokenKind::End: return "End";
    case TokenKind::Invalid: return "Invalid";
    case TokenKind::Identifier: return "Identifier";
    case TokenKind::IntLiteral: return "IntLiteral";
    case TokenKind::StringLiteral: return "StringLiteral";

    case TokenKind::KwLet: return "KwLet";
    case TokenKind::KwFunc: return "KwFunc";
    case TokenKind::KwReturn: return "KwReturn";
    case TokenKind::KwIf: return "KwIf";
    case TokenKind::KwElse: return "KwElse";
    case TokenKind::KwWhile: return "KwWhile";
    case TokenKind::KwTrue: return "KwTrue";
    case TokenKind::KwFalse: return "KwFalse";
    case TokenKind::KwPrint: return "KwPrint";
    case TokenKind::KwInput: return "KwInput";

    case TokenKind::LParen: return "LParen";
    case TokenKind::RParen: return "RParen";
    case TokenKind::LBrace: return "LBrace";
    case TokenKind::RBrace: return "RBrace";
    case TokenKind::Comma: return "Comma";
    case TokenKind::Semicolon: return "Semicolon";

    case TokenKind::Plus: return "Plus";
    case TokenKind::Minus: return "Minus";
    case TokenKind::Star: return "Star";
    case TokenKind::Slash: return "Slash";
    case TokenKind::Percent: return "Percent";
    case TokenKind::Bang: return "Bang";
    case TokenKind::Assign: return "Assign";
    case TokenKind::AndAnd: return "AndAnd";
    case TokenKind::OrOr: return "OrOr";
    case TokenKind::EqualEqual: return "EqualEqual";
    case TokenKind::BangEqual: return "BangEqual";
    case TokenKind::Less: return "Less";
    case TokenKind::LessEqual: return "LessEqual";
    case TokenKind::Greater: return "Greater";
    case TokenKind::GreaterEqual: return "GreaterEqual";
  }
  return "UnknownTokenKind";
}
