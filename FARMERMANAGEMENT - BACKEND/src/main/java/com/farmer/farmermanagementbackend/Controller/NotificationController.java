package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.Model.Notification;
import com.farmer.farmermanagementbackend.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService service;

    // POST /api/notifications
    // Body: { title, message, targetRole, priority, sentByName }
    @PostMapping
    public ResponseEntity<?> send(@RequestBody Map<String, String> body) {
        try {
            Notification n = service.send(
                    body.get("title"),
                    body.get("message"),
                    body.get("targetRole"),
                    body.get("priority"),
                    body.get("sentByName"));
            return ResponseEntity.ok(n);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/notifications
    // Returns all notifications (admin view)
    @GetMapping
    public List<Notification> getAll() {
        return service.getAll();
    }

    // GET /api/notifications/for/FARMER or /for/CUSTOMER
    // Returns notifications targeted at that role (including ALL)
    @GetMapping("/for/{role}")
    public List<Notification> getForRole(@PathVariable String role) {
        return service.getForRole(role);
    }

    // DELETE /api/notifications/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        boolean deleted = service.delete(id);
        if (deleted)
            return ResponseEntity.ok("Notification deleted.");
        return ResponseEntity.notFound().build();
    }
}
