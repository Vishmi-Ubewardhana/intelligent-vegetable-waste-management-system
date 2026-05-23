package com.farmer.farmermanagementbackend.Service;

import com.farmer.farmermanagementbackend.Model.FarmerStock;
import com.farmer.farmermanagementbackend.DTO.FarmerStockDTO;
import com.farmer.farmermanagementbackend.Repository.FarmerStockRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

@Service
public class FarmerStockService {

    @Autowired
    private FarmerStockRepository farmerStockRepository;

    @Value("${ai.fastapi.predict-url:http://localhost:8000/predict}")
    private String fastApiPredictUrl;

    // ==================== CREATE OPERATIONS ====================
    @Transactional
    public FarmerStock addNewStock(FarmerStockDTO stockDTO) {
        // Validate input
        if (stockDTO.getFarmerId() == null || stockDTO.getFarmerId().isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        if (stockDTO.getVegetableName() == null || stockDTO.getVegetableName().isEmpty()) {
            throw new IllegalArgumentException("Vegetable name is required");
        }
        if (stockDTO.getQuantityKg() == null || stockDTO.getQuantityKg() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }
        if (stockDTO.getPricePerKg() == null || stockDTO.getPricePerKg() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }

        FarmerStock farmerStock = new FarmerStock();

        farmerStock.setFarmerId(stockDTO.getFarmerId());
        farmerStock.setVegetableName(stockDTO.getVegetableName());
        farmerStock.setCategory(stockDTO.getCategory());
        farmerStock.setQuantityKg(stockDTO.getQuantityKg());
        farmerStock.setPricePerKg(stockDTO.getPricePerKg());
        farmerStock.setQualityGrade(stockDTO.getQualityGrade());
        farmerStock.setAvailabilityStatus("Available");
        farmerStock.setIsVisible(true);
        farmerStock.setCreatedAt(LocalDateTime.now());
        farmerStock.setUpdatedAt(LocalDateTime.now());

        // === FIXED: Convert String → LocalDate ===
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        if (stockDTO.getHarvestDate() != null && !stockDTO.getHarvestDate().isEmpty()) {
            farmerStock.setHarvestDate(LocalDate.parse(stockDTO.getHarvestDate(), formatter));
        }

        if (stockDTO.getExpiryEstimate() != null && !stockDTO.getExpiryEstimate().isEmpty()) {
            farmerStock.setExpiryEstimate(LocalDate.parse(stockDTO.getExpiryEstimate(), formatter));
        }

        FarmerStock savedStock = farmerStockRepository.save(farmerStock);
        String orderId = generateOrderId(savedStock.getFarmerId(), savedStock.getStockId());
        savedStock.setOrderId(orderId);
        return farmerStockRepository.save(savedStock);
    }

    private String generateOrderId(String farmerId, Integer stockId) {
        if (farmerId == null || stockId == null) {
            return null;
        }
        String cleanFarmerId = farmerId.replaceAll("[^A-Za-z0-9]", "");
        return cleanFarmerId + "-" + stockId;
    }
    // ==================== READ OPERATIONS ====================

    public List<FarmerStock> getAllStocksByFarmerId(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        return farmerStockRepository.findByFarmerId(farmerId);
    }

    public List<FarmerStock> getAllAvailableStocks() {
        return farmerStockRepository.findAll()
                .stream()
                .filter(stock -> !stock.getAvailabilityStatus().equals("Out of Stock"))
                .collect(Collectors.toList());
    }

    public List<FarmerStock> getStocksByFarmerAndCategory(String farmerId, String category) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        if (category == null || category.isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        return farmerStockRepository.findByFarmerIdAndCategory(farmerId, category);
    }

    public List<FarmerStock> searchStocksByVegetableName(String farmerId, String vegetableName) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        if (vegetableName == null || vegetableName.isEmpty()) {
            throw new IllegalArgumentException("Vegetable name is required");
        }
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getVegetableName()
                        .toLowerCase()
                        .contains(vegetableName.toLowerCase()))
                .collect(Collectors.toList());
    }

    public FarmerStock getStockById(Integer stockId) {
        return farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));
    }

    public Map<String, Object> getAiPricePrediction(Integer stockId) {
        FarmerStock stock = getStockById(stockId);

        Map<String, Object> stockPayload = new HashMap<>();
        stockPayload.put("vegetableName", stock.getVegetableName());
        stockPayload.put("pricePerKg", stock.getPricePerKg());
        stockPayload.put("quantityKg", stock.getQuantityKg());
        stockPayload.put("harvestDate", stock.getHarvestDate() != null ? stock.getHarvestDate().toString() : null);
        stockPayload.put("expiryEstimate",
                stock.getExpiryEstimate() != null ? stock.getExpiryEstimate().toString() : null);

        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("farmerId", stock.getFarmerId());
        requestPayload.put("stocks", Collections.singletonList(stockPayload));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(requestPayload, headers);

        try {
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity(fastApiPredictUrl, httpEntity, Map.class);

            Map responseBody = response.getBody();
            if (responseBody == null) {
                throw new IllegalStateException("AI service returned an empty prediction response");
            }

            Object predictionsObj = responseBody.get("predictions");
            if (!(predictionsObj instanceof List) || ((List<?>) predictionsObj).isEmpty()) {
                throw new IllegalStateException("AI service did not return any predictions");
            }

            Object firstPrediction = ((List<?>) predictionsObj).get(0);
            if (!(firstPrediction instanceof Map)) {
                throw new IllegalStateException("AI service returned malformed prediction payload");
            }

            Map<?, ?> prediction = (Map<?, ?>) firstPrediction;
            Double suggestedPrice = toDouble(prediction.get("suggestedPricePerKg"));
            if (suggestedPrice == null) {
                throw new IllegalStateException("AI service did not return suggested price");
            }

            Map<String, Object> result = new HashMap<>();
            result.put("stockId", stock.getStockId());
            result.put("vegetableName", stock.getVegetableName());
            result.put("currentPricePerKg", stock.getPricePerKg());
            result.put("predictedPricePerKg", suggestedPrice);
            result.put("modelConfidence", toDouble(prediction.get("confidence")));
            result.put("weeklyDemandKg", toDouble(prediction.get("weeklyDemandKg")));
            result.put("demandLevel", prediction.get("demandLevel"));
            result.put("demandTrend", prediction.get("demandTrend"));
            result.put("wastageRisk", prediction.get("wastageRisk"));
            result.put("message", prediction.get("recommendedAction"));
            return result;
        } catch (ResourceAccessException e) {
            throw new IllegalStateException(
                    "Cannot reach AI service at " + fastApiPredictUrl + ". Ensure FastAPI is running.");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to get AI prediction: " + e.getMessage());
        }
    }

    private Double toDouble(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public List<FarmerStock> getLowStockItems(String farmerId) {
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getQuantityKg() < 10)
                .collect(Collectors.toList());
    }

    public List<FarmerStock> getCriticalSpoilageRiskItems(String farmerId) {
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .filter(stock -> "Critical".equals(calculateSpoilageRisk(stock.getExpiryEstimate()))
                        || "Expired".equals(calculateSpoilageRisk(stock.getExpiryEstimate())))
                .collect(Collectors.toList());
    }

    // ==================== SPOILAGE & WASTAGE CALCULATIONS ====================

    /**
     * Calculate spoilage risk based on expiry date
     */
    public String calculateSpoilageRisk(LocalDate expiryDate) {
        if (expiryDate == null) {
            return "Unknown";
        }

        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), expiryDate);

        if (daysUntilExpiry < 0) {
            return "Expired";
        } else if (daysUntilExpiry < 2) {
            return "Critical";
        } else if (daysUntilExpiry < 5) {
            return "High";
        } else if (daysUntilExpiry < 10) {
            return "Medium";
        } else {
            return "Low";
        }
    }

    /**
     * Calculate predicted demand (simplified - can be replaced with AI model)
     * This uses historical average sales pattern
     */
    public Double calculatePredictedDemand(FarmerStock stock) {
        if (stock.getExpiryEstimate() == null) {
            return 0.0;
        }

        long daysUntilExpiry = ChronoUnit.DAYS.between(LocalDate.now(), stock.getExpiryEstimate());

        if (daysUntilExpiry <= 0) {
            return 0.0; // No demand for expired items
        }

        // Simple demand calculation based on category (can be enhanced with AI)
        double dailyDemand = getDailyDemandRate(stock.getVegetableName(), stock.getCategory());

        // Factor in urgency - demand drops as expiry approaches
        if (daysUntilExpiry <= 2) {
            dailyDemand *= 0.6; // Only 60% of normal demand for items expiring in <2 days
        } else if (daysUntilExpiry <= 5) {
            dailyDemand *= 0.8; // 80% demand for items expiring in <5 days
        }

        return dailyDemand * daysUntilExpiry;
    }

    /**
     * Get daily demand rate (simplified - replace with historical data or AI)
     */
    private double getDailyDemandRate(String vegetableName, String category) {
        // Simplified demand rates per day per vegetable type
        Map<String, Double> demandRates = new HashMap<>();
        demandRates.put("Tomato", 8.0);
        demandRates.put("Carrot", 6.0);
        demandRates.put("Potato", 10.0);
        demandRates.put("Spinach", 5.0);
        demandRates.put("Cabbage", 7.0);
        demandRates.put("Cucumber", 6.5);
        demandRates.put("Onion", 9.0);
        demandRates.put("Beans", 6.5);
        demandRates.put("Cauliflower", 7.5);
        demandRates.put("Okra", 5.5);
        demandRates.put("Brinjal", 7.0);
        demandRates.put("Green chilli", 8.0);

        // Default rates by category if specific vegetable not found
        String vegLower = vegetableName.toLowerCase();
        for (Map.Entry<String, Double> entry : demandRates.entrySet()) {
            if (vegLower.contains(entry.getKey().toLowerCase())) {
                return entry.getValue();
            }
        }

        // Category-based defaults
        switch (category) {
            case "Leafy":
                return 5.0;
            case "Root":
                return 7.0;
            case "Fruit":
                return 6.5;
            default:
                return 6.0;
        }
    }

    /**
     * Calculate wastage for a single stock item
     */
    public Map<String, Object> calculateWastage(FarmerStock stock) {
        Map<String, Object> wastageData = new HashMap<>();

        Double predictedDemand = calculatePredictedDemand(stock);
        Double currentQuantity = stock.getQuantityKg();

        // Calculate wastage
        Double wastageKg = Math.max(0, currentQuantity - predictedDemand);
        Double wastagePercentage = (wastageKg / currentQuantity) * 100;
        Double financialLoss = wastageKg * stock.getPricePerKg();

        // Determine severity
        String severity;
        if (wastagePercentage >= 70) {
            severity = "CRITICAL";
        } else if (wastagePercentage >= 40) {
            severity = "HIGH";
        } else if (wastagePercentage >= 20) {
            severity = "MEDIUM";
        } else if (wastagePercentage > 0) {
            severity = "LOW";
        } else {
            severity = "NONE";
        }

        // Generate recommendation
        String recommendation = generateRecommendation(wastagePercentage, stock);

        wastageData.put("stockId", stock.getStockId());
        wastageData.put("vegetableName", stock.getVegetableName());
        wastageData.put("currentQuantityKg", currentQuantity);
        wastageData.put("predictedDemandKg", Math.round(predictedDemand * 100.0) / 100.0);
        wastageData.put("potentialWastageKg", Math.round(wastageKg * 100.0) / 100.0);
        wastageData.put("wastagePercentage", Math.round(wastagePercentage * 100.0) / 100.0);
        wastageData.put("financialLoss", Math.round(financialLoss * 100.0) / 100.0);
        wastageData.put("severity", severity);
        wastageData.put("recommendation", recommendation);
        wastageData.put("daysUntilExpiry",
                stock.getExpiryEstimate() != null ? ChronoUnit.DAYS.between(LocalDate.now(), stock.getExpiryEstimate())
                        : 0);

        return wastageData;
    }

    /**
     * Generate actionable recommendation based on wastage
     */
    private String generateRecommendation(Double wastagePercentage, FarmerStock stock) {
        if (wastagePercentage >= 70) {
            double suggestedPrice = stock.getPricePerKg() * 0.6;
            return String.format("URGENT: Reduce price to Rs. %.2f (40%% off) or donate immediately", suggestedPrice);
        } else if (wastagePercentage >= 40) {
            double suggestedPrice = stock.getPricePerKg() * 0.75;
            return String.format("Reduce price to Rs. %.2f (25%% off) to accelerate sales", suggestedPrice);
        } else if (wastagePercentage >= 20) {
            double suggestedPrice = stock.getPricePerKg() * 0.85;
            return String.format("Apply 15%% discount (Rs. %.2f) to improve sales velocity", suggestedPrice);
        } else if (wastagePercentage > 0) {
            return "Monitor closely, minor wastage expected";
        } else {
            return "No wastage expected - demand is sufficient";
        }
    }

    /**
     * Get comprehensive wastage report for all farmer's stocks
     */
    public Map<String, Object> getWastageReport(String farmerId) {
        List<FarmerStock> stocks = getAllStocksByFarmerId(farmerId);

        List<Map<String, Object>> wastageItems = new ArrayList<>();
        double totalWastageKg = 0;
        double totalFinancialLoss = 0;
        double totalStockKg = 0;

        Map<String, Integer> severityCounts = new HashMap<>();
        severityCounts.put("CRITICAL", 0);
        severityCounts.put("HIGH", 0);
        severityCounts.put("MEDIUM", 0);
        severityCounts.put("LOW", 0);
        severityCounts.put("NONE", 0);

        for (FarmerStock stock : stocks) {
            Map<String, Object> wastageData = calculateWastage(stock);
            wastageItems.add(wastageData);

            totalWastageKg += (Double) wastageData.get("potentialWastageKg");
            totalFinancialLoss += (Double) wastageData.get("financialLoss");
            totalStockKg += stock.getQuantityKg();

            String severity = (String) wastageData.get("severity");
            severityCounts.put(severity, severityCounts.get(severity) + 1);
        }

        // Sort by financial loss (highest first)
        wastageItems.sort((a, b) -> Double.compare((Double) b.get("financialLoss"), (Double) a.get("financialLoss")));

        Map<String, Object> report = new HashMap<>();
        report.put("success", true);
        report.put("farmerId", farmerId);
        report.put("totalStockKg", Math.round(totalStockKg * 100.0) / 100.0);
        report.put("totalWastageKg", Math.round(totalWastageKg * 100.0) / 100.0);
        report.put("totalFinancialLoss", Math.round(totalFinancialLoss * 100.0) / 100.0);
        report.put("wastagePercentage",
                totalStockKg > 0 ? Math.round((totalWastageKg / totalStockKg * 100) * 100.0) / 100.0 : 0);
        report.put("severityCounts", severityCounts);
        report.put("wastageItems", wastageItems);
        report.put("generatedAt", LocalDateTime.now().toString());

        return report;
    }

    // ==================== SORT OPERATIONS ====================

    public List<FarmerStock> getStocksSortedByHarvestDate(String farmerId) {
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .sorted(Comparator.comparing(FarmerStock::getHarvestDate).reversed())
                .collect(Collectors.toList());
    }

    public List<FarmerStock> getStocksSortedByQuantity(String farmerId) {
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .sorted(Comparator.comparing(FarmerStock::getQuantityKg).reversed())
                .collect(Collectors.toList());
    }

    public List<FarmerStock> getStocksSortedByPrice(String farmerId) {
        return getAllStocksByFarmerId(farmerId)
                .stream()
                .sorted(Comparator.comparing(FarmerStock::getPricePerKg).reversed())
                .collect(Collectors.toList());
    }

    // ==================== UPDATE OPERATIONS ====================

    public FarmerStock updateStock(Integer stockId, Double quantity, Double price, String qualityGrade, String status) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));

        if (quantity != null && quantity >= 0) {
            stock.setQuantityKg(quantity);
            if (status == null) {
                if (quantity == 0) {
                    stock.setAvailabilityStatus("Out of Stock");
                } else if (quantity < 10) {
                    stock.setAvailabilityStatus("Low Stock");
                } else {
                    stock.setAvailabilityStatus("Available");
                }
            }
        }

        if (price != null && price > 0) {
            stock.setPricePerKg(price);
        }

        if (qualityGrade != null && !qualityGrade.isEmpty()) {
            if (qualityGrade.matches("[ABC]")) {
                stock.setQualityGrade(qualityGrade);
            }
        }

        if (status != null && !status.isEmpty()) {
            if (status.matches("Available|Low Stock|Out of Stock")) {
                stock.setAvailabilityStatus(status);
            }
        }

        stock.setUpdatedAt(LocalDateTime.now());
        return farmerStockRepository.save(stock);
    }

    public FarmerStock updateStockQuantity(Integer stockId, Double newQuantity) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));

        if (newQuantity == null || newQuantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }

        stock.setQuantityKg(newQuantity);

        if (newQuantity == 0) {
            stock.setAvailabilityStatus("Out of Stock");
        } else if (newQuantity < 10) {
            stock.setAvailabilityStatus("Low Stock");
        } else {
            stock.setAvailabilityStatus("Available");
        }

        stock.setUpdatedAt(LocalDateTime.now());
        return farmerStockRepository.save(stock);
    }

    public FarmerStock updateStockPrice(Integer stockId, Double newPrice) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));

        if (newPrice == null || newPrice <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }

        stock.setPricePerKg(newPrice);
        stock.setUpdatedAt(LocalDateTime.now());
        return farmerStockRepository.save(stock);
    }

    public FarmerStock updateStockQuality(Integer stockId, String qualityGrade) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));

        if (qualityGrade == null || qualityGrade.isEmpty()) {
            throw new IllegalArgumentException("Quality grade is required");
        }

        if (!qualityGrade.matches("[ABC]")) {
            throw new IllegalArgumentException("Quality grade must be A, B, or C");
        }

        stock.setQualityGrade(qualityGrade);
        stock.setUpdatedAt(LocalDateTime.now());
        return farmerStockRepository.save(stock);
    }

    public FarmerStock updateStockStatus(Integer stockId, String status) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));

        if (status == null || status.isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }

        if (!status.matches("Available|Low Stock|Out of Stock")) {
            throw new IllegalArgumentException("Invalid status. Must be: Available, Low Stock, or Out of Stock");
        }

        stock.setAvailabilityStatus(status);
        stock.setUpdatedAt(LocalDateTime.now());
        return farmerStockRepository.save(stock);
    }

    // ==================== DELETE OPERATIONS ====================

    public void deleteStock(Integer stockId) {
        FarmerStock stock = farmerStockRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock not found with ID: " + stockId));
        farmerStockRepository.deleteById(stockId);
    }

    public int deleteAllStocksByFarmerId(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        List<FarmerStock> stocks = farmerStockRepository.findByFarmerId(farmerId);
        int count = stocks.size();
        farmerStockRepository.deleteAll(stocks);
        return count;
    }

    public int deleteZeroQuantityStocks(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        List<FarmerStock> stocks = farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getQuantityKg() == 0)
                .collect(Collectors.toList());
        int count = stocks.size();
        if (count > 0) {
            farmerStockRepository.deleteAll(stocks);
        }
        return count;
    }

    public int deleteOutOfStockItems(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        List<FarmerStock> stocks = farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> "Out of Stock".equals(stock.getAvailabilityStatus()))
                .collect(Collectors.toList());
        int count = stocks.size();
        if (count > 0) {
            farmerStockRepository.deleteAll(stocks);
        }
        return count;
    }

    public int deleteExpiredStocks(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        LocalDate today = LocalDate.now();
        List<FarmerStock> stocks = farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getExpiryEstimate() != null && stock.getExpiryEstimate().isBefore(today))
                .collect(Collectors.toList());
        int count = stocks.size();
        if (count > 0) {
            farmerStockRepository.deleteAll(stocks);
        }
        return count;
    }

    public int getZeroQuantityStocksCount(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        return (int) farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getQuantityKg() == 0)
                .count();
    }

    public int getOutOfStockItemsCount(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        return (int) farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> "Out of Stock".equals(stock.getAvailabilityStatus()))
                .count();
    }

    public int getExpiredStocksCount(String farmerId) {
        if (farmerId == null || farmerId.isEmpty()) {
            throw new IllegalArgumentException("Farmer ID is required");
        }
        LocalDate today = LocalDate.now();
        return (int) farmerStockRepository.findByFarmerId(farmerId)
                .stream()
                .filter(stock -> stock.getExpiryEstimate() != null && stock.getExpiryEstimate().isBefore(today))
                .count();
    }
}