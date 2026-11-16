// HTTP 상태 코드 오류
// 2XX가 아닌 응답을 받았을 때 발생
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(`HTTP request failed: ${status}`);
    this.name = "ApiError";
  }
}

// HTTP 응답 디코딩 오류
export class ApiDecodeError extends Error {
  constructor(
    public readonly status: number,
    public readonly originalError: unknown,
  ) {
    super(`Failed to Decode response: ${status}`);
    this.name = "ApiDecodeError";
  }
}

export class ApiValidationError extends Error {
  constructor(
    public readonly status: number,
    public readonly originalError: unknown,
  ) {
    super(`Response Validation Failed: ${status}`);
    this.name = "ApiValidationError";
  }
}
