package com.farmer.farmermanagementbackend.DTO;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class FarmerStockResponseDTO {
    private Integer stockId;
    private String farmerId;
    private String orderId;
    private String vegetableName;
    private String category;
    private LocalDate harvestDate;
    private Double quantityKg;
    private Double pricePerKg;
    private String qualityGrade;
    private LocalDate expiryEstimate;
    private String availabilityStatus;
    private String spoilageRisk;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // NEW: Wastage calculation fields
    private Double predictedDemandKg;
    private Double potentialWastageKg;
    private Double wastagePercentage;
    private Double financialLoss;
    private String wastageSeverity;
    private String recommendation;

    // Constructors
    public FarmerStockResponseDTO() {
    }

    public FarmerStockResponseDTO(Integer stockId, String farmerId, String vegetableName,
            String category, LocalDate harvestDate, Double quantityKg,
            Double pricePerKg, String qualityGrade, LocalDate expiryEstimate,
            String availabilityStatus, String spoilageRisk) {
        this.stockId = stockId;
        this.farmerId = farmerId;
        this.vegetableName = vegetableName;
        this.category = category;
        this.harvestDate = harvestDate;
        this.quantityKg = quantityKg;
        this.pricePerKg = pricePerKg;
        this.qualityGrade = qualityGrade;
        this.expiryEstimate = expiryEstimate;
        this.availabilityStatus = availabilityStatus;
        this.spoilageRisk = spoilageRisk;
    }

    // Getters and Setters
    public Integer getStockId() {
        return stockId;
    }

    public void setStockId(Integer stockId) {
        this.stockId = stockId;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getVegetableName() {
        return vegetableName;
    }

    public void setVegetableName(String vegetableName) {
        this.vegetableName = vegetableName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public void setHarvestDate(LocalDate harvestDate) {
        this.harvestDate = harvestDate;
    }

    public Double getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(Double quantityKg) {
        this.quantityKg = quantityKg;
    }

    public Double getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(Double pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public String getQualityGrade() {
        return qualityGrade;
    }

    public void setQualityGrade(String qualityGrade) {
        this.qualityGrade = qualityGrade;
    }

    public LocalDate getExpiryEstimate() {
        return expiryEstimate;
    }

    public void setExpiryEstimate(LocalDate expiryEstimate) {
        this.expiryEstimate = expiryEstimate;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getSpoilageRisk() {
        return spoilageRisk;
    }

    public void setSpoilageRisk(String spoilageRisk) {
        this.spoilageRisk = spoilageRisk;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // NEW: Wastage fields getters/setters
    public Double getPredictedDemandKg() {
        return predictedDemandKg;
    }

    public void setPredictedDemandKg(Double predictedDemandKg) {
        this.predictedDemandKg = predictedDemandKg;
    }

    public Double getPotentialWastageKg() {
        return potentialWastageKg;
    }

    public void setPotentialWastageKg(Double potentialWastageKg) {
        this.potentialWastageKg = potentialWastageKg;
    }

    public Double getWastagePercentage() {
        return wastagePercentage;
    }

    public void setWastagePercentage(Double wastagePercentage) {
        this.wastagePercentage = wastagePercentage;
    }

    public Double getFinancialLoss() {
        return financialLoss;
    }

    public void setFinancialLoss(Double financialLoss) {
        this.financialLoss = financialLoss;
    }

    public String getWastageSeverity() {
        return wastageSeverity;
    }

    public void setWastageSeverity(String wastageSeverity) {
        this.wastageSeverity = wastageSeverity;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }
}