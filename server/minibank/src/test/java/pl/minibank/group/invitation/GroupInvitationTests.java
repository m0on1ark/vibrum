package pl.minibank.group.invitation;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class GroupInvitationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GroupInvitationRepository invitationRepository;

    @MockitoBean
    private JavaMailSender mailSender;

    @BeforeEach
    void setUp() {
        clearInvocations(mailSender);
    }

    @Test
    void inviteUserFlow_savesPendingSendsEmailAndAccepts() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Mountain Trekkers");

        String bobEmail = uniqueEmail("bob");
        String bobToken = register(bobEmail, "password123", "Bob");

        // 1. Alice invites Bob
        String inviteResponse = mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(bobEmail)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.groupId").value(groupId))
                .andExpect(jsonPath("$.groupName").value("Mountain Trekkers"))
                .andExpect(jsonPath("$.invitedByDisplayName").value("Alice"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Long invitationId = ((Integer) JsonPath.read(inviteResponse, "$.id")).longValue();

        // 2. Verify mail was sent
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly(bobEmail);
        assertThat(message.getSubject()).isEqualTo("Vibrum: zaproszenie do grupy");
        assertThat(message.getText()).contains("Mountain Trekkers");
        assertThat(message.getText()).contains("/invitations");

        // 3. Bob checks his invitations
        mockMvc.perform(get("/api/invitations")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(invitationId))
                .andExpect(jsonPath("$[0].groupName").value("Mountain Trekkers"))
                .andExpect(jsonPath("$[0].invitedByDisplayName").value("Alice"))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        // 4. Bob accepts the invitation
        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        // 5. Bob is now a member of the group
        mockMvc.perform(get("/api/groups/" + groupId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.members", hasSize(2)));
    }

    @Test
    void declineInvitation_setsStatusToDeclined() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Cinema Club");

        String charlieEmail = uniqueEmail("charlie");
        String charlieToken = register(charlieEmail, "password123", "Charlie");

        String response = mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(charlieEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long invitationId = ((Integer) JsonPath.read(response, "$.id")).longValue();

        // Charlie declines
        mockMvc.perform(post("/api/invitations/" + invitationId + "/decline")
                        .header("Authorization", "Bearer " + charlieToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DECLINED"));

        // Charlie cannot accept after declining
        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                        .header("Authorization", "Bearer " + charlieToken))
                .andExpect(status().isConflict());
    }

    @Test
    void duplicateInvitation_returnsConflict() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Hackathon Team");

        String daveEmail = uniqueEmail("dave");
        register(daveEmail, "password123", "Dave");

        // First invite
        mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(daveEmail)))
                .andExpect(status().isCreated());

        // Second invite while first is PENDING -> 409 Conflict
        mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(daveEmail)))
                .andExpect(status().isConflict());
    }

    @Test
    void acceptOrDeclineByAnotherUser_returnsNotFound404() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Secret Society");

        String eveEmail = uniqueEmail("eve");
        register(eveEmail, "password123", "Eve");

        String response = mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(eveEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long invitationId = ((Integer) JsonPath.read(response, "$.id")).longValue();

        String intruderToken = register(uniqueEmail("intruder"), "password123", "Intruder");

        // Intruder tries to accept Eve's invitation -> 404 Not Found (neutral, does not leak existence)
        mockMvc.perform(post("/api/invitations/" + invitationId + "/accept")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isNotFound());

        // Intruder tries to decline Eve's invitation -> 404 Not Found
        mockMvc.perform(post("/api/invitations/" + invitationId + "/decline")
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void expiredInvitation_allowsReinviting() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Trip to Alps");

        String frankEmail = uniqueEmail("frank");
        register(frankEmail, "password123", "Frank");

        // 1. Alice invites Frank
        String response = mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(frankEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long firstInvitationId = ((Integer) JsonPath.read(response, "$.id")).longValue();

        // 2. Set expires_at into the past
        GroupInvitation firstInvitation = invitationRepository.findById(firstInvitationId).orElseThrow();
        firstInvitation.setExpiresAt(java.time.Instant.now().minus(java.time.Duration.ofDays(1)));
        invitationRepository.saveAndFlush(firstInvitation);

        // 3. Alice invites Frank again -> succeeds with 201 Created
        String secondResponse = mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(frankEmail)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long secondInvitationId = ((Integer) JsonPath.read(secondResponse, "$.id")).longValue();
        assertThat(secondInvitationId).isNotEqualTo(firstInvitationId);

        // 4. Verify first invitation is now EXPIRED and second is PENDING
        GroupInvitation updatedFirst = invitationRepository.findById(firstInvitationId).orElseThrow();
        assertThat(updatedFirst.getStatus()).isEqualTo(GroupInvitationStatus.EXPIRED);

        GroupInvitation updatedSecond = invitationRepository.findById(secondInvitationId).orElseThrow();
        assertThat(updatedSecond.getStatus()).isEqualTo(GroupInvitationStatus.PENDING);
    }

    @Test
    void inviteNonExistentUser_returnsNotFound() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Game Devs");

        mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "nobody@nowhere.com"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void inviteExistingMember_returnsConflict() throws Exception {
        String aliceEmail = uniqueEmail("alice");
        String aliceToken = register(aliceEmail, "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Book Club");

        mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(aliceEmail)))
                .andExpect(status().isConflict());
    }

    @Test
    void nonMemberCannotInvite_returnsNotFound() throws Exception {
        String aliceToken = register(uniqueEmail("alice"), "password123", "Alice");
        Long groupId = createGroup(aliceToken, "Private Circle");

        String strangerToken = register(uniqueEmail("stranger"), "password123", "Stranger");
        String someUser = uniqueEmail("someone");
        register(someUser, "password123", "Someone");

        mockMvc.perform(post("/api/groups/" + groupId + "/invitations")
                        .header("Authorization", "Bearer " + strangerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(someUser)))
                .andExpect(status().isNotFound());
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
