import type { ApiPath, ApiRequestOptions, HttpClient } from "./type";

// Get 요청 옵션
// GET 요청이므로 바디와 인코더를 제외힙니다.
type ReadOption<T> = Omit<ApiRequestOptions<T>, "body" | "encode">;

// POST< PUT, PATCH, DELETE 요청옵션
type WriteOption<T> = ApiRequestOptions<T>;

// HTTP 메서드별 편의 함수를 생성합니다.
export function createHttpMethods(client: HttpClient) {
  return {
    // GET 서버 리소스 조회
    get<T>(path: ApiPath, options: ReadOption<T>): Promise<T> {
      return client.request<T>("GET", path, options);
    },
    post<T>(path: ApiPath, options: WriteOption<T>): Promise<T> {
      return client.request<T>("POST", path, options);
    },
    put<T>(path: ApiPath, options: WriteOption<T>): Promise<T> {
      return client.request<T>("PUT", path, options);
    },
    patch<T>(path: ApiPath, options: WriteOption<T>): Promise<T> {
      return client.request<T>("PATCH", path, options);
    },
    delete<T>(path: ApiPath, options: WriteOption<T>): Promise<T> {
      return client.request<T>("DELETE", path, options);
    },
  };
}
