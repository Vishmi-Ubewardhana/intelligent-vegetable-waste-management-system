package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository repo;

    // Store OTPs temporarily (email -> otp)
    private static final Map<String, String> otpStorage = new HashMap<>();

    // ── REGISTER ──────────────────────────────────────────────
    public User register(User user) {
        // Check email already exists
        if (repo.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email already registered");
        }

        if ("FARMER".equalsIgnoreCase(user.getRole())) {
            user.setStatus("pending"); // needs admin approval
            user.setFarmerId(null); // assigned after approval
        } else {
            user.setStatus("active");
        }

        return repo.save(user);
    }

    // ── LOGIN ─────────────────────────────────────────────────
    public User login(String email, String password) {
        User user = repo.findByEmail(email);
        if (user == null)
            return null;
        if (!user.getPassword().equals(password))
            return null;
        if ("pending".equals(user.getStatus()))
            return null;
        if ("inactive".equals(user.getStatus()))
            return null;
        return user;
    }

    // ── APPROVE FARMER ────────────────────────────────────────
    // Called by admin — activates farmer and generates farmer ID
    public User approveUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user == null)
            return null;

        user.setStatus("active");

        // Auto-generate farmer ID only for FARMER role
        if ("FARMER".equalsIgnoreCase(user.getRole()) && user.getFarmerId() == null) {
            String farmerId = generateFarmerId();
            user.setFarmerId(farmerId);
        }

        return repo.save(user);
    }

    // ── GENERATE FARMER ID ────────────────────────────────────
    // Generates F001, F002, F003 ... automatically
    private String generateFarmerId() {
        long count = repo.findAll().stream()
                .filter(u -> "FARMER".equalsIgnoreCase(u.getRole()) && u.getFarmerId() != null)
                .count();
        return String.format("F%03d", count + 1);
    }

    // ── OTHER OPERATIONS ──────────────────────────────────────
    public List<User> getAllUsers() {
        return repo.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return repo.findAll().stream()
                .filter(u -> role.equalsIgnoreCase(u.getRole()))
                .collect(Collectors.toList());
    }

    public User getUserById(int id) {
        return repo.findById(id).orElse(null);
    }

    public User updateUser(int id, User updated) {
        User user = repo.findById(id).orElse(null);
        if (user == null)
            return null;
        user.setName(updated.getName());
        user.setPhone(updated.getPhone());
        user.setNic(updated.getNic());
        user.setFarmSize(updated.getFarmSize());
        user.setFarmLocation(updated.getFarmLocation());
        user.setYearsOfExperience(updated.getYearsOfExperience());
        user.setDeliveryAddress(updated.getDeliveryAddress());
        return repo.save(user);
    }

    public boolean deleteUser(int id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }

    public void deactivateUser(int id) {
        User user = repo.findById(id).orElse(null);
        if (user != null) {
            user.setStatus("inactive");
            repo.save(user);
        }
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────
    public void sendForgotPasswordOtp(String email) {
        User user = repo.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Email not found");
        }
        // Generate a 6-digit OTP
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        otpStorage.put(email, otp);
        // TODO: Integrate email service to send OTP to user
        System.out.println("OTP for " + email + ": " + otp);
    }

    // ── VERIFY OTP ────────────────────────────────────────────
    public boolean verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStorage.remove(email); // OTP used, remove it
            return true;
        }
        return false;
    }

    // ── RESET PASSWORD ────────────────────────────────────────
    public void resetPassword(String email, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Email not found");
        }
        user.setPassword(newPassword);
        repo.save(user);
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = repo.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Email not found");
        }
        if (!user.getPassword().equals(currentPassword)) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(newPassword);
        repo.save(user);
    }
}