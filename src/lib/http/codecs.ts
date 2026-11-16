import type { BodyEncoder, ResponseDecoder } from "./type";

// JavaScript값을 Json 문자열로 직력화
export const encodeJson: BodyEncoder = (body, headers) => {
  const json = JSON.stringify(body);

  if (json === undefined) {
    throw new Error("Invalid JSON request body");
  }

  headers.set("Content-Type", "application/json");
  return json;
};

// FormDatafmf Multipart 요청 본문으로 사용
export const encodeMultipart: BodyEncoder = (body, headers) => {
  if (!(body instanceof FormData)) {
    throw new TypeError("FormData is required");
  }

  // Boundary는 Fetch API가 자동 실행
  headers.delete("Content-Type");
  return body;
};

// 문자열을 텍스트 요청 본문으로 사용
export const encodeText: BodyEncoder = (body, headers) => {
  if (typeof body !== "string") {
    throw new TypeError("String body is required");
  }

  headers.set("Content-Type", "text/plain;charset=UTF-8");

  return body;
};

// JSON 응답을 JavaScript로 변환
export const decodeJson: ResponseDecoder = async (response) => {
  if (response.status == 204 || response.status == 205) {
    throw new Error("JSON response body is Empty");
  }

  return response.json();
};

// 텍스트 응답을 문자열로 변환
export const decodeText: ResponseDecoder = (response) => {
  return response.text();
};

// 파일 및 바이너리 응답을 Blob로 변환
export const decodeBlob: ResponseDecoder = (response) => {
  return response.blob();
};

// 응답 본문이 필요하지 않은 경우
export const decodeVoid: ResponseDecoder = async () => {
  return undefined;
};
