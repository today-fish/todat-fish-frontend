import type { HttpMiddleware } from "../type";

// HTTP 재시도 정책
export interface RetryPolicy {
  maxRetries: number;
  shouldRetry: (request: Request, response: Response) => boolean;
  delayMs: (retryCount: number, response: Response) => number;
}

// AbortSignal을 지원하는 비동기 대기 함수
function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason);
    }

    signal.addEventListener("abort", onAbort, {
      once: true,
    });
  });
}

// 지정된 정책에 따라 HTTP 요청을 재시도합니다.
export function withRetry(policy: RetryPolicy): HttpMiddleware {
  if (!Number.isInteger(policy.maxRetries) || policy.maxRetries < 0) {
    throw new Error("Invalid maxRetries");
  }

  return (next) => async (request) => {
    let retryCount = 0;
    while (true) {
      // 1. 요청 취소 여부 확인
      request.signal.throwIfAborted();

      // 2. 요청 실행
      const response = await next(request.clone());

      // 3. 재시도 필요 여부 판단
      if (
        retryCount >= policy.maxRetries ||
        !policy.shouldRetry(request, response)
      ) {
        return response;
      }

      // 4. 재시도 횟수 증가
      retryCount++;

      // 5. 다음 재시도까지 대기시간 계산
      const delay = policy.delayMs(retryCount, response);
      if (!Number.isFinite(delay) || delay < 0) {
        throw new Error("Invalid retry delay");
      }

      // 6. 사용하지 않을 응답 본문 정리
      if (response.body && !response.bodyUsed && !response.body.locked) {
        await response.body.cancel();
      }
      // 7. 대기 후 다음 반복 실행
      await waitForRetry(delay, request.signal);
    }
  };
}
