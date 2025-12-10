package com.example.demo.service;

import com.example.demo.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service class for user management operations
 */
@Service
public class UserService {

    private List<User> users = new ArrayList<>();

    /**
     * Find user by ID
     * @param id the user ID
     * @return Optional containing the user if found
     */
    public Optional<User> findById(Long id) {
        return users.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst();
    }

    /**
     * Find user by username
     * @param username the username to search for
     * @return Optional containing the user if found
     */
    public Optional<User> findByUsername(String username) {
        return users.stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst();
    }

    /**
     * Save a new user or update existing one
     * @param user the user to save
     * @return the saved user
     */
    @Transactional
    public User save(User user) {
        if (user.getId() == null) {
            user.setId(generateId());
        }
        users.add(user);
        return user;
    }

    /**
     * Delete user by ID
     * @param id the user ID to delete
     */
    @Transactional
    public void deleteById(Long id) {
        users.removeIf(user -> user.getId().equals(id));
    }

    /**
     * Get all users
     * @return list of all users
     */
    public List<User> findAll() {
        return new ArrayList<>(users);
    }

    /**
     * Check if user exists by username
     * @param username the username to check
     * @return true if user exists
     */
    public boolean existsByUsername(String username) {
        return users.stream()
                .anyMatch(user -> user.getUsername().equals(username));
    }

    private Long generateId() {
        return System.currentTimeMillis();
    }
}
