package com.farmer.farmermanagementbackend.DTO;

import java.time.LocalDate;

public class FarmerStockDTO {

    private String farmerId;
    private String vegetableName;
    private String category;
    private String harvestDate;      // Received as "yyyy-MM-dd" string from JS
    private Double quantityKg;
    private Double pricePerKg;
    private String qualityGrade;
    private String expiryEstimate;   // Received as "yyyy-MM-dd" string from JS (optional)

    // Constructors
    public FarmerStockDTO() {}

    // Helper: convert harvestDate string to LocalDate
    public LocalDate getHarvestDateAsLocalDate() {
        if (harvestDate == null || harvestDate.isEmpty()) return null;
        return LocalDate.parse(harvestDate);
    }

    // Helper: convert expiryEstimate string to LocalDate
    public LocalDate getExpiryEstimateAsLocalDate() {
        if (expiryEstimate == null || expiryEstimate.isEmpty()) return null;
        return LocalDate.parse(expiryEstimate);
    }

    // Getters and Setters
    public String getFarmerId() { return farmerId; }
    public void setFarmerId(String farmerId) { this.farmerId = farmerId; }

    public String getVegetableName() { return vegetableName; }
    public void setVegetableName(String vegetableName) { this.vegetableName = vegetableName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getHarvestDate() { return harvestDate; }
    public void setHarvestDate(String harvestDate) { this.harvestDate = harvestDate; }

    public Double getQuantityKg() { return quantityKg; }
    public void setQuantityKg(Double quantityKg) { this.quantityKg = quantityKg; }

    public Double getPricePerKg() { return pricePerKg; }
    public void setPricePerKg(Double pricePerKg) { this.pricePerKg = pricePerKg; }

    public String getQualityGrade() { return qualityGrade; }
    public void setQualityGrade(String qualityGrade) { this.qualityGrade = qualityGrade; }

    public String getExpiryEstimate() { return expiryEstimate; }
    public void setExpiryEstimate(String expiryEstimate) { this.expiryEstimate = expiryEstimate; }
}