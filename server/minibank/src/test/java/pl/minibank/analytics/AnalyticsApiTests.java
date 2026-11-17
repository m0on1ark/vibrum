package pl.minibank.analytics;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import pl.minibank.TestcontainersConfiguration;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AnalyticsApiTests {

    private static final YearMonth CURRENT = YearMonth.now();
    private static final YearMonth PREVIOUS = CURRENT.minusMonths(1);

    @Autowired
    private MockMvc mockMvc;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        token = registerAndGetToken();
        LocalDate now = CURRENT.atDay(1);
        LocalDate prev = PREVIOUS.atDay(10);
        importStatement(token, """
                date,amount,currency,title,recipient
                %s,5000.00,PLN,Wynagrodzenie,Firma XYZ
                %s,-100.00,PLN,BIEDRONKA 1234,Jeronimo Martins
                %s,-50.00,PLN,UBER TRIP,Uber
                %s,5200.00,PLN,Wynagrodzenie,Firma XYZ
                %s,-80.00,PLN,BIEDRONKA 1234,Jeronimo Martins
                %s,-40.00,PLN,LIDL 55,Lidl
                %s,-30.00,PLN,UBER TRIP,Uber
                %s,-43.00,PLN,NETFLIX.COM,Netflix
                %s,-7.00,PLN,Przelew dla Jana,Jan Kowalski
                """.formatted(prev, prev, prev, now, now, now, now, now, now));
    }

    @Test
    void summaryShowsIncomeExpensesBalanceAndChange() throws Exception {
        perform("/api/analytics/summary?month=" + CURRENT)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.month").value(CURRENT.toString()))
                .andExpect(jsonPath("$.income").value(5200.00))
                .andExpect(jsonPath("$.expenses").value(200.00))
                .andExpect(jsonPath("$.balance").value(5000.00))
                .andExpect(jsonPath("$.previousMonthExpenses").value(150.00))
                .andExpect(jsonPath("$.expensesChangePercent").value(33.33));
    }

    @Test
    void summaryWithoutPreviousSpendingHasNoChangePercent() throws Exception {
        perform("/api/analytics/summary?month=" + PREVIOUS)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expenses").value(150.00))
                .andExpect(jsonPath("$.previousMonthExpenses").value(0))
                .andExpect(jsonPath("$.expensesChangePercent").value(nullValue()));
    }

    @Test
    void spendingByCategoryIsSortedWithPercentages() throws Exception {
        perform("/api/analytics/by-category?from=" + CURRENT.atDay(1) + "&to=" + CURRENT.atEndOfMonth())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].categoryName").value("Spożywcze"))
                .andExpect(jsonPath("$[0].amount").value(120.00))
                .andExpect(jsonPath("$[0].percent").value(60.00))
                .andExpect(jsonPath("$[1].categoryName").value("Subskrypcje"))
                .andExpect(jsonPath("$[1].amount").value(43.00))
                .andExpect(jsonPath("$[2].categoryName").value("Transport"))
                .andExpect(jsonPath("$[2].percent").value(15.00))
                .andExpect(jsonPath("$[3].categoryName").value(nullValue()))
                .andExpect(jsonPath("$[3].amount").value(7.00));
    }

    @Test
    void monthlyTotalsFillMissingMonthsWithZero() throws Exception {
        perform("/api/analytics/monthly?months=3")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].month").value(CURRENT.minusMonths(2).toString()))
                .andExpect(jsonPath("$[0].income").value(0))
                .andExpect(jsonPath("$[0].expenses").value(0))
                .andExpect(jsonPath("$[1].month").value(PREVIOUS.toString()))
                .andExpect(jsonPath("$[1].income").value(5000.00))
                .andExpect(jsonPath("$[1].expenses").value(150.00))
                .andExpect(jsonPath("$[2].month").value(CURRENT.toString()))
                .andExpect(jsonPath("$[2].expenses").value(200.00));
    }

    @Test
    void otherUserSeesOnlyOwnData() throws Exception {
        String other = registerAndGetToken();

        mockMvc.perform(get("/api/analytics/summary").header("Authorization", "Bearer " + other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.income").value(0))
                .andExpect(jsonPath("$.expenses").value(0));
        mockMvc.perform(get("/api/analytics/by-category").header("Authorization", "Bearer " + other))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void rejectsInvalidParameters() throws Exception {
        perform("/api/analytics/by-category?from=2026-11-30&to=2026-11-01").andExpect(status().isBadRequest());
        perform("/api/analytics/monthly?months=0").andExpect(status().isBadRequest());
        perform("/api/analytics/monthly?months=25").andExpect(status().isBadRequest());
        perform("/api/analytics/summary?month=2026-13").andExpect(status().isBadRequest());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")).andExpect(status().isUnauthorized());
    }

    private ResultActions perform(String url) throws Exception {
        return mockMvc.perform(get(url).header("Authorization", "Bearer " + token));
    }

    private void importStatement(String accessToken, String csv) throws Exception {
        String account = mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accountName": "PKO", "bankType": "PKO_BP", "baseCurrency": "PLN"}
                                """))
                .andReturn().getResponse().getContentAsString();
        Number accountId = JsonPath.read(account, "$.id");

        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/accounts/" + accountId + "/import")
                        .file(file)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    private String registerAndGetToken() throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "password123", "displayName": "Test"}
                                """.formatted("user-" + UUID.randomUUID() + "@example.com")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.accessToken");
    }
}
