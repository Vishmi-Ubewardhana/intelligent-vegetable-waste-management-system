package com.farmer.farmermanagementbackend.DTO;

public class UpdateStockDTO {
    private Double quantityKg;
    private Double pricePerKg;
    private String qualityGrade;
    private String availabilityStatus;

    // Constructors
    public UpdateStockDTO() {}

    public UpdateStockDTO(Double quantityKg, Double pricePerKg, String qualityGrade, String availabilityStatus) {
        this.quantityKg = quantityKg;
        this.pricePerKg = pricePerKg;
        this.qualityGrade = qualityGrade;
        this.availabilityStatus = availabilityStatus;
    }

    // Getters and Setters
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

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }
}