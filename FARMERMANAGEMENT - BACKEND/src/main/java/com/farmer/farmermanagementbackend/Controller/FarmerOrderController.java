package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.DTO.FarmerOrderDTO;
import com.farmer.farmermanagementbackend.DTO.UpdateOrderStatusDTO;
import com.farmer.farmermanagementbackend.Service.FarmerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({ "/api/farmer/orders", "/api/orders" })
@CrossOrigin(origins = "*")
public class FarmerOrderController {

    @Autowired
    private FarmerOrderService orderService;

    // ── Create a new order ─────────────────────────────────────
    // POST /api/farmer/orders
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody FarmerOrderDTO dto) {
        return ResponseEntity.ok(orderService.createOrder(dto));
    }

    // ── Get all orders for a farmer ────────────────────────────
    // GET /api/farmer/orders/farmer/{farmerId}
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<Map<String, Object>> getOrdersByFarmer(@PathVariable String farmerId) {
        if (farmerId == null || farmerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "farmerId is required"));
        }
        return ResponseEntity.ok(orderService.getOrdersByFarmer(farmerId));
    }

    // ── Get all orders for a customer ──────────────────────────
    // GET /api/farmer/orders/customer/{customerId}
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getOrdersByCustomer(@PathVariable String customerId) {
        if (customerId == null || customerId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "customerId is required"));
        }
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    // ── Get orders filtered by status ──────────────────────────
    // GET /api/farmer/orders/farmer/{farmerId}/status/{status}
    @GetMapping("/farmer/{farmerId}/status/{status}")
    public ResponseEntity<Map<String, Object>> getOrdersByStatus(
            @PathVariable String farmerId,
            @PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(farmerId, status));
    }

    // ── Get a single order ─────────────────────────────────────
    // GET /api/farmer/orders/{orderId}
    @GetMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderById(@PathVariable Integer orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    // ── Update order status ────────────────────────────────────
    // PATCH /api/farmer/orders/{orderId}/status
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable Integer orderId,
            @RequestBody UpdateOrderStatusDTO dto) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, dto));
    }

    // ── Delete an order ────────────────────────────────────────
    // DELETE /api/farmer/orders/{orderId}
    @DeleteMapping("/{orderId}")
    public ResponseEntity<Map<String, Object>> deleteOrder(@PathVariable Integer orderId) {
        return ResponseEntity.ok(orderService.deleteOrder(orderId));
    }
}