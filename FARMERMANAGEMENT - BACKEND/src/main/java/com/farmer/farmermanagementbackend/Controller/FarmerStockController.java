package com.farmer.farmermanagementbackend.Controller;

import com.farmer.farmermanagementbackend.Model.FarmerStock;
import com.farmer.farmermanagementbackend.DTO.FarmerStockDTO;
import com.farmer.farmermanagementbackend.DTO.FarmerStockResponseDTO;
import com.farmer.farmermanagementbackend.DTO.UpdateStockDTO;
import com.farmer.farmermanagementbackend.Service.FarmerStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/farmer/stocks")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class FarmerStockController {

    @Autowired
    private FarmerStockService farmerStockService;

    // ==================== CREATE OPERATIONS ====================

    @PostMapping("/add")
    // Frontend sends data to this URL to create new stock.
    public ResponseEntity<?> addNewStock(@RequestBody FarmerStockDTO stockDTO) {
        try {
            FarmerStock savedStock = farmerStockService.addNewStock(stockDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vegetable stock added successfully");
            response.put("data", savedStock);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred while adding stock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== READ OPERATIONS ====================
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<FarmerStockResponseDTO>> getAllStocksByFarmerId(@PathVariable String farmerId) {
        try {
            // 1. Get raw stocks from service
            List<FarmerStock> stocks = farmerStockService.getAllStocksByFarmerId(farmerId);

            // 2. Convert to DTOs
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            // 3. CRITICAL: Return ONLY the list. No HashMap, no "data" key.
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/available")
    public ResponseEntity<?> getAllAvailableStocks() {
        try {
            List<FarmerStock> stocks = farmerStockService.getAllAvailableStocks();
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Available stocks retrieved successfully");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{stockId}")
    public ResponseEntity<?> getStockById(@PathVariable Integer stockId) {
        try {
            FarmerStock stock = farmerStockService.getStockById(stockId);
            FarmerStockResponseDTO responseDTO = convertToResponseDTO(stock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock retrieved successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== WASTAGE OPERATIONS (NEW) ====================

    /**
     * NEW: Get comprehensive wastage report for a farmer
     */
    @GetMapping("/farmer/{farmerId}/wastage-report")
    public ResponseEntity<?> getWastageReport(@PathVariable String farmerId) {
        try {
            Map<String, Object> wastageReport = farmerStockService.getWastageReport(farmerId);
            return ResponseEntity.ok(wastageReport);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * NEW: Get wastage calculation for a single stock item
     */
    @GetMapping("/{stockId}/wastage")
    public ResponseEntity<?> getStockWastage(@PathVariable Integer stockId) {
        try {
            FarmerStock stock = farmerStockService.getStockById(stockId);
            Map<String, Object> wastageData = farmerStockService.calculateWastage(stock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", wastageData);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== SEARCH & FILTER OPERATIONS ====================

    @GetMapping("/farmer/{farmerId}/category/{category}")
    public ResponseEntity<?> getStocksByCategory(
            @PathVariable String farmerId,
            @PathVariable String category) {
        try {
            List<FarmerStock> stocks = farmerStockService.getStocksByFarmerAndCategory(farmerId, category);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stocks filtered by category successfully");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/farmer/{farmerId}/search")
    public ResponseEntity<?> searchStocks(
            @PathVariable String farmerId,
            @RequestParam String query) {
        try {
            List<FarmerStock> stocks = farmerStockService.searchStocksByVegetableName(farmerId, query);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Search results retrieved successfully");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== SORT OPERATIONS ====================

    @GetMapping("/farmer/{farmerId}/sort/harvest-date")
    public ResponseEntity<?> getStocksSortedByHarvestDate(@PathVariable String farmerId) {
        try {
            List<FarmerStock> stocks = farmerStockService.getStocksSortedByHarvestDate(farmerId);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stocks sorted by harvest date");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/farmer/{farmerId}/sort/quantity")
    public ResponseEntity<?> getStocksSortedByQuantity(@PathVariable String farmerId) {
        try {
            List<FarmerStock> stocks = farmerStockService.getStocksSortedByQuantity(farmerId);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stocks sorted by quantity");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/farmer/{farmerId}/sort/price")
    public ResponseEntity<?> getStocksSortedByPrice(@PathVariable String farmerId) {
        try {
            List<FarmerStock> stocks = farmerStockService.getStocksSortedByPrice(farmerId);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stocks sorted by price");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== ALERT OPERATIONS ====================

    @GetMapping("/farmer/{farmerId}/low-stock")
    public ResponseEntity<?> getLowStockItems(@PathVariable String farmerId) {
        try {
            List<FarmerStock> stocks = farmerStockService.getLowStockItems(farmerId);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Low stock items retrieved");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/farmer/{farmerId}/critical-spoilage")
    public ResponseEntity<?> getCriticalSpoilageRiskItems(@PathVariable String farmerId) {
        try {
            List<FarmerStock> stocks = farmerStockService.getCriticalSpoilageRiskItems(farmerId);
            List<FarmerStockResponseDTO> responseList = stocks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Critical spoilage risk items retrieved");
            response.put("count", responseList.size());
            response.put("data", responseList);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== UPDATE OPERATIONS ====================

    @PutMapping("/{stockId}")
    public ResponseEntity<?> updateStock(
            @PathVariable Integer stockId,
            @RequestBody UpdateStockDTO updateDTO) {
        try {
            FarmerStock updatedStock = farmerStockService.updateStock(
                    stockId,
                    updateDTO.getQuantityKg(),
                    updateDTO.getPricePerKg(),
                    updateDTO.getQualityGrade(),
                    updateDTO.getAvailabilityStatus());

            FarmerStockResponseDTO responseDTO = convertToResponseDTO(updatedStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred while updating stock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PatchMapping("/{stockId}/quantity")
    public ResponseEntity<?> updateStockQuantity(
            @PathVariable Integer stockId,
            @RequestBody Map<String, Object> request) {
        try {
            Double quantity = Double.parseDouble(request.get("quantityKg").toString());
            FarmerStock updatedStock = farmerStockService.updateStockQuantity(stockId, quantity);
            FarmerStockResponseDTO responseDTO = convertToResponseDTO(updatedStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock quantity updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PatchMapping("/{stockId}/price")
    public ResponseEntity<?> updateStockPrice(
            @PathVariable Integer stockId,
            @RequestBody Map<String, Object> request) {
        try {
            Double price = Double.parseDouble(request.get("pricePerKg").toString());
            FarmerStock updatedStock = farmerStockService.updateStockPrice(stockId, price);
            FarmerStockResponseDTO responseDTO = convertToResponseDTO(updatedStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock price updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PatchMapping("/{stockId}/quality")
    public ResponseEntity<?> updateStockQuality(
            @PathVariable Integer stockId,
            @RequestBody Map<String, Object> request) {
        try {
            String quality = request.get("qualityGrade").toString();
            FarmerStock updatedStock = farmerStockService.updateStockQuality(stockId, quality);
            FarmerStockResponseDTO responseDTO = convertToResponseDTO(updatedStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock quality updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PatchMapping("/{stockId}/status")
    public ResponseEntity<?> updateStockStatus(
            @PathVariable Integer stockId,
            @RequestBody Map<String, Object> request) {
        try {
            String status = request.get("availabilityStatus").toString();
            FarmerStock updatedStock = farmerStockService.updateStockStatus(stockId, status);
            FarmerStockResponseDTO responseDTO = convertToResponseDTO(updatedStock);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock status updated successfully");
            response.put("data", responseDTO);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== DELETE OPERATIONS ====================

    @DeleteMapping("/{stockId}")
    public ResponseEntity<?> deleteStock(@PathVariable Integer stockId) {
        try {
            farmerStockService.deleteStock(stockId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Stock deleted successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred while deleting stock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/farmer/{farmerId}/all")
    public ResponseEntity<?> deleteAllStocks(@PathVariable String farmerId) {
        try {
            int count = farmerStockService.deleteAllStocksByFarmerId(farmerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + " stock(s) deleted successfully");
            response.put("deletedCount", count);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/farmer/{farmerId}/zero-quantity")
    public ResponseEntity<?> deleteZeroQuantityStocks(@PathVariable String farmerId) {
        try {
            int count = farmerStockService.deleteZeroQuantityStocks(farmerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + " zero-quantity stock(s) deleted");
            response.put("deletedCount", count);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/farmer/{farmerId}/out-of-stock")
    public ResponseEntity<?> deleteOutOfStockItems(@PathVariable String farmerId) {
        try {
            int count = farmerStockService.deleteOutOfStockItems(farmerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + " out-of-stock item(s) deleted");
            response.put("deletedCount", count);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/farmer/{farmerId}/expired")
    public ResponseEntity<?> deleteExpiredStocks(@PathVariable String farmerId) {
        try {
            int count = farmerStockService.deleteExpiredStocks(farmerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + " expired stock(s) deleted");
            response.put("deletedCount", count);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/farmer/{farmerId}/delete-preview")
    public ResponseEntity<?> getDeletePreview(@PathVariable String farmerId) {
        try {
            int zeroQtyCount = farmerStockService.getZeroQuantityStocksCount(farmerId);
            int outOfStockCount = farmerStockService.getOutOfStockItemsCount(farmerId);
            int expiredCount = farmerStockService.getExpiredStocksCount(farmerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delete preview retrieved");
            response.put("preview", Map.of(
                    "zeroQuantityCount", zeroQtyCount,
                    "outOfStockCount", outOfStockCount,
                    "expiredCount", expiredCount,
                    "totalCount", zeroQtyCount + outOfStockCount + expiredCount));

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ==================== HELPER METHODS ====================

    private FarmerStockResponseDTO convertToResponseDTO(FarmerStock stock) {
        FarmerStockResponseDTO dto = new FarmerStockResponseDTO();
        dto.setStockId(stock.getStockId());
        dto.setFarmerId(stock.getFarmerId());
        dto.setOrderId(stock.getOrderId());
        dto.setVegetableName(stock.getVegetableName());
        dto.setCategory(stock.getCategory());
        dto.setHarvestDate(stock.getHarvestDate());
        dto.setQuantityKg(stock.getQuantityKg());
        dto.setPricePerKg(stock.getPricePerKg());
        dto.setQualityGrade(stock.getQualityGrade());
        dto.setExpiryEstimate(stock.getExpiryEstimate());
        dto.setAvailabilityStatus(stock.getAvailabilityStatus());
        dto.setSpoilageRisk(farmerStockService.calculateSpoilageRisk(stock.getExpiryEstimate()));
        dto.setCreatedAt(stock.getCreatedAt());
        dto.setUpdatedAt(stock.getUpdatedAt());

        // NEW: Add wastage information
        Map<String, Object> wastageData = farmerStockService.calculateWastage(stock);
        dto.setPredictedDemandKg((Double) wastageData.get("predictedDemandKg"));
        dto.setPotentialWastageKg((Double) wastageData.get("potentialWastageKg"));
        dto.setWastagePercentage((Double) wastageData.get("wastagePercentage"));
        dto.setFinancialLoss((Double) wastageData.get("financialLoss"));
        dto.setWastageSeverity((String) wastageData.get("severity"));
        dto.setRecommendation((String) wastageData.get("recommendation"));

        return dto;
    }
}