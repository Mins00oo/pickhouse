package app.pickhouse.user;

import app.pickhouse.security.CurrentUserId;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMe(@CurrentUserId UUID userId) {
        userService.softDeleteSelf(userId);
        return ResponseEntity.noContent().build();
    }
}
