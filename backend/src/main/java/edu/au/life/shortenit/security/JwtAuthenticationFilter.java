package edu.au.life.shortenit.security;

import edu.au.life.shortenit.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final ApplicationContext applicationContext;
    private JwtService jwtService;

    public JwtAuthenticationFilter(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    private JwtService getJwtService() {
        if (jwtService == null) {
            jwtService = applicationContext.getBean(JwtService.class);
        }
        return jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = RequestPathUtils.getApplicationPath(request);

        // Skip JWT validation for public endpoints
        if (path.startsWith("/s/") ||
                path.startsWith("/api/auth/oauth2/") ||
                path.startsWith("/api/auth/refresh") ||
                path.startsWith("/oauth2/") ||
                path.startsWith("/login/oauth2/code/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get Authorization header
        final String authHeader = request.getHeader("Authorization");

        // Check if header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // Extract token
            final String jwt = authHeader.substring(7);
            final String email = getJwtService().extractEmail(jwt);
            final Long userId = getJwtService().extractUserId(jwt);
            final String role = getJwtService().extractRole(jwt);

            // If user is not already authenticated
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Validate token
                if (getJwtService().validateToken(jwt, email)) {

                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                            );

                    // Set user ID as principal detail
                    authToken.setDetails(new UserPrincipal(userId, email, role));

                    // Set authentication in context
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Log error and continue filter chain
            logger.error("JWT validation error: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * User principal class to hold user details
     */
    public static class UserPrincipal {
        private final Long userId;
        private final String email;
        private final String role;

        public UserPrincipal(Long userId, String email, String role) {
            this.userId = userId;
            this.email = email;
            this.role = role;
        }

        public Long getUserId() {
            return userId;
        }

        public String getEmail() {
            return email;
        }

        public String getRole() {
            return role;
        }
    }
}
