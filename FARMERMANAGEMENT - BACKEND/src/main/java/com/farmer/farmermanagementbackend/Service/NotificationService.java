package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.Notification;
import com.farmer.farmermanagementbackend.Repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    public Notification send(String title, String message, String targetRole, String priority, String sentByName) {
        Notification n = new Notification();
        n.setTitle(title);
        n.setMessage(message);
        n.setTargetRole(targetRole);
        n.setPriority(priority);
        n.setSentByName(sentByName);
        n.setSentAt(LocalDateTime.now());
        return repo.save(n);
    }

    public List<Notification> getAll() {
        return repo.findAllByOrderBySentAtDesc();
    }

    public List<Notification> getForRole(String role) {
        return repo.findForRole(role);
    }

    public boolean delete(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }
}