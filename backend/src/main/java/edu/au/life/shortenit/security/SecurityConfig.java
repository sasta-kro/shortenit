package edu.au.life.shortenit.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig - IMPROVED VERSION
 * Combines YOUR secure JWT approach with conditional OAuth
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;

    @Autowired(required = false) // Optional - only if OAuth configured
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @Value("${spring.security.oauth2.client.registration.microsoft.client-id:}")
    private String microsoftClientId;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ApiKeyAuthenticationFilter apiKeyAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.apiKeyAuthenticationFilter = apiKeyAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                // CORS configuration
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                    corsConfig.setAllowedOriginPatterns(java.util.List.of(allowedOrigins.split(",")));
                    corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                    corsConfig.setAllowedHeaders(java.util.List.of("*"));
                    corsConfig.setExposedHeaders(java.util.List.of("*"));
                    corsConfig.setAllowCredentials(true);
                    corsConfig.setMaxAge(3600L);
                    return corsConfig;
                }))

                // Session management (stateless for JWT)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Add authentication filters
                .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - NO AUTH
                        .requestMatchers("/s/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/test/**").permitAll()
                        .requestMatchers("/oauth2/success").permitAll()
                        .requestMatchers("/oauth2/error").permitAll()

                        // OAuth endpoints - FOR WEB LOGIN ONLY
                        .requestMatchers("/oauth2/**").permitAll()
                        .requestMatchers("/login/**").permitAll()
                        .requestMatchers("/api/auth/oauth2/**").permitAll()
                        .requestMatchers("/api/auth/refresh").permitAll()

                        // API endpoints - REQUIRE AUTH (API Key or JWT)
                        .requestMatchers("/api/**").authenticated()

                        // Everything else
                        .anyRequest().authenticated()
                )

                // Exception handling - IMPROVED!
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            // For API requests, return JSON 401 instead of redirecting
                            if (RequestPathUtils.getApplicationPath(request).startsWith("/api/")) {
                                response.setStatus(401);
                                response.setContentType("application/json");
                                response.getWriter().write(
                                        "{\"error\":\"Unauthorized\"," +
                                                "\"message\":\"Authentication required. Use X-API-Key header or Authorization: Bearer token\"," +
                                                "\"timestamp\":\"" + java.time.Instant.now() + "\"}"
                                );
                            } else {
                                // For web requests, redirect to OAuth login if available
                                if (microsoftClientId != null && !microsoftClientId.isEmpty()) {
                                    response.sendRedirect(
                                            request.getContextPath() + "/oauth2/authorization/microsoft"
                                    );
                                } else {
                                    response.setStatus(401);
                                    response.getWriter().write("Authentication required");
                                }
                            }
                        })
                );

        // CONDITIONAL OAuth2 - Only if credentials provided!
        if (microsoftClientId != null && !microsoftClientId.isEmpty() && oAuth2SuccessHandler != null) {
            System.out.println("✅ OAuth2 enabled with Microsoft Azure");
            http.oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2SuccessHandler)
                    //.defaultSuccessUrl("/oauth2/success", true)
            );
        } else {
            System.out.println("⚠️  OAuth2 disabled - no Microsoft credentials provided");
            System.out.println("    Using API Key + JWT authentication only");
        }

        return http.build();
    }
}
