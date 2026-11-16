// HTTP 요청 경로
// "/"로 시작하는 문자열만 허용

import { Middleware } from "next/dist/lib/load-custom-routes";

export type ApiPath = `/${string}`;

// 지원하는 HTTP 메소드
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

// HTTP 요청에 대한 기본 정보
export interface RequestConext {
  method: HttpMethod;
  path: ApiPath;
}

// 요청마다 동적으로 헤더를 생성하는 함수
export type HeaderProvider = (
  context: RequestConext,
) => HeadersInit | Promise<HeadersInit>;

// 요청본문을 HTTP 전송 형식으로 변환
export type BodyEncoder = (body: unknown, headers: Headers) => BodyInit;

// HTTp 응답 본문을 JavaScript로 변환
export type ResponseDecoder = (response: Response) => Promise<unknown>;

// 응답 데이터의 런타임 검증
export type ResponseValidator<T> = (value: unknown) => T;

// HTTP 요청을 실행하는 함수
export type HttpHandler = (request: Request) => Promise<Response>;

// 기존 HTTP 처리 함수를 감싸는 미들웨어
export type HttpMiddleware = (next: HttpHandler) => HttpHandler;

// Fetch API 기본 요청 옵션
export type FetchOptions = Omit<RequestInit, "method" | "headers" | "body">;

// 개별 HTTP 요청 설정
export interface ApiRequestOptions<T> extends FetchOptions {
  headers?: HeadersInit;
  body?: unknown;
  encode?: BodyEncoder;
  decode: ResponseDecoder;
  validate: ResponseValidator<T>;
}

// HTTP 클라이언트 생성 설정
export interface HttpClientConfig {
  baseUrl: string;
  defaults?: FetchOptions;
  defaultHeaders?: HeadersInit;
  headersProvider?: HeaderProvider[];
  middlewares?: HttpMiddleware[];
  transport?: HttpHandler;
}

// 생성된 Http 클라이언트 공통 계약
export interface HttpClient {
  request<T>(
    method: HttpMethod,
    path: ApiPath,
    options: ApiRequestOptions<T>,
  ): Promise<T>;
}
