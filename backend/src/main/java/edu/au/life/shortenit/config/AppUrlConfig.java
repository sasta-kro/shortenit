package edu.au.life.shortenit.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
public class AppUrlConfig {

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${server.servlet.context-path:}")
    private String basePath;

    @PostConstruct
    void validate() {
        validateBasePath();

        URI uri;
        try {
            uri = URI.create(baseUrl);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("APP_BASE_URL must be a valid absolute HTTP or HTTPS URL", exception);
        }

        if (!uri.isAbsolute()
                || uri.getHost() == null
                || !("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))) {
            throw new IllegalStateException("APP_BASE_URL must be a valid absolute HTTP or HTTPS URL");
        }

        if (baseUrl.endsWith("/") || uri.getQuery() != null || uri.getFragment() != null) {
            throw new IllegalStateException("APP_BASE_URL must not end with '/' or contain a query or fragment");
        }

        String urlPath = uri.getPath() == null ? "" : uri.getPath();
        if (!urlPath.equals(basePath)) {
            throw new IllegalStateException(
                    "APP_BASE_URL path must match APP_BASE_PATH: expected '"
                            + basePath + "' but was '" + urlPath + "'"
            );
        }
    }

    private void validateBasePath() {
        if (!basePath.isEmpty()
                && (!basePath.startsWith("/")
                || basePath.startsWith("//")
                || basePath.endsWith("/")
                || basePath.contains("://")
                || basePath.contains("?")
                || basePath.contains("#"))) {
            throw new IllegalStateException(
                    "APP_BASE_PATH must be empty or an absolute path that starts with one '/', does not end with '/', and contains no URL, query, or fragment"
            );
        }
    }
}
