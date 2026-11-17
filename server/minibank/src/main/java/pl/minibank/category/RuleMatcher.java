package pl.minibank.category;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

public final class RuleMatcher {

    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");

    private RuleMatcher() {
    }

    public static boolean matches(RuleMatchType matchType, RuleTarget target, String pattern,
                                  String title, String counterparty) {
        Pattern compiled = compile(matchType, pattern);
        return switch (target) {
            case TITLE -> find(compiled, title);
            case COUNTERPARTY -> find(compiled, counterparty);
            case ANY -> find(compiled, title) || find(compiled, counterparty);
        };
    }

    public static Pattern compile(RuleMatchType matchType, String pattern) {
        return switch (matchType) {
            case KEYWORD -> Pattern.compile("(?<![A-Z0-9])" + Pattern.quote(normalize(pattern)) + "(?![A-Z0-9])");
            case REGEX -> Pattern.compile(stripDiacritics(pattern), Pattern.CASE_INSENSITIVE);
        };
    }

    public static boolean isValidRegex(String pattern) {
        try {
            compile(RuleMatchType.REGEX, pattern);
            return true;
        } catch (PatternSyntaxException e) {
            return false;
        }
    }

    static String normalize(String text) {
        return stripDiacritics(text.trim()).toUpperCase(Locale.ROOT);
    }

    private static String stripDiacritics(String text) {
        String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
        return COMBINING_MARKS.matcher(decomposed).replaceAll("")
                .replace('ł', 'l')
                .replace('Ł', 'L');
    }

    private static boolean find(Pattern pattern, String text) {
        return text != null && !text.isBlank() && pattern.matcher(normalize(text)).find();
    }
}
