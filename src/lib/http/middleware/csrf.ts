import type { HttpMiddleware } from "../type";

// CSRF Middleware 실행
export interface CsrfOptions {
  headerName: string;
  getToken: (signal: AbortSignal) => Promise<string>;
  methods?: readonly string[];
}

// 상태 변경 요청에 CRF 토큰을 주입합니다.
export function withCsrf(options: CsrfOptions): HttpMiddleware {
  const protectedMethods = new Set(
    options.methods ?? ["POST", "PUT", "PATCH", "DELETE"],
  );

  return (next) => async (request) => {
    // 1. 보호 대상 HTTP 메소드 확인
    if (!protectedMethods.has(request.method)) {
      return next(request);
    }

    // 2. 요청 취소 여부 확인
    request.signal.throwIfAborted();

    // 3. CSRF 토큰 조회
    const token = await options.getToken(request.signal);

    if (!token) {
      throw new Error("CSRF Token is unavailable");
    }

    // 4. 요청 헤더 복사 및 토큰 추가
    const headers = new Headers(request.headers);
    headers.set(options.headerName, token);

    // 5. 새로운 request 객체 생성
    const csrfRequest = new Request(request, { headers });

    // 6. 다음 Middleware 또는 Fetch 실행
    return next(csrfRequest);
  };
}
