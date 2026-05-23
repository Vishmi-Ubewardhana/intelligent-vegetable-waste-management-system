package com.farmer.farmermanagementbackend.DTO;

public class FarmerOrderDTO {

    private String farmerId;
    private Integer stockId;
    private String vegetableName;
    private String customerName;
    private String customerId;
    private Double quantityKg;
    private Double pricePerKg;
    private String paymentMethod;   // CASH | CARD | BANK_TRANSFER
    private String deliveryAddress;
    private String notes;

    // ── Getters & Setters ──────────────────────────────────────
    public String  getFarmerId()                        { return farmerId; }
    public void    setFarmerId(String farmerId)         { this.farmerId = farmerId; }

    public Integer getStockId()                         { return stockId; }
    public void    setStockId(Integer stockId)          { this.stockId = stockId; }

    public String  getVegetableName()                   { return vegetableName; }
    public void    setVegetableName(String v)           { this.vegetableName = v; }

    public String  getCustomerName()                    { return customerName; }
    public void    setCustomerName(String n)            { this.customerName = n; }

    public String  getCustomerId()                      { return customerId; }
    public void    setCustomerId(String id)             { this.customerId = id; }

    public Double  getQuantityKg()                      { return quantityKg; }
    public void    setQuantityKg(Double q)              { this.quantityKg = q; }

    public Double  getPricePerKg()                      { return pricePerKg; }
    public void    setPricePerKg(Double p)              { this.pricePerKg = p; }

    public String  getPaymentMethod()                   { return paymentMethod; }
    public void    setPaymentMethod(String pm)          { this.paymentMethod = pm; }

    public String  getDeliveryAddress()                 { return deliveryAddress; }
    public void    setDeliveryAddress(String a)         { this.deliveryAddress = a; }

    public String  getNotes()                           { return notes; }
    public void    setNotes(String n)                   { this.notes = n; }
}