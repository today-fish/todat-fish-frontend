import type { HttpClient, HttpClientConfig, HttpHandler } from "../http/type";

import { handleApiResponse } from "../http/response";

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
  // 1. Base URL 검증 및 정규화
  if (!config.baseUrl) {
    throw new Error("HTTP baseUrl is required");
  }

  const baseUrl = new URL(config.baseUrl);

  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("HTTP baseUrl musdt contain only an origin");
  }

  // 2. 실제 HTTP 요청을 실행하는 Transport
  const transport: HttpHandler =
    config.transport ?? ((request) => fetch(request));

  // 3. Middleware 파이프라인 구성
  const pipeline = (config.middlewares ?? []).reduceRight<HttpHandler>(
    (next, middleware) => middleware(next),
    transport,
  );

  // 4. HTTP 클라이언트 객체 반환
  return {
    async request<T>(method, path, options) {
      const {
        headers: requestHeaders,
        body,
        encode,
        decode,
        validate,
        ...requestOptions
      } = options;

      // 5. 기본 헤더 생성
      const headers = new Headers(config.defaultHeaders);

      // 6. 동적 헤더 추가
      for (const provider of config.headerProviders ?? []) {
        const providedHeaders = await provider({
          method,
          path,
        });

        mergeHeaders(headers, providedHeaders);
      }

      // 7. 개별 요청 헤더 추가
      mergeHeaders(headers, requestHeaders);

      // 8. 요청 본문 인코딩
      let encodedBody: BodyInit | undefined;

      if (body !== undefined) {
        if (method === "GET") {
          throw new Error(`GET requests cannot have a body`);
        }

        if (!encode) {
          throw new Error("Body encoder is required");
        }

        encodedBody = encode(body, headers);
      }

      // 9. Request 객체 생성
      const request = new Request(new URL(path, baseUrl), {
        ...config.defaults,
        ...requestOptions,
        method,
        headers,
        ...(encodedBody !== undefined ? { body: encodedBody } : {}),
      });

      // 10. Middleware 및 Fetch 실행
      const response = await pipeline(request);

      // 11. 공통 응답 처리
      return handleApiResponse<T>(response, decode, validate);
    },
  };
}
