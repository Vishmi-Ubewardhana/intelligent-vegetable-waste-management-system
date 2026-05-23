package com.farmer.farmermanagementbackend.DTO;

public class AiPricePredictionRequestDTO {
    private String vegetableName;
    private String category;
    private Double quantityKg;
    private String qualityGrade;
    private String farmerId;
    private String harvestDate;
    private String expiryEstimate;

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

    public Double getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(Double quantityKg) {
        this.quantityKg = quantityKg;
    }

    public String getQualityGrade() {
        return qualityGrade;
    }

    public void setQualityGrade(String qualityGrade) {
        this.qualityGrade = qualityGrade;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public String getHarvestDate() {
        return harvestDate;
    }

    public void setHarvestDate(String harvestDate) {
        this.harvestDate = harvestDate;
    }

    public String getExpiryEstimate() {
        return expiryEstimate;
    }

    public void setExpiryEstimate(String expiryEstimate) {
        this.expiryEstimate = expiryEstimate;
    }
}
