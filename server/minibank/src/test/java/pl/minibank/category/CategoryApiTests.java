package pl.minibank.category;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import pl.minibank.TestcontainersConfiguration;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CategoryApiTests {

    @Autowired
    private MockMvc mockMvc;

    private String token;
    private String otherToken;

    @BeforeEach
    void setUp() throws Exception {
        token = registerAndGetToken();
        otherToken = registerAndGetToken();
    }

    @Test
    void listContainsSystemCategories() throws Exception {
        perform(get("/api/categories"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'Spożywcze')].system").value(hasItem(true)))
                .andExpect(jsonPath("$[*].name").value(hasItem("Wynagrodzenie")));
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
    }

    @Test
    void createdCategoryIsVisibleOnlyToOwner() throws Exception {
        createCategory(token, "Alkohol").andExpect(status().isCreated())
                .andExpect(jsonPath("$.system").value(false));

        perform(get("/api/categories"), token)
                .andExpect(jsonPath("$[*].name").value(hasItem("Alkohol")));
        perform(get("/api/categories"), otherToken)
                .andExpect(jsonPath("$[*].name").value(not(hasItem("Alkohol"))));
    }

    @Test
    void duplicateNameReturnsConflict() throws Exception {
        createCategory(token, "sport").andExpect(status().isConflict());
        createCategory(token, "Alkohol").andExpect(status().isCreated());
        createCategory(token, "ALKOHOL").andExpect(status().isConflict());
        createCategory(otherToken, "Alkohol").andExpect(status().isCreated());
    }

    @Test
    void updateAndDeleteOwnCategory() throws Exception {
        long id = id(createCategory(token, "Alkohol"));

        perform(put("/api/categories/" + id).contentType(MediaType.APPLICATION_JSON)
                .content(categoryJson("Napoje", "EXPENSE")), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Napoje"));

        perform(delete("/api/categories/" + id), token).andExpect(status().isNoContent());
        perform(get("/api/categories"), token)
                .andExpect(jsonPath("$[*].name").value(not(hasItem("Napoje"))));
    }

    @Test
    void cannotModifySystemOrForeignCategory() throws Exception {
        long systemId = categoryId(token, "Sport");
        long foreignId = id(createCategory(otherToken, "Prywatne"));

        perform(delete("/api/categories/" + systemId), token).andExpect(status().isForbidden());
        perform(delete("/api/categories/" + foreignId), token).andExpect(status().isNotFound());
        perform(put("/api/categories/" + foreignId).contentType(MediaType.APPLICATION_JSON)
                .content(categoryJson("Hack", "EXPENSE")), token)
                .andExpect(status().isNotFound());
    }

    @Test
    void systemRulesCategorizeKnownMerchants() throws Exception {
        testCategorization(token, "BIEDRONKA 1234 WARSZAWA", null)
                .andExpect(jsonPath("$.matched").value(true))
                .andExpect(jsonPath("$.category.name").value("Spożywcze"));
        testCategorization(token, "Karnet", "ZDROFIT SP. Z O.O.")
                .andExpect(jsonPath("$.category.name").value("Sport"));
        testCategorization(token, "Przelew od Jana", null)
                .andExpect(jsonPath("$.matched").value(false));
    }

    @Test
    void userRuleOverridesSystemRuleOnlyForThatUser() throws Exception {
        long alcohol = id(createCategory(token, "Alkohol"));
        createRule(token, alcohol, "KEYWORD", "BIEDRONKA").andExpect(status().isCreated())
                .andExpect(jsonPath("$.system").value(false));

        testCategorization(token, "BIEDRONKA 1234", null)
                .andExpect(jsonPath("$.category.name").value("Alkohol"));
        testCategorization(otherToken, "BIEDRONKA 1234", null)
                .andExpect(jsonPath("$.category.name").value("Spożywcze"));
    }

    @Test
    void regexRuleWorksAndInvalidRegexIsRejected() throws Exception {
        long transport = categoryId(token, "Transport");
        createRule(token, transport, "REGEX", "^MPK\\s+(KRAKOW|WROCLAW)").andExpect(status().isCreated());
        createRule(token, transport, "REGEX", "[unclosed").andExpect(status().isBadRequest());

        testCategorization(token, "MPK KRAKOW bilet", null)
                .andExpect(jsonPath("$.category.name").value("Transport"));
    }

    @Test
    void cannotCreateRuleForForeignCategory() throws Exception {
        long foreignId = id(createCategory(otherToken, "Prywatne"));

        createRule(token, foreignId, "KEYWORD", "TEST").andExpect(status().isNotFound());
    }

    @Test
    void cannotModifySystemRules() throws Exception {
        String rules = perform(get("/api/categorization-rules"), token)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<Integer> systemIds = JsonPath.read(rules, "$[?(@.system == true)].id");
        assertThat(systemIds).isNotEmpty();

        perform(delete("/api/categorization-rules/" + systemIds.getFirst()), token)
                .andExpect(status().isForbidden());
    }

    @Test
    void ownRuleCanBeUpdatedAndDeleted() throws Exception {
        long sport = categoryId(token, "Sport");
        long ruleId = id(createRule(token, sport, "KEYWORD", "BASEN"));

        perform(put("/api/categorization-rules/" + ruleId).contentType(MediaType.APPLICATION_JSON)
                .content(ruleJson(sport, "KEYWORD", "PLYWALNIA")), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pattern").value("PLYWALNIA"));
        perform(delete("/api/categorization-rules/" + ruleId), otherToken).andExpect(status().isNotFound());
        perform(delete("/api/categorization-rules/" + ruleId), token).andExpect(status().isNoContent());
    }

    @Test
    void testRequiresTitleOrCounterparty() throws Exception {
        testCategorization(token, " ", null).andExpect(status().isBadRequest());
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

    private ResultActions perform(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request, String accessToken)
            throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + accessToken));
    }

    private ResultActions createCategory(String accessToken, String name) throws Exception {
        return perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON)
                .content(categoryJson(name, "EXPENSE")), accessToken);
    }

    private ResultActions createRule(String accessToken, long categoryId, String matchType, String pattern)
            throws Exception {
        return perform(post("/api/categorization-rules").contentType(MediaType.APPLICATION_JSON)
                .content(ruleJson(categoryId, matchType, pattern)), accessToken);
    }

    private ResultActions testCategorization(String accessToken, String title, String counterparty) throws Exception {
        String body = """
                {"title": %s, "counterparty": %s}
                """.formatted(quote(title), quote(counterparty));
        return perform(post("/api/categorization-rules/test").contentType(MediaType.APPLICATION_JSON)
                .content(body), accessToken);
    }

    private long categoryId(String accessToken, String name) throws Exception {
        String response = perform(get("/api/categories"), accessToken)
                .andReturn().getResponse().getContentAsString();
        List<Integer> ids = JsonPath.read(response, "$[?(@.name == '" + name + "')].id");
        return ids.getFirst();
    }

    private static long id(ResultActions result) throws Exception {
        Number id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
        return id.longValue();
    }

    private static String categoryJson(String name, String type) {
        return """
                {"name": "%s", "type": "%s"}
                """.formatted(name, type);
    }

    private static String ruleJson(long categoryId, String matchType, String pattern) {
        return """
                {"categoryId": %d, "matchType": "%s", "pattern": "%s"}
                """.formatted(categoryId, matchType, pattern.replace("\\", "\\\\"));
    }

    private static String quote(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }
}
