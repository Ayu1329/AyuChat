package com.ayuchat.exception;

import com.ayuchat.domain.AuthErrorCode;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuth(AuthException ex) {
        HttpStatus status = mapStatus(ex.getCode());
        return ResponseEntity.status(status).body(errorBody(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError != null ? fieldError.getDefaultMessage() : "参数错误";
        return ResponseEntity.badRequest()
                .body(errorBody(AuthErrorCode.INVALID_PHONE, message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        if ("INVALID_SCENE".equals(ex.getMessage())) {
            return ResponseEntity.badRequest()
                    .body(errorBody(AuthErrorCode.INVALID_SCENE, "scene 非法"));
        }
        return ResponseEntity.badRequest()
                .body(errorBody(AuthErrorCode.INVALID_PHONE, ex.getMessage()));
    }

    private static HttpStatus mapStatus(AuthErrorCode code) {
        switch (code) {
            case INVALID_CREDENTIALS:
            case UNAUTHORIZED:
                return HttpStatus.UNAUTHORIZED;
            case ACCOUNT_DISABLED:
                return HttpStatus.FORBIDDEN;
            case PHONE_ALREADY_REGISTERED:
                return HttpStatus.CONFLICT;
            case PHONE_NOT_FOUND:
                return HttpStatus.NOT_FOUND;
            case SMS_RATE_LIMIT:
            case VERIFY_RATE_LIMIT:
                return HttpStatus.TOO_MANY_REQUESTS;
            default:
                return HttpStatus.BAD_REQUEST;
        }
    }

    private static Map<String, Object> errorBody(AuthErrorCode code, String message) {
        return Map.of(
                "error",
                Map.of(
                        "code", code.name(),
                        "message", message));
    }
}
