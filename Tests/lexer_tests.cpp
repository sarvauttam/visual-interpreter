#include "test_main.h"
#include <vector>
#include <string>
#include "lexer/lexer.h"
#include <algorithm>


static std::vector<TokenKind> kinds_of(const std::string& src) {
  Lexer lex(src);
  auto toks = lex.tokenize_all();
  std::vector<TokenKind> kinds;
  for (auto& t : toks) kinds.push_back(t.kind);
  return kinds;
}

TEST(test_keywords_and_ident) {
  auto k = kinds_of("let x = true; false func return if else while print input");
  // Note: not a full program; lexer-level only.
  REQUIRE(k.size() > 1);
  REQUIRE(k[0] == TokenKind::KwLet);
  REQUIRE(k[1] == TokenKind::Identifier);
  REQUIRE(k[2] == TokenKind::Assign);
  REQUIRE(k[3] == TokenKind::KwTrue);
  REQUIRE(k[4] == TokenKind::Semicolon);
  REQUIRE(k[5] == TokenKind::KwFalse);
}

TEST(test_ops_and_punct) {
  auto k = kinds_of("a&&b||c==d!=e<=f>=g< h> i;,( ){ }");
  // Just ensure the multi-char operators are recognized.
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::AndAnd) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::OrOr) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::EqualEqual) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::BangEqual) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::LessEqual) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::GreaterEqual) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::Less) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::Greater) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::Semicolon) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::Comma) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::LParen) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::RParen) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::LBrace) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::RBrace) != k.end());
}

TEST(test_comments_skipped) {
  auto k = kinds_of("let x=1; // comment\n print(x); /* block */");
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::KwLet) != k.end());
  REQUIRE(std::find(k.begin(), k.end(), TokenKind::KwPrint) != k.end());
  REQUIRE(k.back() == TokenKind::End);
}



TEST(test_string_escapes) {
  Lexer lex("print(\"a\\\\b\\n\\t\\\"\");");
  auto toks = lex.tokenize_all();
  REQUIRE(toks.size() >= 3);
  REQUIRE(toks[0].kind == TokenKind::KwPrint);
  REQUIRE(toks[2].kind == TokenKind::StringLiteral);
}

TEST(test_unterminated_string_errors) {
  Lexer lex("\"oops");
  auto toks = lex.tokenize_all();
  REQUIRE(toks.size() >= 1);
  REQUIRE(toks[0].kind == TokenKind::Invalid);
  REQUIRE(lex.last_error().has_value());
}
