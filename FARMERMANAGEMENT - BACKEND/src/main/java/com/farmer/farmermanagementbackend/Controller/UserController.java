package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService service;

    // ── REGISTER ──────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = service.register(user);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Registration failed: " + e.getMessage());
        }
    }

    // ── LOGIN ─────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            User found = service.login(email, password);

            if (found != null) {
                return ResponseEntity.ok(found);
            }

            return ResponseEntity.status(401)
                    .body("Invalid credentials or account not active/pending approval");

        } catch (Exception e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // ── GET ALL ───────────────────────────────────────────────
    @GetMapping
    public List<User> getAllUsers() {
        return service.getAllUsers();
    }

    // ── GET BY ROLE ───────────────────────────────────────────
    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable String role) {
        return service.getUsersByRole(role);
    }

    // ── GET BY ID ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable int id) {
        User user = service.getUserById(id);

        if (user != null) {
            return ResponseEntity.ok(user);
        }

        return ResponseEntity.notFound().build();
    }

    // ── UPDATE ────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable int id, @RequestBody User updated) {
        try {
            User user = service.updateUser(id, updated);

            if (user != null) {
                return ResponseEntity.ok(user);
            }

            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── DELETE ────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id) {

        boolean deleted = service.deleteUser(id);

        if (deleted) {
            return ResponseEntity.ok("User deleted successfully.");
        }

        return ResponseEntity.notFound().build();
    }

    // ── APPROVE FARMER ────────────────────────────────────────
    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable int id) {
        try {
            User user = service.approveUser(id);

            if (user != null) {
                return ResponseEntity.ok(Map.of(
                        "message", "Farmer approved",
                        "farmerId", user.getFarmerId(),
                        "status", user.getStatus()));
            }

            return ResponseEntity.notFound().build();

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── DEACTIVATE USER ───────────────────────────────────────
    @PutMapping("/deactivate/{id}")
    public ResponseEntity<?> deactivate(@PathVariable int id) {
        try {
            service.deactivateUser(id);
            return ResponseEntity.ok("User deactivated.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            service.sendForgotPasswordOtp(body.get("email"));
            return ResponseEntity.ok("OTP sent to " + body.get("email"));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── VERIFY OTP ────────────────────────────────────────────
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {

        boolean valid = service.verifyOtp(
                body.get("email"),
                body.get("otp"));

        if (valid) {
            return ResponseEntity.ok("OTP verified.");
        }

        return ResponseEntity.status(400).body("Invalid or expired OTP.");
    }

    // ── RESET PASSWORD ────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {

            service.resetPassword(
                    body.get("email"),
                    body.get("newPassword"));

            return ResponseEntity.ok("Password updated successfully.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {

            service.changePassword(
                    body.get("email"),
                    body.get("currentPassword"),
                    body.get("newPassword"));

            return ResponseEntity.ok("Password changed successfully.");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}