package edu.au.life.shortenit.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AppUrlConfigTest {

    @Test
    void acceptsRootDeployment() {
        AppUrlConfig config = config("http://localhost:3000", "");

        assertDoesNotThrow(config::validate);
    }

    @Test
    void acceptsMatchingPathDeployment() {
        AppUrlConfig config = config("https://life.au.edu/shortenit", "/shortenit");

        assertDoesNotThrow(config::validate);
    }

    @Test
    void rejectsMismatchedUrlAndPath() {
        AppUrlConfig config = config("https://life.au.edu/other", "/shortenit");

        assertThrows(IllegalStateException.class, config::validate);
    }

    @Test
    void rejectsTrailingSlashes() {
        AppUrlConfig config = config("https://life.au.edu/shortenit/", "/shortenit/");

        assertThrows(IllegalStateException.class, config::validate);
    }

    @Test
    void rejectsNonUrlBaseUrl() {
        AppUrlConfig config = config("life.au.edu/shortenit", "/shortenit");

        assertThrows(IllegalStateException.class, config::validate);
    }

    private AppUrlConfig config(String baseUrl, String basePath) {
        AppUrlConfig config = new AppUrlConfig();
        ReflectionTestUtils.setField(config, "baseUrl", baseUrl);
        ReflectionTestUtils.setField(config, "basePath", basePath);
        return config;
    }
}
