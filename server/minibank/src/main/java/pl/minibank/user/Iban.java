package pl.minibank.user;

import java.math.BigInteger;
import java.util.Locale;

public final class Iban {

    private static final BigInteger NINETY_SEVEN = BigInteger.valueOf(97);

    private Iban() {
    }

    public static String normalize(String value) {
        String compact = value.replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);
        return compact.matches("\\d{26}") ? "PL" + compact : compact;
    }

    public static boolean isValidPolish(String iban) {
        if (iban == null || !iban.matches("PL\\d{26}")) {
            return false;
        }
        String rearranged = iban.substring(4) + iban.substring(0, 4);
        StringBuilder digits = new StringBuilder();
        for (char c : rearranged.toCharArray()) {
            digits.append(Character.isLetter(c) ? String.valueOf(c - 'A' + 10) : String.valueOf(c));
        }
        return new BigInteger(digits.toString()).mod(NINETY_SEVEN).equals(BigInteger.ONE);
    }
}
