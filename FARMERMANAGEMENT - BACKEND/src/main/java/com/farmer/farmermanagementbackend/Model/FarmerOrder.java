package com.farmer.farmermanagementbackend.Model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "farmer_order")
public class FarmerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer orderId;

    // Which farmer this order belongs to
    @Column(nullable = false, length = 50)
    private String farmerId;

    // Which stock item was ordered
    @Column(nullable = false)
    private Integer stockId;

    // Vegetable name (denormalised for easy display)
    @Column(nullable = false, length = 100)
    private String vegetableName;

    // Customer details
    @Column(nullable = false, length = 100)
    private String customerName;

    @Column(length = 50)
    private String customerId;

    // Order details
    @Column(nullable = false)
    private Double quantityKg;

    @Column(nullable = false)
    private Double pricePerKg;

    @Column(nullable = false)
    private Double totalAmount;

    // Payment method: CASH | CARD | BANK_TRANSFER
    @Column(nullable = false, length = 30)
    private String paymentMethod;

    // Order status: PENDING | CONFIRMED | READY | DISPATCHED | DELIVERED | CANCELLED | REJECTED
    @Column(nullable = false, length = 20)
    private String orderStatus;

    // Optional notes / delivery address
    @Column(length = 255)
    private String deliveryAddress;

    @Column(length = 255)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ── Lifecycle ──────────────────────────────────────────────
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (orderStatus == null) orderStatus = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ── Constructors ───────────────────────────────────────────
    public FarmerOrder() {}

    public FarmerOrder(String farmerId, Integer stockId, String vegetableName,
                       String customerName, String customerId,
                       Double quantityKg, Double pricePerKg,
                       String paymentMethod, String deliveryAddress, String notes) {
        this.farmerId        = farmerId;
        this.stockId         = stockId;
        this.vegetableName   = vegetableName;
        this.customerName    = customerName;
        this.customerId      = customerId;
        this.quantityKg      = quantityKg;
        this.pricePerKg      = pricePerKg;
        this.totalAmount     = quantityKg * pricePerKg;
        this.paymentMethod   = paymentMethod;
        this.deliveryAddress = deliveryAddress;
        this.notes           = notes;
        this.orderStatus     = "PENDING";
    }

    // ── Getters & Setters ──────────────────────────────────────
    public Integer getOrderId()                        { return orderId; }
    public void    setOrderId(Integer orderId)         { this.orderId = orderId; }

    public String  getFarmerId()                       { return farmerId; }
    public void    setFarmerId(String farmerId)        { this.farmerId = farmerId; }

    public Integer getStockId()                        { return stockId; }
    public void    setStockId(Integer stockId)         { this.stockId = stockId; }

    public String  getVegetableName()                  { return vegetableName; }
    public void    setVegetableName(String v)          { this.vegetableName = v; }

    public String  getCustomerName()                   { return customerName; }
    public void    setCustomerName(String n)           { this.customerName = n; }

    public String  getCustomerId()                     { return customerId; }
    public void    setCustomerId(String id)            { this.customerId = id; }

    public Double  getQuantityKg()                     { return quantityKg; }
    public void    setQuantityKg(Double q)             { this.quantityKg = q; }

    public Double  getPricePerKg()                     { return pricePerKg; }
    public void    setPricePerKg(Double p)             { this.pricePerKg = p; }

    public Double  getTotalAmount()                    { return totalAmount; }
    public void    setTotalAmount(Double t)            { this.totalAmount = t; }

    public String  getPaymentMethod()                  { return paymentMethod; }
    public void    setPaymentMethod(String pm)         { this.paymentMethod = pm; }

    public String  getOrderStatus()                    { return orderStatus; }
    public void    setOrderStatus(String s)            { this.orderStatus = s; }

    public String  getDeliveryAddress()                { return deliveryAddress; }
    public void    setDeliveryAddress(String a)        { this.deliveryAddress = a; }

    public String  getNotes()                          { return notes; }
    public void    setNotes(String n)                  { this.notes = n; }

    public LocalDateTime getCreatedAt()                { return createdAt; }
    public void          setCreatedAt(LocalDateTime t) { this.createdAt = t; }

    public LocalDateTime getUpdatedAt()                { return updatedAt; }
    public void          setUpdatedAt(LocalDateTime t) { this.updatedAt = t; }
}