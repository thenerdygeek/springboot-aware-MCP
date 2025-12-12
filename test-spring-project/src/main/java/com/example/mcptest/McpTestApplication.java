package com.example.mcptest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class McpTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(McpTestApplication.class, args);
    }
}
