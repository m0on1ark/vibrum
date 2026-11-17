package pl.minibank.user;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import pl.minibank.TestcontainersConfiguration;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class ProfileApiTests {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void updatesDisplayNameAndCurrency() throws Exception {
        String email = uniqueEmail();
        String token = accessToken(register(email));

        update(token, """
                {"displayName": "  Ruslan D.  ", "baseCurrency": "eur"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Ruslan D."))
                .andExpect(jsonPath("$.baseCurrency").value("EUR"))
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void rejectsInvalidValues() throws Exception {
        String token = accessToken(register(uniqueEmail()));

        update(token, """
                {"displayName": "   ", "baseCurrency": "EURO", "email": "not-an-email"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.displayName").exists())
                .andExpect(jsonPath("$.errors.baseCurrency").exists())
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    void changingEmailRequiresCorrectPassword() throws Exception {
        String token = accessToken(register(uniqueEmail()));
        String newEmail = uniqueEmail();

        update(token, """
                {"email": "%s"}
                """.formatted(newEmail))
                .andExpect(status().isBadRequest());
        update(token, """
                {"email": "%s", "currentPassword": "wrong-password"}
                """.formatted(newEmail))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cannotTakeSomeoneElsesEmail() throws Exception {
        String takenEmail = uniqueEmail();
        register(takenEmail);
        String token = accessToken(register(uniqueEmail()));

        update(token, """
                {"email": "%s", "currentPassword": "%s"}
                """.formatted(takenEmail.toUpperCase(), PASSWORD))
                .andExpect(status().isConflict());
    }

    @Test
    void changingEmailMovesLoginAndEndsSessions() throws Exception {
        String oldEmail = uniqueEmail();
        MockHttpServletResponse registered = register(oldEmail);
        String refreshToken = registered.getCookie("refreshToken").getValue();
        String newEmail = uniqueEmail();

        update(accessToken(registered), """
                {"email": "%s", "currentPassword": "%s"}
                """.formatted(newEmail, PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(newEmail));

        login(oldEmail).andExpect(status().isUnauthorized());
        login(newEmail).andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie("refreshToken", refreshToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mockMvc.perform(patch("/api/users/me").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions update(String token, String body) throws Exception {
        return mockMvc.perform(patch("/api/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s"}
                        """.formatted(email, PASSWORD)));
    }

    private MockHttpServletResponse register(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s", "displayName": "Test"}
                                """.formatted(email, PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn().getResponse();
    }

    private static String accessToken(MockHttpServletResponse response) throws Exception {
        return JsonPath.read(response.getContentAsString(), "$.accessToken");
    }

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }
}
