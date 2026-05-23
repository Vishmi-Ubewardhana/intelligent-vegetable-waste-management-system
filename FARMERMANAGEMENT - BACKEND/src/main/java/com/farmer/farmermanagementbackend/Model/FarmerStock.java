package com.farmer.farmermanagementbackend.Model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmer_stock")
public class FarmerStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer stockId;

    @Column(nullable = false, length = 50)
    private String farmerId;

    @Column(length = 80)
    private String orderId;

    @Column(nullable = false, length = 100)
    private String vegetableName;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false)
    private LocalDate harvestDate;

    @Column(nullable = false)
    private Double quantityKg;

    @Column(nullable = false)
    private Double pricePerKg;

    @Column(nullable = false, length = 5)
    private String qualityGrade;

    @Column
    private LocalDate expiryEstimate;

    @Column(nullable = false, length = 20)
    private String availabilityStatus;

    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public FarmerStock() {
    }

    public FarmerStock(String farmerId, String vegetableName, String category,
            LocalDate harvestDate, Double quantityKg, Double pricePerKg,
            String qualityGrade, LocalDate expiryEstimate) {
        this.farmerId = farmerId;
        this.vegetableName = vegetableName;
        this.category = category;
        this.harvestDate = harvestDate;
        this.quantityKg = quantityKg;
        this.pricePerKg = pricePerKg;
        this.qualityGrade = qualityGrade;
        this.expiryEstimate = expiryEstimate;
        this.availabilityStatus = "Available";
        this.isVisible = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
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

    public Boolean getIsVisible() {
        return isVisible;
    }

    public void setIsVisible(Boolean isVisible) {
        this.isVisible = isVisible;
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

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "FarmerStock{" +
                "stockId=" + stockId +
                ", farmerId='" + farmerId + '\'' +
                ", orderId='" + orderId + '\'' +
                ", vegetableName='" + vegetableName + '\'' +
                ", category='" + category + '\'' +
                ", harvestDate=" + harvestDate +
                ", quantityKg=" + quantityKg +
                ", pricePerKg=" + pricePerKg +
                ", qualityGrade='" + qualityGrade + '\'' +
                ", expiryEstimate=" + expiryEstimate +
                ", availabilityStatus='" + availabilityStatus + '\'' +
                ", isVisible=" + isVisible +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}