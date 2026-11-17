package pl.minibank.budget;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class BudgetControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullBudgetLifecycleAndSummaryFlow() throws Exception {
        String token = register(uniqueEmail("budgeteer"), "password123", "Budgeteer");

        // 1. Create custom category "Groceries"
        String catResponse = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Groceries", "type": "EXPENSE"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long categoryId = ((Integer) JsonPath.read(catResponse, "$.id")).longValue();

        // 2. Set monthly budget of 1500 PLN for current month
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        String createBudgetJson = """
                {
                    "categoryId": %d,
                    "monthYear": "%s",
                    "limitAmount": 1500.00,
                    "currency": "PLN"
                }
                """.formatted(categoryId, currentMonth);

        String budgetResponse = mockMvc.perform(post("/api/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBudgetJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryName").value("Groceries"))
                .andExpect(jsonPath("$.limitAmount").value(1500.00))
                .andReturn().getResponse().getContentAsString();

        Long budgetId = ((Integer) JsonPath.read(budgetResponse, "$.id")).longValue();

        // 3. Duplicate budget for same category and month -> 409 Conflict
        mockMvc.perform(post("/api/budgets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBudgetJson))
                .andExpect(status().isConflict());

        // 4. Get list of budgets
        mockMvc.perform(get("/api/budgets?month=" + currentMonth)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(budgetId));

        // 5. Update budget limit to 2000 PLN
        mockMvc.perform(put("/api/budgets/" + budgetId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"limitAmount": 2000.00}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.limitAmount").value(2000.00));

        // 6. Get budget summary with Burn Rate forecast
        mockMvc.perform(get("/api/budgets/summary?month=" + currentMonth)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].limitAmount").value(2000.00))
                .andExpect(jsonPath("$[0].status").value("OK"));

        // 7. Delete budget -> 204 No Content
        mockMvc.perform(delete("/api/budgets/" + budgetId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        // 8. Verify it's gone
        mockMvc.perform(get("/api/budgets/" + budgetId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotAccessAnotherUserBudget() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        String bobToken = register(uniqueEmail("bob"), "password123", "Bob");

        // Alice creates category and budget
        String catRes = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Hobbies", "type": "EXPENSE"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long catId = ((Integer) JsonPath.read(catRes, "$.id")).longValue();

        String budgetRes = mockMvc.perform(post("/api/budgets")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "categoryId": %d,
                                    "monthYear": "%s",
                                    "limitAmount": 500.00
                                }
                                """.formatted(catId, LocalDate.now().withDayOfMonth(1))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long budgetId = ((Integer) JsonPath.read(budgetRes, "$.id")).longValue();

        // Bob tries to access Alice's budget -> 404 Not Found
        mockMvc.perform(get("/api/budgets/" + budgetId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isNotFound());

        // Bob tries to update Alice's budget -> 404 Not Found
        mockMvc.perform(put("/api/budgets/" + budgetId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"limitAmount": 999.00}
                                """))
                .andExpect(status().isNotFound());
    }

    private String register(String email, String password, String displayName) throws Exception {
        String json = """
                {"email": "%s", "password": "%s", "displayName": "%s"}
                """.formatted(email, password, displayName);

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(response, "$.accessToken");
    }

    private static String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
