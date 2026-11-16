import { createHttpMethods } from "../http/method";
import { createHttpClient } from "../http/client";

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
});

export const api = createHttpMethods(httpClient);
