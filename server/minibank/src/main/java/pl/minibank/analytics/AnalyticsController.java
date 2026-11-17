package pl.minibank.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.minibank.analytics.dto.CategorySpendingResponse;
import pl.minibank.analytics.dto.MonthlyTotalsResponse;
import pl.minibank.analytics.dto.SummaryResponse;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public SummaryResponse summary(@AuthenticationPrincipal Jwt jwt,
                                   @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return analyticsService.summary(userId(jwt), month != null ? month : YearMonth.now());
    }

    @GetMapping("/by-category")
    public List<CategorySpendingResponse> byCategory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        YearMonth current = YearMonth.now();
        return analyticsService.spendingByCategory(
                userId(jwt),
                from != null ? from : current.atDay(1),
                to != null ? to : current.atEndOfMonth());
    }

    @GetMapping("/monthly")
    public List<MonthlyTotalsResponse> monthly(@AuthenticationPrincipal Jwt jwt,
                                               @RequestParam(defaultValue = "6") int months) {
        return analyticsService.monthlyTotals(userId(jwt), YearMonth.now(), months);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
