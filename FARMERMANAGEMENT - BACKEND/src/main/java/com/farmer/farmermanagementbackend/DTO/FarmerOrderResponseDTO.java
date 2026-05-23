package com.farmer.farmermanagementbackend.DTO;

import java.time.LocalDateTime;

public class FarmerOrderResponseDTO {

    private Integer       orderId;
    private String        farmerId;
    private Integer       stockId;
    private String        vegetableName;
    private String        customerName;
    private String        customerId;
    private Double        quantityKg;
    private Double        pricePerKg;
    private Double        totalAmount;
    private String        paymentMethod;
    private String        orderStatus;
    private String        deliveryAddress;
    private String        notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Human-readable summary sentence
    // e.g. "Customer Gunathilaka bought 5 kg of Beans, paid using Card."
    private String orderSummary;

    // Badge colour hint for the UI
    private String statusColor;   // green | amber | red | blue | grey

    // ── Getters & Setters ──────────────────────────────────────
    public Integer       getOrderId()                        { return orderId; }
    public void          setOrderId(Integer o)               { this.orderId = o; }

    public String        getFarmerId()                       { return farmerId; }
    public void          setFarmerId(String f)               { this.farmerId = f; }

    public Integer       getStockId()                        { return stockId; }
    public void          setStockId(Integer s)               { this.stockId = s; }

    public String        getVegetableName()                  { return vegetableName; }
    public void          setVegetableName(String v)          { this.vegetableName = v; }

    public String        getCustomerName()                   { return customerName; }
    public void          setCustomerName(String n)           { this.customerName = n; }

    public String        getCustomerId()                     { return customerId; }
    public void          setCustomerId(String id)            { this.customerId = id; }

    public Double        getQuantityKg()                     { return quantityKg; }
    public void          setQuantityKg(Double q)             { this.quantityKg = q; }

    public Double        getPricePerKg()                     { return pricePerKg; }
    public void          setPricePerKg(Double p)             { this.pricePerKg = p; }

    public Double        getTotalAmount()                    { return totalAmount; }
    public void          setTotalAmount(Double t)            { this.totalAmount = t; }

    public String        getPaymentMethod()                  { return paymentMethod; }
    public void          setPaymentMethod(String pm)         { this.paymentMethod = pm; }

    public String        getOrderStatus()                    { return orderStatus; }
    public void          setOrderStatus(String s)            { this.orderStatus = s; }

    public String        getDeliveryAddress()                { return deliveryAddress; }
    public void          setDeliveryAddress(String a)        { this.deliveryAddress = a; }

    public String        getNotes()                          { return notes; }
    public void          setNotes(String n)                  { this.notes = n; }

    public LocalDateTime getCreatedAt()                      { return createdAt; }
    public void          setCreatedAt(LocalDateTime t)       { this.createdAt = t; }

    public LocalDateTime getUpdatedAt()                      { return updatedAt; }
    public void          setUpdatedAt(LocalDateTime t)       { this.updatedAt = t; }

    public String        getOrderSummary()                   { return orderSummary; }
    public void          setOrderSummary(String s)           { this.orderSummary = s; }

    public String        getStatusColor()                    { return statusColor; }
    public void          setStatusColor(String c)            { this.statusColor = c; }
}