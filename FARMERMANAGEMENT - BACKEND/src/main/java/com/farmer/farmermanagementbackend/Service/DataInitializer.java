package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.User;
import com.farmer.farmermanagementbackend.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedAdmin(UserRepository repo, JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Drop the obsolete foreign key constraint that references a legacy 'farmers' table
                jdbcTemplate.execute("ALTER TABLE farmer_stock DROP FOREIGN KEY farmer_stock_ibfk_1");
                System.out.println("✅ Dropped obsolete foreign key constraint from farmer_stock.");
            } catch (Exception e) {
                // Ignore if it doesn't exist or already dropped
            }

            User admin = repo.findByEmail("admin@veglife.com");
            if (admin == null) {
                admin = new User();
                admin.setName("VegLife Admin");
                admin.setEmail("admin@veglife.com");
                admin.setRole("ADMIN");
                admin.setStatus("active");
                admin.setPhone("0771234567");
                admin.setNic("199012345678");
            }
            admin.setPassword("Admin@123");
            repo.save(admin);
            System.out.println("==============================================");
            System.out.println("  VegLife Admin account configured:");
            System.out.println("  Email   : admin@veglife.com");
            System.out.println("  Password: Admin@123");
            System.out.println("==============================================");
        };
    }
}
