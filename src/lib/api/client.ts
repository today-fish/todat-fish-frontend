import { createHttpMethods } from "../http/method";
import { createHttpClient } from "../http/client";
import { withRetry } from "../http/middleware/retry";
import { withCsrf } from "../http/middleware/csrf";
import { createCsrfTokenProvider } from "./csrf";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!baseUrl) {
  throw new Error("API base URL is not configured");
}

const httpClient = createHttpClient({
  baseUrl,
  defaults: {
    credentials: "include",
    cache: "no-store",
  },
  defaultHeaders: {
    Accept: "application/json",
  },

  middlewares: [
    // 1. 일시적 서버 장애 재시도
    withRetry({
      maxRetries: 2,
      shouldRetry: (request, response) => {
        return (
          request.method === "GET" && [502, 503, 504].includes(response.status)
        );
      },
      delayMs: (retryCount) => {
        return 200 * 2 ** (retryCount - 1);
      },
    }),
    // 2. 상태 변경 요청 CSRF 토큰 주입
    withCsrf({
      headerName: "X-CSRF-TOKEN",
      getToken: createCsrfTokenProvider(baseUrl),
    }),
  ],
});

export const api = createHttpMethods(httpClient);
