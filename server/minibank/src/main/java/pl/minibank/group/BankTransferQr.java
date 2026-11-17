package pl.minibank.group;

import java.math.BigDecimal;
import java.math.RoundingMode;

final class BankTransferQr {

    private static final BigDecimal MAX_AMOUNT = new BigDecimal("9999.99");
    private static final int MAX_NAME_LENGTH = 20;
    private static final int MAX_TITLE_LENGTH = 32;

    private BankTransferQr() {
    }

    static String payload(String iban, BigDecimal amount, String recipientName, String title) {
        if (iban == null || amount.signum() <= 0 || amount.compareTo(MAX_AMOUNT) > 0) {
            return null;
        }
        long grosze = amount.setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
        return String.join("|",
                "",
                "PL",
                iban.substring(2),
                "%06d".formatted(grosze),
                field(recipientName, MAX_NAME_LENGTH),
                field(title, MAX_TITLE_LENGTH),
                "",
                "",
                "");
    }

    private static String field(String value, int maxLength) {
        String cleaned = value.replace("|", " ").trim();
        return cleaned.length() > maxLength ? cleaned.substring(0, maxLength).trim() : cleaned;
    }
}
