package pl.minibank.group;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class GroupControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullGroupSettlementFlow() throws Exception {
        // 1. Register Alice and Bob
        String aliceEmail = uniqueEmail("alice");
        String aliceToken = register(aliceEmail, "password123", "Alice");

        String bobEmail = uniqueEmail("bob");
        String bobToken = register(bobEmail, "password123", "Bob");

        // 2. Alice creates an expense group
        String createGroupJson = """
                {"name": "Trip to Warsaw", "description": "Weekend getaway"}
                """;
        String groupResponse = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createGroupJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Trip to Warsaw"))
                .andExpect(jsonPath("$.members", hasSize(1)))
                .andReturn().getResponse().getContentAsString();

        Integer groupIdInt = JsonPath.read(groupResponse, "$.id");
        Long groupId = groupIdInt.longValue();

        // 3. Alice adds Bob to the group
        String addMemberJson = """
                {"email": "%s"}
                """.formatted(bobEmail);
        mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addMemberJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(bobEmail));

        // 4. Bob can now see the group in his list
        mockMvc.perform(get("/api/groups")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Trip to Warsaw"))
                .andExpect(jsonPath("$[0].memberCount").value(2));

        // 5. Alice adds an expense of 100 PLN split EQUALLY (50 Alice, 50 Bob)
        String expenseJson = """
                {
                    "title": "Hotel room",
                    "amount": 100.00,
                    "currency": "PLN",
                    "expenseDate": "%s",
                    "splitMode": "EQUAL",
                    "splits": []
                }
                """.formatted(LocalDate.now());

        String expenseResponse = mockMvc.perform(post("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(expenseJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.splits", hasSize(2)))
                .andReturn().getResponse().getContentAsString();

        Integer splitIdBob = null;
        for (int i = 0; i < 2; i++) {
            String name = JsonPath.read(expenseResponse, "$.splits[" + i + "].displayName");
            if ("Bob".equals(name)) {
                splitIdBob = JsonPath.read(expenseResponse, "$.splits[" + i + "].splitId");
            }
        }

        // 6. Check balances: Alice +50, Bob -50
        mockMvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // 7. Check settlements: Bob owes Alice 50
        mockMvc.perform(get("/api/groups/" + groupId + "/settlements")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].fromDisplayName").value("Bob"))
                .andExpect(jsonPath("$[0].toDisplayName").value("Alice"))
                .andExpect(jsonPath("$[0].amount").value(50.00));

        // 8. Bob marks his split as settled
        mockMvc.perform(patch("/api/groups/expenses/splits/" + splitIdBob + "/settle")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isNoContent());

        // 9. Now all debts are settled, settlements list should be empty
        mockMvc.perform(get("/api/groups/" + groupId + "/settlements")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void nonMemberCannotAccessGroup() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        String strangerToken = register(uniqueEmail("stranger"), "password123", "Stranger");

        String groupResponse = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Secret Group"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer groupId = JsonPath.read(groupResponse, "$.id");

        // Stranger tries to get details -> 403 Forbidden
        mockMvc.perform(get("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());

        // Stranger tries to get balances -> 403 Forbidden
        mockMvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden());
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
