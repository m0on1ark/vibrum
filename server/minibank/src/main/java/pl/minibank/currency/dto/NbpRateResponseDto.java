package pl.minibank.currency.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class NbpRateResponseDto {
    private String table;
    private String currency;
    private String code;
    private List<RateEntry> rates;

    @Data
    public static class RateEntry {
        private String no;
        private String effectiveDate;
        private BigDecimal mid;
    }
}