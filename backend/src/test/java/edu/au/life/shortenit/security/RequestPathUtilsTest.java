package edu.au.life.shortenit.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RequestPathUtilsTest {

    @Test
    void returnsRootApplicationPath() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/urls");

        assertEquals("/api/urls", RequestPathUtils.getApplicationPath(request));
    }

    @Test
    void removesServletContextPath() {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/shortenit/api/urls"
        );
        request.setContextPath("/shortenit");

        assertEquals("/api/urls", RequestPathUtils.getApplicationPath(request));
    }
}
