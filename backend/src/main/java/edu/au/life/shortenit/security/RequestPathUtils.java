package edu.au.life.shortenit.security;

import jakarta.servlet.http.HttpServletRequest;

final class RequestPathUtils {

    private RequestPathUtils() {
    }

    static String getApplicationPath(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String contextPath = request.getContextPath();

        if (!contextPath.isEmpty() && requestUri.startsWith(contextPath)) {
            return requestUri.substring(contextPath.length());
        }

        return requestUri;
    }
}
