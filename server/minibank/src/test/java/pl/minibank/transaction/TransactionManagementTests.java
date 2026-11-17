package pl.minibank.transaction;

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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import pl.minibank.TestcontainersConfiguration;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class TransactionManagementTests {

    @Autowired
    private MockMvc mockMvc;

    private String token;
    private String otherToken;
    private long accountId;

    @BeforeEach
    void setUp() throws Exception {
        token = registerAndGetToken();
        otherToken = registerAndGetToken();
        accountId = createAccount(token, "PKO");
        LocalDate today = LocalDate.now();
        importStatement(token, accountId, """
                date,amount,currency,title,recipient
                %s,-23.90,PLN,ZABKA Z4417,Zabka Polska
                %s,-60.00,PLN,Przelew za bilety,Jan Kowalski
                """.formatted(today, today));
    }

    @Test
    void listShowsCategoryIdAndAccountName() throws Exception {
        perform(get("/api/transactions"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[?(@.title == 'ZABKA Z4417')].categoryName").value(hasItem("Spożywcze")))
                .andExpect(jsonPath("$.content[?(@.title == 'ZABKA Z4417')].categoryId").isNotEmpty())
                .andExpect(jsonPath("$.content[0].accountName").value("PKO"));
    }

    @Test
    void userCanChangeAndClearCategory() throws Exception {
        long transactionId = transactionId("Przelew za bilety");
        long transport = categoryId("Transport");

        perform(patch("/api/transactions/" + transactionId + "/category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\": " + transport + "}"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryName").value("Transport"))
                .andExpect(jsonPath("$.categoryManual").value(true));

        perform(patch("/api/transactions/" + transactionId + "/category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\": null}"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryName").value(nullValue()));
    }

    @Test
    void cannotTouchForeignTransactionOrUseForeignCategory() throws Exception {
        long transactionId = transactionId("ZABKA Z4417");
        long foreignCategory = createCategory(otherToken, "Prywatne");

        perform(patch("/api/transactions/" + transactionId + "/category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\": null}"), otherToken)
                .andExpect(status().isNotFound());
        perform(patch("/api/transactions/" + transactionId + "/category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\": " + foreignCategory + "}"), token)
                .andExpect(status().isNotFound());
    }

    @Test
    void recategorizeAppliesNewRulesButKeepsManualChoices() throws Exception {
        long alcohol = createCategory(token, "Alkohol");
        long manuallySet = transactionId("Przelew za bilety");
        perform(patch("/api/transactions/" + manuallySet + "/category")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"categoryId\": " + categoryId("Transport") + "}"), token)
                .andExpect(status().isOk());

        perform(post("/api/categorization-rules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"categoryId": %d, "matchType": "KEYWORD", "pattern": "ZABKA"}
                        """.formatted(alcohol)), token)
                .andExpect(status().isCreated());
        perform(post("/api/categorization-rules")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"categoryId": %d, "matchType": "KEYWORD", "pattern": "BILETY"}
                        """.formatted(alcohol)), token)
                .andExpect(status().isCreated());

        perform(post("/api/transactions/recategorize"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkedCount").value(1))
                .andExpect(jsonPath("$.changedCount").value(1));

        perform(get("/api/transactions"), token)
                .andExpect(jsonPath("$.content[?(@.title == 'ZABKA Z4417')].categoryName").value(hasItem("Alkohol")))
                .andExpect(jsonPath("$.content[?(@.title == 'Przelew za bilety')].categoryName").value(hasItem("Transport")));
    }

    @Test
    void accountCanBeRenamedAndDeletedWithItsTransactions() throws Exception {
        perform(put("/api/accounts/" + accountId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountName\": \"  PKO Osobiste  \"}"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName").value("PKO Osobiste"));

        perform(delete("/api/accounts/" + accountId), otherToken).andExpect(status().isNotFound());
        perform(delete("/api/accounts/" + accountId), token).andExpect(status().isNoContent());

        perform(get("/api/accounts"), token).andExpect(jsonPath("$", hasSize(0)));
        perform(get("/api/transactions"), token).andExpect(jsonPath("$.content", hasSize(0)));
    }

    @Test
    void renameRequiresName() throws Exception {
        perform(put("/api/accounts/" + accountId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountName\": \" \"}"), token)
                .andExpect(status().isBadRequest());
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String accessToken) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + accessToken));
    }

    private long transactionId(String title) throws Exception {
        String response = perform(get("/api/transactions"), token).andReturn().getResponse().getContentAsString();
        List<Number> ids = JsonPath.read(response, "$.content[?(@.title == '" + title + "')].id");
        return ids.getFirst().longValue();
    }

    private long categoryId(String name) throws Exception {
        String response = perform(get("/api/categories"), token).andReturn().getResponse().getContentAsString();
        List<Number> ids = JsonPath.read(response, "$[?(@.name == '" + name + "')].id");
        return ids.getFirst().longValue();
    }

    private long createCategory(String accessToken, String name) throws Exception {
        String response = perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"" + name + "\", \"type\": \"EXPENSE\"}"), accessToken)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(response, "$.id");
        return id.longValue();
    }

    private long createAccount(String accessToken, String name) throws Exception {
        String response = perform(post("/api/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountName\": \"" + name + "\", \"bankType\": \"PKO_BP\", \"baseCurrency\": \"PLN\"}"), accessToken)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number id = JsonPath.read(response, "$.id");
        return id.longValue();
    }

    private void importStatement(String accessToken, long account, String csv) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/accounts/" + account + "/import")
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
