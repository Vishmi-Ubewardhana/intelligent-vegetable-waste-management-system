package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.Service.FarmerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/farmer")
@CrossOrigin(origins = "*")
public class FarmerOrderAliasController {

    @Autowired
    private FarmerOrderService orderService;

    // Backward-compatible alias for frontend calls like /api/farmer/F001
    @GetMapping("/{farmerId}")
    public ResponseEntity<Map<String, Object>> getOrdersByFarmerAlias(@PathVariable String farmerId) {
        if (farmerId == null || farmerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "farmerId is required"));
        }
        return ResponseEntity.ok(orderService.getOrdersByFarmer(farmerId));
    }
}
