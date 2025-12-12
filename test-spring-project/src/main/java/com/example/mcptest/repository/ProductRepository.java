package com.example.mcptest.repository;

import com.example.mcptest.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    List<Product> findByCategory(Product.ProductCategory category);

    List<Product> findByAvailable(Boolean available);

    @Query("SELECT p FROM Product p WHERE p.available = true AND p.stockQuantity > 0")
    List<Product> findAvailableInStock();

    @Query("SELECT p FROM Product p WHERE p.price BETWEEN :minPrice AND :maxPrice")
    List<Product> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                    @Param("maxPrice") BigDecimal maxPrice);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Product> searchByName(@Param("searchTerm") String searchTerm);

    List<Product> findByStockQuantityLessThan(Integer quantity);
}
