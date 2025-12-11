package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserDTO;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        String fullName = buildFullName(user.getFirstName(), user.getLastName());

        return new UserDTO(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            fullName
        );
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }

        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());

        // Parse fullName back to firstName and lastName
        if (dto.getFullName() != null && dto.getFullName().contains(" ")) {
            String[] parts = dto.getFullName().split(" ", 2);
            user.setFirstName(parts[0]);
            user.setLastName(parts[1]);
        }

        return user;
    }

    private String buildFullName(String firstName, String lastName) {
        if (firstName == null && lastName == null) {
            return "";
        }
        if (firstName == null) {
            return lastName;
        }
        if (lastName == null) {
            return firstName;
        }
        return firstName + " " + lastName;
    }
}
