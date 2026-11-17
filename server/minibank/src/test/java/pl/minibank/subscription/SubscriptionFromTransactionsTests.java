package pl.minibank.subscription;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class SubscriptionFromTransactionsTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void detectsSubscriptionsInImportedStatement() throws Exception {
        String token = registerAndGetToken();
        LocalDate last = LocalDate.now().minusDays(5);
        importStatement(token, """
                date,amount,currency,title,recipient
                %s,-43.00,PLN,NETFLIX.COM,Netflix International
                %s,-43.00,PLN,NETFLIX.COM,Netflix International
                %s,-43.00,PLN,NETFLIX.COM,Netflix International
                %s,-45.20,PLN,BIEDRONKA 1234 WARSZAWA,Jeronimo Martins
                %s,-128.90,PLN,BIEDRONKA 5678 WARSZAWA,Jeronimo Martins
                %s,5200.00,PLN,Wynagrodzenie,Firma XYZ
                %s,5200.00,PLN,Wynagrodzenie,Firma XYZ
                %s,5200.00,PLN,Wynagrodzenie,Firma XYZ
                """.formatted(
                last.minusMonths(2), last.minusMonths(1), last,
                last.minusDays(3), last.minusDays(1),
                last.minusMonths(2), last.minusMonths(1), last));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].merchant").value("Netflix International"))
                .andExpect(jsonPath("$[0].billingPeriod").value("MONTHLY"))
                .andExpect(jsonPath("$[0].occurrences").value(3))
                .andExpect(jsonPath("$[0].nextPaymentDate").value(last.plusMonths(1).toString()))
                .andExpect(jsonPath("$[0].categoryName").value("Subskrypcje"));
    }

    @Test
    void usesOnlyOwnTransactions() throws Exception {
        String owner = registerAndGetToken();
        String other = registerAndGetToken();
        LocalDate last = LocalDate.now().minusDays(5);
        importStatement(owner, """
                date,amount,currency,title,recipient
                %s,-23.99,PLN,SPOTIFY,Spotify AB
                %s,-23.99,PLN,SPOTIFY,Spotify AB
                %s,-23.99,PLN,SPOTIFY,Spotify AB
                """.formatted(last.minusMonths(2), last.minusMonths(1), last));

        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/subscriptions/detect").header("Authorization", "Bearer " + owner))
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/subscriptions/summary").header("Authorization", "Bearer " + owner))
                .andExpect(jsonPath("$[0].monthlyCost").value(23.99));
    }

    private void importStatement(String token, String csv) throws Exception {
        String account = mockMvc.perform(post("/api/accounts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"accountName": "PKO", "bankType": "PKO_BP", "baseCurrency": "PLN"}
                                """))
                .andReturn().getResponse().getContentAsString();
        Number accountId = JsonPath.read(account, "$.id");

        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/accounts/" + accountId + "/import")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
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
