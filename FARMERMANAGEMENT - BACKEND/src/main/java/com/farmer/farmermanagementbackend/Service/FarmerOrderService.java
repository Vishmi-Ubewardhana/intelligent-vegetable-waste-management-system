package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.DTO.FarmerOrderDTO;
import com.farmer.farmermanagementbackend.DTO.FarmerOrderResponseDTO;
import com.farmer.farmermanagementbackend.DTO.UpdateOrderStatusDTO;
import com.farmer.farmermanagementbackend.Model.FarmerOrder;
import com.farmer.farmermanagementbackend.Repository.FarmerOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FarmerOrderService {

    @Autowired
    private FarmerOrderRepository orderRepository;

    @Autowired
    private com.farmer.farmermanagementbackend.Repository.FarmerStockRepository stockRepository;

    // ── Valid statuses in order ────────────────────────────────
    private static final List<String> VALID_STATUSES = Arrays.asList(
            "PENDING", "CONFIRMED", "READY", "DISPATCHED", "DELIVERED", "CANCELLED", "REJECTED");

    // ══════════════════════════════════════════════════════════
    // CREATE ORDER
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> createOrder(FarmerOrderDTO dto) {
        Map<String, Object> resp = new HashMap<>();
        try {
            // Validation
            if (dto.getFarmerId() == null || dto.getFarmerId().isBlank()) {
                resp.put("success", false);
                resp.put("message", "Farmer ID is required");
                return resp;
            }
            if (dto.getVegetableName() == null || dto.getVegetableName().isBlank()) {
                resp.put("success", false);
                resp.put("message", "Vegetable name is required");
                return resp;
            }
            if (dto.getCustomerName() == null || dto.getCustomerName().isBlank()) {
                resp.put("success", false);
                resp.put("message", "Customer name is required");
                return resp;
            }
            if (dto.getQuantityKg() == null || dto.getQuantityKg() <= 0) {
                resp.put("success", false);
                resp.put("message", "Quantity must be > 0");
                return resp;
            }
            if (dto.getPricePerKg() == null || dto.getPricePerKg() <= 0) {
                resp.put("success", false);
                resp.put("message", "Price must be > 0");
                return resp;
            }
            if (dto.getPaymentMethod() == null || dto.getPaymentMethod().isBlank()) {
                resp.put("success", false);
                resp.put("message", "Payment method is required");
                return resp;
            }

            // Check stock and reduce quantity
            if (dto.getStockId() != null) {
                Optional<com.farmer.farmermanagementbackend.Model.FarmerStock> optStock = stockRepository.findById(dto.getStockId());
                if (optStock.isPresent()) {
                    com.farmer.farmermanagementbackend.Model.FarmerStock stock = optStock.get();
                    if (stock.getQuantityKg() < dto.getQuantityKg()) {
                        resp.put("success", false);
                        resp.put("message", "Not enough stock available. Only " + stock.getQuantityKg() + " kg left.");
                        return resp;
                    }
                    double newQty = stock.getQuantityKg() - dto.getQuantityKg();
                    stock.setQuantityKg(newQty);
                    if (newQty == 0) {
                        stock.setAvailabilityStatus("Out of Stock");
                    } else if (newQty < 10) {
                        stock.setAvailabilityStatus("Low Stock");
                    }
                    stockRepository.save(stock);
                }
            }

            FarmerOrder order = new FarmerOrder(
                    dto.getFarmerId(), dto.getStockId(), dto.getVegetableName(),
                    dto.getCustomerName(), dto.getCustomerId(),
                    dto.getQuantityKg(), dto.getPricePerKg(),
                    dto.getPaymentMethod().toUpperCase(),
                    dto.getDeliveryAddress(), dto.getNotes());

            FarmerOrder saved = orderRepository.save(order);
            resp.put("success", true);
            resp.put("message", "Order created successfully");
            resp.put("data", toDTO(saved));
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error creating order: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // GET ALL ORDERS FOR A FARMER
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> getOrdersByFarmer(String farmerId) {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<FarmerOrder> orders = orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
            List<FarmerOrderResponseDTO> dtos = new ArrayList<>();
            for (FarmerOrder o : orders)
                dtos.add(toDTO(o));
            resp.put("success", true);
            resp.put("data", dtos);
            resp.put("count", dtos.size());
            resp.put("pendingCount", orderRepository.countByFarmerIdAndOrderStatus(farmerId, "PENDING"));
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error fetching orders: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // GET ORDERS BY STATUS
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> getOrdersByCustomer(String customerId) {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<FarmerOrder> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
            List<FarmerOrderResponseDTO> dtos = new ArrayList<>();
            for (FarmerOrder o : orders)
                dtos.add(toDTO(o));
            resp.put("success", true);
            resp.put("data", dtos);
            resp.put("count", dtos.size());
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error fetching orders: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // GET ORDERS BY STATUS
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> getOrdersByStatus(String farmerId, String status) {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<FarmerOrder> orders = orderRepository
                    .findByFarmerIdAndOrderStatusOrderByCreatedAtDesc(farmerId, status.toUpperCase());
            List<FarmerOrderResponseDTO> dtos = new ArrayList<>();
            for (FarmerOrder o : orders)
                dtos.add(toDTO(o));
            resp.put("success", true);
            resp.put("data", dtos);
            resp.put("count", dtos.size());
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error fetching orders: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // GET SINGLE ORDER
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> getOrderById(Integer orderId) {
        Map<String, Object> resp = new HashMap<>();
        Optional<FarmerOrder> opt = orderRepository.findById(orderId);
        if (opt.isEmpty()) {
            resp.put("success", false);
            resp.put("message", "Order not found");
            return resp;
        }
        resp.put("success", true);
        resp.put("data", toDTO(opt.get()));
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // UPDATE ORDER STATUS
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> updateOrderStatus(Integer orderId, UpdateOrderStatusDTO dto) {
        Map<String, Object> resp = new HashMap<>();
        try {
            if (dto == null || dto.getOrderStatus() == null || dto.getOrderStatus().isBlank()) {
                resp.put("success", false);
                resp.put("message", "Order status is required");
                return resp;
            }
            if (!VALID_STATUSES.contains(dto.getOrderStatus().toUpperCase())) {
                resp.put("success", false);
                resp.put("message", "Invalid status. Valid: " + VALID_STATUSES);
                return resp;
            }
            Optional<FarmerOrder> opt = orderRepository.findById(orderId);
            if (opt.isEmpty()) {
                resp.put("success", false);
                resp.put("message", "Order not found");
                return resp;
            }

            FarmerOrder order = opt.get();
            order.setOrderStatus(dto.getOrderStatus().toUpperCase());
            if (dto.getNotes() != null && !dto.getNotes().isBlank())
                order.setNotes(dto.getNotes());
            FarmerOrder updated = orderRepository.save(order);

            resp.put("success", true);
            resp.put("message", "Order status updated to " + updated.getOrderStatus());
            resp.put("data", toDTO(updated));
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error updating order: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // DELETE ORDER
    // ══════════════════════════════════════════════════════════
    public Map<String, Object> deleteOrder(Integer orderId) {
        Map<String, Object> resp = new HashMap<>();
        try {
            if (!orderRepository.existsById(orderId)) {
                resp.put("success", false);
                resp.put("message", "Order not found");
                return resp;
            }
            orderRepository.deleteById(orderId);
            resp.put("success", true);
            resp.put("message", "Order deleted successfully");
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Error deleting order: " + e.getMessage());
        }
        return resp;
    }

    // ══════════════════════════════════════════════════════════
    // ENTITY → DTO
    // ══════════════════════════════════════════════════════════
    private FarmerOrderResponseDTO toDTO(FarmerOrder o) {
        FarmerOrderResponseDTO d = new FarmerOrderResponseDTO();
        d.setOrderId(o.getOrderId());
        d.setFarmerId(o.getFarmerId());
        d.setStockId(o.getStockId());
        d.setVegetableName(o.getVegetableName());
        d.setCustomerName(o.getCustomerName());
        d.setCustomerId(o.getCustomerId());
        d.setQuantityKg(o.getQuantityKg());
        d.setPricePerKg(o.getPricePerKg());
        d.setTotalAmount(o.getTotalAmount());
        d.setPaymentMethod(o.getPaymentMethod());
        d.setOrderStatus(o.getOrderStatus());
        d.setDeliveryAddress(o.getDeliveryAddress());
        d.setNotes(o.getNotes());
        d.setCreatedAt(o.getCreatedAt());
        d.setUpdatedAt(o.getUpdatedAt());

        // Build human-readable summary sentence
        // e.g. "Customer Gunathilaka bought 5.0 kg of Beans, paid using Card."
        String pm = o.getPaymentMethod() == null ? "Cash"
                : o.getPaymentMethod().substring(0, 1).toUpperCase()
                        + o.getPaymentMethod().substring(1).toLowerCase().replace("_", " ");
        String summary = "Customer " + o.getCustomerName()
                + " bought " + o.getQuantityKg() + " kg of " + o.getVegetableName()
                + ", paid using " + pm + "."
                + " Total: Rs. " + String.format("%.2f", o.getTotalAmount());
        d.setOrderSummary(summary);

        // Status colour
        d.setStatusColor(statusColor(o.getOrderStatus()));
        return d;
    }

    private String statusColor(String status) {
        if (status == null)
            return "grey";
        return switch (status.toUpperCase()) {
            case "PENDING" -> "amber";
            case "CONFIRMED" -> "blue";
            case "READY" -> "blue";
            case "DISPATCHED" -> "blue";
            case "DELIVERED" -> "green";
            case "CANCELLED" -> "grey";
            case "REJECTED" -> "red";
            default -> "grey";
        };
    }
}