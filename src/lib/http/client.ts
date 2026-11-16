import type {
  HttpClient,
  HttpClientConfig,
  HttpHandler,
  HttpMethod,
  ApiPath,
  ApiRequestOptions,
} from "./type";

import { handleApiResponse } from "./response";

/**
 * Headers 객체에 새로운 헤더를 병합합니다.
 * 동일한 이름의 헤더가 존재하면 새로운 값으로 덮어씁니다.
 */
function mergeHeaders(target: Headers, source?: HeadersInit): void {
  if (!source) return;

  const headers = new Headers(source);

  headers.forEach((value, key) => {
    target.set(key, value);
  });
}

/**
 * 설정 객체를 받아 HTTP 클라이언트를 생성합니다.
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  // 1. Base URL 검증
  if (!config.baseUrl) {
    throw new Error("HTTP baseUrl is required");
  }

  const baseUrl = new URL(config.baseUrl);

  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("HTTP baseUrl must contain only an origin");
  }

  // 2. HTTP Transport
  const transport: HttpHandler =
    config.transport ?? ((request) => fetch(request));

  // 3. Middleware 파이프라인
  const pipeline = (config.middlewares ?? []).reduceRight<HttpHandler>(
    (next, middleware) => middleware(next),
    transport,
  );

  // 4. HTTP 클라이언트 반환
  return {
    async request<T>(
      method: HttpMethod,
      path: ApiPath,
      options: ApiRequestOptions<T>,
    ) {
      const {
        headers: requestHeaders,
        body,
        encode,
        decode,
        validate,
        ...requestOptions
      } = options;

      // 5. 기본 헤더
      const headers = new Headers(config.defaultHeaders);

      // 6. 동적 헤더
      for (const provider of config.headerProviders ?? []) {
        const providedHeaders = await provider({
          method,
          path,
        });

        mergeHeaders(headers, providedHeaders);
      }

      // 7. 개별 요청 헤더
      mergeHeaders(headers, requestHeaders);

      // 8. 요청 본문 인코딩
      let encodedBody: BodyInit | undefined;

      if (body !== undefined) {
        if (method === "GET" || method === "HEAD") {
          throw new Error(`${method} requests cannot have a body`);
        }

        if (!encode) {
          throw new Error("Body encoder is required");
        }

        encodedBody = encode(body, headers);
      }

      // 9. 요청 URL 생성 및 검증
      const url = new URL(path, baseUrl);

      if (url.origin !== baseUrl.origin) {
        throw new Error("Request URL must match the base URL origin");
      }

      // 10. Request 객체 생성
      const request = new Request(url, {
        ...config.defaults,
        ...requestOptions,
        method,
        headers,
        ...(encodedBody !== undefined ? { body: encodedBody } : {}),
      });

      // 11. Middleware 및 Fetch 실행
      const response = await pipeline(request);

      // 12. 공통 응답 처리
      return handleApiResponse<T>(response, decode, validate);
    },
  };
}
