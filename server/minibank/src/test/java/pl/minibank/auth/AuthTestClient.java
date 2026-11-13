package pl.minibank.auth;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.auth.session.RefreshTokenCookies;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

final class AuthTestClient {

    static final String PASSWORD = "password123";

    private final MockMvc mockMvc;

    AuthTestClient(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@example.com";
    }

    MockHttpServletResponse register(String email, String userAgent) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .header(HttpHeaders.USER_AGENT, userAgent)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s", "displayName": "Test User"}
                                """.formatted(email, PASSWORD)))
                .andReturn().getResponse();
    }

    MockHttpServletResponse login(String email, String password, String userAgent) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .header(HttpHeaders.USER_AGENT, userAgent)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s"}
                                """.formatted(email, password)))
                .andReturn().getResponse();
    }

    MockHttpServletResponse refresh(String refreshToken) throws Exception {
        return mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new Cookie(RefreshTokenCookies.COOKIE_NAME, refreshToken)))
                .andReturn().getResponse();
    }

    static String accessToken(MockHttpServletResponse response) throws Exception {
        return JsonPath.read(response.getContentAsString(), "$.accessToken");
    }

    static String refreshToken(MockHttpServletResponse response) {
        Cookie cookie = response.getCookie(RefreshTokenCookies.COOKIE_NAME);
        return cookie == null ? null : cookie.getValue();
    }
}
