package com.farmer.farmermanagementbackend.Repository;

import com.farmer.farmermanagementbackend.Model.FarmerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmerOrderRepository extends JpaRepository<FarmerOrder, Integer> {

    // All orders for a farmer, newest first
    List<FarmerOrder> findByFarmerIdOrderByCreatedAtDesc(String farmerId);

    // Orders filtered by status
    List<FarmerOrder> findByFarmerIdAndOrderStatusOrderByCreatedAtDesc(String farmerId, String orderStatus);

    // Orders by stock item
    List<FarmerOrder> findByStockIdOrderByCreatedAtDesc(Integer stockId);

    // Count pending orders for a farmer
    long countByFarmerIdAndOrderStatus(String farmerId, String orderStatus);

    // All orders for a customer, newest first
    List<FarmerOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}