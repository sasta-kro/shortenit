package edu.au.life.shortenit.security;

import edu.au.life.shortenit.entity.ApiKey;
import edu.au.life.shortenit.entity.User;
import edu.au.life.shortenit.repository.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * ApiKeyAuthenticationFilter - FINAL WORKING VERSION
 * Uses Spring's PasswordEncoder instead of BCrypt directly
 */
@Slf4j
@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApplicationContext applicationContext;
    private ApiKeyRepository apiKeyRepository;
    private PasswordEncoder passwordEncoder;

    public ApiKeyAuthenticationFilter(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    private ApiKeyRepository getApiKeyRepository() {
        if (apiKeyRepository == null) {
            apiKeyRepository = applicationContext.getBean(ApiKeyRepository.class);
        }
        return apiKeyRepository;
    }

    private PasswordEncoder getPasswordEncoder() {
        if (passwordEncoder == null) {
            passwordEncoder = applicationContext.getBean(PasswordEncoder.class);
        }
        return passwordEncoder;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = RequestPathUtils.getApplicationPath(request);

        log.debug("Processing: {} {}", request.getMethod(), path);

        // Skip API key validation for public endpoints
        if (path.startsWith("/s/") ||
                path.startsWith("/api/auth/oauth2/") ||
                path.startsWith("/api/auth/refresh") ||
                path.startsWith("/oauth2/") ||
                path.startsWith("/login/") ||
                path.startsWith("/actuator/") ||
                path.startsWith("/test/") ||
                path.equals("/error")) {
            log.debug("Public endpoint - skipping API key validation");
            filterChain.doFilter(request, response);
            return;
        }

        final String apiKeyHeader = request.getHeader("X-API-Key");

        log.debug("X-API-Key header: {}", apiKeyHeader != null ? "PRESENT" : "MISSING");

        if (apiKeyHeader == null || apiKeyHeader.isEmpty()) {
            log.debug("No API key - continuing to next filter");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            log.debug("Checking API key against database...");

            // Get all API keys and check with PasswordEncoder
            List<ApiKey> allKeys = getApiKeyRepository().findAllWithUser();
            log.debug("Found {} API keys in database", allKeys.size());

            ApiKey matchedKey = null;

            for (ApiKey key : allKeys) {
                boolean matches = getPasswordEncoder().matches(apiKeyHeader, key.getKeyHash());
                if (matches) {
                    matchedKey = key;
                    break;
                }
            }

            if (matchedKey != null) {
                log.debug("API key validated for user ID: {}", matchedKey.getUser().getId());

                // Check expiration
                if (matchedKey.getExpiresAt() != null &&
                        matchedKey.getExpiresAt().isBefore(LocalDateTime.now())) {
                    log.debug("API key expired");
                    filterChain.doFilter(request, response);
                    return;
                }

                User user = matchedKey.getUser();

                // Create authentication token
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                        );

                authToken.setDetails(new JwtAuthenticationFilter.UserPrincipal(
                        user.getId(), user.getEmail(), user.getRole().name()));

                SecurityContextHolder.getContext().setAuthentication(authToken);

                log.debug("Authentication set in SecurityContext");

                // Update last used
                matchedKey.setLastUsedAt(LocalDateTime.now());
                getApiKeyRepository().save(matchedKey);
            } else {
                log.debug("API key not found in database");
            }
        } catch (Exception e) {
            log.error("API key validation error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
