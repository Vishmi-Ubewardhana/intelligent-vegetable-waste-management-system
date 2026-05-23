package com.farmer.farmermanagementbackend.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiPricePredictionResponseDTO {

    @JsonProperty("predictedPrice")
    private Double predictedPrice;

    @JsonProperty("confidence")
    private Double confidence;

    @JsonProperty("message")
    private String message;

    public Double getPredictedPrice() {
        return predictedPrice;
    }

    public void setPredictedPrice(Double predictedPrice) {
        this.predictedPrice = predictedPrice;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
