import { ApiError, ApiDecodeError, ApiValidationError } from "./errors";
import type { ResponseDecoder, ResponseValidator } from "./type";

// HTTP 오류 응답 본문을 읽습니다.
async function readErrorPayload(response: Response): Promise<unknown> {
  const raw = await response.text();

  if (!raw) {
    return undefined;
  }

  const contentType =
    response.headers.get("Content-Type")?.toLocaleLowerCase() ?? "";

  if (!contentType.includes("json")) {
    return raw;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

// HTTP 공통 응답 처리
// 1. HTTP 상태 검사
// 2. 응답 본문 디코딩
// 3. 런타임 데이터 검증
// 4. 결과 반환
export async function handleApiResponse<T>(
  response: Response,
  decode: ResponseDecoder,
  validate: ResponseValidator<T>,
): Promise<T> {
  // 1. HTTP 상태 검사
  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new ApiError(response.status, payload);
  }

  // 2. 응답 본문 디코딩
  let data: unknown;
  try {
    data = await decode(response);
  } catch (error) {
    throw new ApiDecodeError(response.status, error);
  }

  // 3. 검증기가 없으면 디코딩 결과 반환
  if (!validate) {
    return data as T;
  }

  // 4. 런타임 데이터 검증
  try {
    return validate(data);
  } catch (error) {
    throw new ApiValidationError(response.status, error);
  }
}
