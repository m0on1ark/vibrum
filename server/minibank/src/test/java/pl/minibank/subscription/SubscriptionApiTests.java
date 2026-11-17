package pl.minibank.subscription;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class SubscriptionApiTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SubscriptionPaymentSource paymentSource;

    private String token;
    private String otherToken;

    @BeforeEach
    void setUp() throws Exception {
        token = registerAndGetToken();
        otherToken = registerAndGetToken();
        when(paymentSource.findPayments(anyLong())).thenReturn(List.of());
    }

    @Test
    void detectFindsSubscriptionsAndAssignsCategory() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(userId(token))).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment)));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].merchant").value("NETFLIX.COM"))
                .andExpect(jsonPath("$[0].billingPeriod").value("MONTHLY"))
                .andExpect(jsonPath("$[0].amount").value(43.00))
                .andExpect(jsonPath("$[0].nextPaymentDate").value(lastPayment.plusMonths(1).toString()))
                .andExpect(jsonPath("$[0].categoryName").value("Subskrypcje"));

        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void subscriptionsAreVisibleOnlyToOwner() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(userId(token))).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment)));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void detectReplacesPreviousResults() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(userId(token))).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment)));
        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token));

        when(paymentSource.findPayments(userId(token))).thenReturn(List.of());
        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void dismissedSubscriptionStaysHiddenAfterNextDetect() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(anyLong())).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment)));
        long id = detectAndGetFirstId(token);

        mockMvc.perform(post("/api/subscriptions/" + id + "/dismiss").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void cannotDismissForeignSubscription() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(anyLong())).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment)));
        long id = detectAndGetFirstId(token);

        mockMvc.perform(post("/api/subscriptions/" + id + "/dismiss").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/subscriptions").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void summaryAddsUpMonthlyAndYearlyCost() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(2);
        when(paymentSource.findPayments(anyLong())).thenReturn(List.of(
                netflix(lastPayment.minusMonths(2)),
                netflix(lastPayment.minusMonths(1)),
                netflix(lastPayment),
                newspaper(lastPayment.minusWeeks(2)),
                newspaper(lastPayment.minusWeeks(1)),
                newspaper(lastPayment)));
        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/subscriptions/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].currency").value("PLN"))
                .andExpect(jsonPath("$[0].count").value(2))
                .andExpect(jsonPath("$[0].monthlyCost").value(108.00))
                .andExpect(jsonPath("$[0].yearlyCost").value(1296.00));
    }

    @Test
    void summaryIsEmptyWithoutSubscriptions() throws Exception {
        mockMvc.perform(get("/api/subscriptions/summary").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void categoryIsFoundByTitleWhenRecipientHasNoRule() throws Exception {
        LocalDate lastPayment = LocalDate.now().minusDays(5);
        when(paymentSource.findPayments(anyLong())).thenReturn(List.of(
                payment(lastPayment.minusMonths(2), "-43.00", "NETFLIX.COM", "Media Services Ltd"),
                payment(lastPayment.minusMonths(1), "-43.00", "NETFLIX.COM", "Media Services Ltd"),
                payment(lastPayment, "-43.00", "NETFLIX.COM", "Media Services Ltd")));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].merchant").value("Media Services Ltd"))
                .andExpect(jsonPath("$[0].categoryName").value("Subskrypcje"));
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/subscriptions")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/subscriptions/detect")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/subscriptions/summary")).andExpect(status().isUnauthorized());
    }

    private long detectAndGetFirstId(String accessToken) throws Exception {
        String response = mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(response, "$[0].id");
        return id.longValue();
    }

    private static PaymentRecord payment(LocalDate date, String amount, String title, String recipient) {
        return new PaymentRecord(date, new BigDecimal(amount), "PLN", title, recipient);
    }

    private static PaymentRecord newspaper(LocalDate date) {
        return new PaymentRecord(date, new BigDecimal("-15.00"), "PLN", "Gazeta Wyborcza", null);
    }

    private static PaymentRecord netflix(LocalDate date) {
        return new PaymentRecord(date, new BigDecimal("-43.00"), "PLN", "NETFLIX.COM", null);
    }

    private Long userId(String accessToken) throws Exception {
        String response = mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(response, "$.id");
        return id.longValue();
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
