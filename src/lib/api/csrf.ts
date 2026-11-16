/**
 * Spring Boot CSRF 토큰 조회 함수 생성
 *
 * 예상 응답:
 * {
 *   "token": "...",
 *   "headerName": "X-XSRF-TOKEN"
 * }
 */
export function createCsrfTokenProvider(baseUrl: string) {
  const csrfUrl = process.env.NEXT_PUBLIC_CSRF_URL || "/api/auth/csrf";
  const url = new URL(csrfUrl, baseUrl);

  return async (signal: AbortSignal): Promise<string> => {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      throw new Error(`CSRF token request failed: ${response.status}`);
    }

    const data: unknown = await response.json();

    // 응답 구조 검증
    if (
      typeof data !== "object" ||
      data == null ||
      !("token" in data) ||
      typeof data.token != "string" ||
      !data.token
    ) {
      throw new Error("Invalid CSRF Token response");
    }
    return data.token;
  };
}
