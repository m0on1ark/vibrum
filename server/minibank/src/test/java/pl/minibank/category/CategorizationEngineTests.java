package pl.minibank.category;

import org.junit.jupiter.api.Test;
import pl.minibank.user.User;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CategorizationEngineTests {

    private final User user = new User("user@example.com", "hash", "User");
    private final Category groceries = new Category(null, "Spożywcze", CategoryType.EXPENSE);
    private final Category alcohol = new Category(user, "Alkohol", CategoryType.EXPENSE);
    private final Category sport = new Category(null, "Sport", CategoryType.EXPENSE);

    @Test
    void userRuleWinsOverSystemRule() {
        CategorizationRule system = keyword(null, groceries, "BIEDRONKA", 0);
        CategorizationRule own = keyword(user, alcohol, "BIEDRONKA", 0);

        assertThat(CategorizationEngine.findMatch(List.of(system, own), "BIEDRONKA 123", null))
                .contains(own);
    }

    @Test
    void higherPriorityWinsWithinSameOwner() {
        CategorizationRule low = keyword(user, groceries, "DECATHLON", 0);
        CategorizationRule high = keyword(user, sport, "DECATHLON", 10);

        assertThat(CategorizationEngine.findMatch(List.of(low, high), "DECATHLON KRAKOW", null))
                .contains(high);
    }

    @Test
    void longerPatternWinsWhenPriorityIsEqual() {
        CategorizationRule general = keyword(null, groceries, "ORLEN", 0);
        CategorizationRule specific = keyword(null, sport, "ORLEN ARENA", 0);

        assertThat(CategorizationEngine.findMatch(List.of(general, specific), "ORLEN ARENA PLOCK", null))
                .contains(specific);
    }

    @Test
    void returnsEmptyWhenNothingMatches() {
        CategorizationRule rule = keyword(null, groceries, "BIEDRONKA", 0);

        assertThat(CategorizationEngine.findMatch(List.of(rule), "Przelew na konto", "Jan Kowalski"))
                .isEmpty();
    }

    private static CategorizationRule keyword(User owner, Category category, String pattern, int priority) {
        return new CategorizationRule(owner, category, RuleMatchType.KEYWORD, RuleTarget.ANY, pattern, priority);
    }
}
