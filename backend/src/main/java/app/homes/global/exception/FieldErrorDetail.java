package app.homes.global.exception;

/**
 * 입력 검증 실패 시 data에 담는 필드별 상세.
 */
public record FieldErrorDetail(String field, String reason) {
}
