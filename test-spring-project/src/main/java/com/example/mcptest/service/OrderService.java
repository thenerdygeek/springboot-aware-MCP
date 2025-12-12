package com.example.mcptest.service;

import com.example.mcptest.domain.Order;
import com.example.mcptest.domain.OrderItem;
import com.example.mcptest.domain.Product;
import com.example.mcptest.domain.User;
import com.example.mcptest.dto.OrderDTO;
import com.example.mcptest.exception.ResourceNotFoundException;
import com.example.mcptest.repository.OrderRepository;
import com.example.mcptest.repository.ProductRepository;
import com.example.mcptest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        return convertToDTO(order);
    }

    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        log.info("Creating new order for user id: {}", orderDTO.getUserId());

        User user = userRepository.findById(orderDTO.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + orderDTO.getUserId()));

        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(Order.OrderStatus.PENDING);
        order.setShippingAddress(orderDTO.getShippingAddress());

        for (OrderDTO.OrderItemDTO itemDTO : orderDTO.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDTO.getProductId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDTO.getQuantity());
            orderItem.setPrice(product.getPrice());
            order.addItem(orderItem);
        }

        order.calculateTotal();
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setUserId(order.getUser().getId());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setOrderDate(order.getOrderDate());
        dto.setShippingAddress(order.getShippingAddress());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        return dto;
    }
}
