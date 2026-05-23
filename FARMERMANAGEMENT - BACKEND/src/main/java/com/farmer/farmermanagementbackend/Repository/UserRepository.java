package com.farmer.farmermanagementbackend.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.farmer.farmermanagementbackend.Model.User;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Integer> {
    User findByEmail(String email);

    List<User> findByRole(String role);

    // Get the highest farmerId number already assigned (e.g. "F007" → 7)
    @Query("SELECT MAX(CAST(SUBSTRING(u.farmerId, 2) AS int)) FROM User u WHERE u.role = 'FARMER' AND u.farmerId IS NOT NULL")
    Integer findMaxFarmerIdNumber();
}