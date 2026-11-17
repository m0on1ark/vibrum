package pl.minibank.transaction.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;
import pl.minibank.category.Category;
import pl.minibank.category.CategoryRepository;
import pl.minibank.category.CategoryType;
import pl.minibank.category.CategorizationRule;
import pl.minibank.category.CategorizationRuleRepository;
import pl.minibank.category.RuleMatchType;
import pl.minibank.category.RuleTarget;
import pl.minibank.currency.service.NbpCurrencyService;
import pl.minibank.transaction.repository.BankAccountRepository;
import pl.minibank.user.User;
import pl.minibank.user.UserRepository;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TransactionApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BankAccountRepository bankAccountRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CategorizationRuleRepository ruleRepository;

    @MockitoBean
    private NbpCurrencyService nbpCurrencyService;

    @Test
    void shouldCreateAccountImportCsvAndReturnCategorizedTransactions() throws Exception {
        // 1. Setup Data
        User user = new User("api@test.com", "hash", "API User");
        User savedUser = userRepository.save(user);

        Category category = new Category(savedUser, "Spożywcze", CategoryType.EXPENSE);
        category = categoryRepository.save(category);

        CategorizationRule rule = new CategorizationRule(
                savedUser,
                category,
                RuleMatchType.KEYWORD, 
                RuleTarget.ANY,
                "biedronka",
                1
        );
        ruleRepository.save(rule);
        
        when(nbpCurrencyService.getExchangeRateToPln(any(), any())).thenReturn(BigDecimal.ONE);

        // 2. Create Account via API
        String createAccountPayload = """
                {
                    "accountName": "Daily",
                    "bankType": "PKO_BP",
                    "baseCurrency": "PLN"
                }
                """;

        String accountResponse = mockMvc.perform(post("/api/accounts")
                        .with(jwt().jwt(j -> j.subject(savedUser.getId().toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createAccountPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andReturn().getResponse().getContentAsString();

        // Extract account ID
        Long accountId = 1L;
        // 3. Import CSV
        String csv = """
                Data,Kwota,Waluta,Tytuł,Odbiorca
                2026-11-10,-45.99,PLN,Zakupy,BIEDRONKA
                """;
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/api/accounts/" + accountId + "/import")
                        .file(file)
                        .with(jwt().jwt(j -> j.subject(savedUser.getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.importedCount").value(1));

        // 4. Verify Transactions and Category
        mockMvc.perform(get("/api/transactions")
                        .with(jwt().jwt(j -> j.subject(savedUser.getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Zakupy"))
                .andExpect(jsonPath("$.content[0].categoryName").value("Spożywcze"));
    }
}