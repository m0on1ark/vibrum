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
    void nonMemberReceivesNotFound() throws Exception {
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

        // Stranger tries to get details -> 404 Not Found (standardized)
        mockMvc.perform(get("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isNotFound());

        // Stranger tries to get balances -> 404 Not Found
        mockMvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void cannotRemoveMemberWithUnsettledBalance() throws Exception {
        String aliceEmail = uniqueEmail("alice");
        String aliceToken = register(aliceEmail, "password123", "Alice");

        String bobEmail = uniqueEmail("bob");
        String bobToken = register(bobEmail, "password123", "Bob");

        String charlieEmail = uniqueEmail("charlie");
        register(charlieEmail, "password123", "Charlie");

        // Alice creates group and adds Bob and Charlie
        String groupRes = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Flatmates"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long groupId = ((Integer) JsonPath.read(groupRes, "$.id")).longValue();

        mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(bobEmail)))
                .andExpect(status().isCreated());

        String charlieRes = mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(charlieEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long charlieId = ((Integer) JsonPath.read(charlieRes, "$.userId")).longValue();

        // Alice pays 90 split equally among Alice, Bob, Charlie (each owes 30)
        mockMvc.perform(post("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Utilities",
                                    "amount": 90.00,
                                    "currency": "PLN",
                                    "expenseDate": "%s",
                                    "splitMode": "EQUAL",
                                    "splits": []
                                }
                                """.formatted(LocalDate.now())))
                .andExpect(status().isCreated());

        // Alice tries to remove Charlie who owes 30 -> 409 Conflict
        mockMvc.perform(delete("/api/groups/" + groupId + "/members/" + charlieId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Member has unsettled balance"));

        // Add a fourth member David with no expenses
        String davidEmail = uniqueEmail("david");
        register(davidEmail, "password123", "David");

        String davidRes = mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(davidEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long davidId = ((Integer) JsonPath.read(davidRes, "$.userId")).longValue();

        // Alice removes David with 0 balance -> 204 No Content
        mockMvc.perform(delete("/api/groups/" + groupId + "/members/" + davidId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void percentAndFixedSplitModesWithCustomPayer() throws Exception {
        String aliceEmail = uniqueEmail("alice");
        String aliceToken = register(aliceEmail, "password123", "Alice");

        String bobEmail = uniqueEmail("bob");
        String bobToken = register(bobEmail, "password123", "Bob");

        String groupRes = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Project Expenses"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long groupId = ((Integer) JsonPath.read(groupRes, "$.id")).longValue();
        Long aliceId = ((Integer) JsonPath.read(groupRes, "$.createdById")).longValue();

        String bobRes = mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(bobEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long bobId = ((Integer) JsonPath.read(bobRes, "$.userId")).longValue();

        // 1. PERCENT split: 100 PLN (Alice 70%, Bob 30%), paidBy Bob
        mockMvc.perform(post("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "Design software",
                                    "amount": 100.00,
                                    "currency": "PLN",
                                    "expenseDate": "%s",
                                    "splitMode": "PERCENT",
                                    "paidByUserId": %d,
                                    "splits": [
                                        {"userId": %d, "percent": 70.0},
                                        {"userId": %d, "percent": 30.0}
                                    ]
                                }
                                """.formatted(LocalDate.now(), bobId, aliceId, bobId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paidById").value(bobId))
                .andExpect(jsonPath("$.splits[0].shareAmount").value(70.00))
                .andExpect(jsonPath("$.splits[1].shareAmount").value(30.00));

        // 2. Non-PLN currency should be rejected with 400 Bad Request
        mockMvc.perform(post("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "title": "US Hosting",
                                    "amount": 50.00,
                                    "currency": "USD",
                                    "expenseDate": "%s",
                                    "splitMode": "EQUAL"
                                }
                                """.formatted(LocalDate.now())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Only PLN currency is currently supported"));
    }

    @Test
    void listGroupsReturnsCorrectMemberCountForEachGroup() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        String bobEmail = uniqueEmail("bob");
        register(bobEmail, "password123", "Bob");
        String carolEmail = uniqueEmail("carol");
        register(carolEmail, "password123", "Carol");

        Long soloId = createGroup(aliceToken, "Solo");
        Long pairId = createGroup(aliceToken, "Pair");
        Long trioId = createGroup(aliceToken, "Trio");

        addMember(aliceToken, pairId, bobEmail);
        addMember(aliceToken, trioId, bobEmail);
        addMember(aliceToken, trioId, carolEmail);

        mockMvc.perform(get("/api/groups")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[?(@.id == %d)].memberCount".formatted(soloId)).value(1))
                .andExpect(jsonPath("$[?(@.id == %d)].memberCount".formatted(pairId)).value(2))
                .andExpect(jsonPath("$[?(@.id == %d)].memberCount".formatted(trioId)).value(3));
    }

    @Test
    void listGroupsForUserWithoutGroupsReturnsEmptyList() throws Exception {
        String token = register(uniqueEmail("loner"), "password123", "Loner");

        mockMvc.perform(get("/api/groups")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void nonCreatorCannotDirectlyAddMember_returnsForbidden403() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Secret Society");

        String bobEmail = uniqueEmail("bob");
        String bobToken = register(bobEmail, "password123", "Bob");
        addMember(aliceToken, groupId, bobEmail);

        String charlieEmail = uniqueEmail("charlie");
        register(charlieEmail, "password123", "Charlie");

        // Bob is a member, but NOT the creator. Direct addMember must return 403 Forbidden.
        mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(charlieEmail)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Only the group creator can directly add members"));
    }

    private Long createGroup(String token, String name) throws Exception {
        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "%s"}
                                """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Integer) JsonPath.read(response, "$.id")).longValue();
    }

    private void addMember(String token, Long groupId, String email) throws Exception {
        mockMvc.perform(post("/api/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(email)))
                .andExpect(status().isCreated());
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
