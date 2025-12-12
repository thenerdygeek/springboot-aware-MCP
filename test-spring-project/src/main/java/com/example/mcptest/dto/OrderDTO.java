package com.example.mcptest.dto;

import com.example.mcptest.domain.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {

    private Long id;

    private String orderNumber;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Order items are required")
    @Size(min = 1, message = "Order must contain at least one item")
    @Valid
    private List<OrderItemDTO> items;

    private BigDecimal totalAmount;

    private Order.OrderStatus status;

    private LocalDateTime orderDate;

    @Size(max = 500, message = "Shipping address must not exceed 500 characters")
    private String shippingAddress;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDTO {

        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 100, message = "Quantity cannot exceed 100")
        private Integer quantity;
    }
}
