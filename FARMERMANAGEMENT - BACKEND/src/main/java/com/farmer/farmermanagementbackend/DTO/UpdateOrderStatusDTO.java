package com.farmer.farmermanagementbackend.DTO;

public class UpdateOrderStatusDTO {

    // PENDING | CONFIRMED | READY | DISPATCHED | DELIVERED | CANCELLED | REJECTED
    private String orderStatus;

    // Optional note when changing status (e.g. rejection reason)
    private String notes;

    public String getOrderStatus()              { return orderStatus; }
    public void   setOrderStatus(String s)      { this.orderStatus = s; }

    public String getNotes()                    { return notes; }
    public void   setNotes(String n)            { this.notes = n; }
}