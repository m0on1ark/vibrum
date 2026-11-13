package pl.minibank.category;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class RuleMatcherTests {

    @ParameterizedTest
    @CsvSource({
            "BIEDRONKA, BIEDRONKA 1234 WARSZAWA, true",
            "biedronka, Biedronka sklep, true",
            "ZABKA, ŻABKA POLSKA Z1234, true",
            "Żabka, ZABKA Z1234, true",
            "LUX MED, LUX MED SP. Z O.O., true",
            "PLAY, PLAYSTATION STORE, false",
            "PLAY, P4 PLAY abonament, true",
            "ORLEN, PKN ORLEN STACJA 123, true",
            "DINO, DINOZAUR TOYS, false",
            "WYNAGRODZENIE, Wynagrodzenie za 10/2026, true",
            "STACJA, Łódź stacja paliw, true"
    })
    void keywordMatchesWholeWordsIgnoringCaseAndDiacritics(String pattern, String title, boolean expected) {
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.ANY, pattern, title, null))
                .isEqualTo(expected);
    }

    @Test
    void keywordMatchesPolishLetterL() {
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.ANY, "LODZ", "Sklep Łódź", null)).isTrue();
    }

    @Test
    void targetLimitsSearchedField() {
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.TITLE, "NETFLIX", "Przelew", "NETFLIX.COM"))
                .isFalse();
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.COUNTERPARTY, "NETFLIX", "Przelew", "NETFLIX.COM"))
                .isTrue();
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.ANY, "NETFLIX", "Przelew", "NETFLIX.COM"))
                .isTrue();
    }

    @Test
    void regexMatchesIgnoringCase() {
        assertThat(RuleMatcher.matches(RuleMatchType.REGEX, RuleTarget.ANY, "^uber\\s*\\*?trip", "UBER *TRIP 12", null))
                .isTrue();
        assertThat(RuleMatcher.matches(RuleMatchType.REGEX, RuleTarget.ANY, "^uber\\s*\\*?trip", "UBER EATS", null))
                .isFalse();
    }

    @Test
    void blankTextNeverMatches() {
        assertThat(RuleMatcher.matches(RuleMatchType.KEYWORD, RuleTarget.ANY, "BIEDRONKA", null, " ")).isFalse();
    }

    @Test
    void detectsInvalidRegex() {
        assertThat(RuleMatcher.isValidRegex("[a-z")).isFalse();
        assertThat(RuleMatcher.isValidRegex("^(UBER|BOLT)")).isTrue();
    }
}
