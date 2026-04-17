import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { uploadImage } from "../src/services/imagesApi.js";
import { installFetchMock, installLocalStorageMock } from "./helpers/testEnvironment.js";

let cleanupFetch;
let cleanupLocalStorage;

afterEach(() => {
  cleanupFetch?.();
  cleanupLocalStorage?.();
  cleanupFetch = null;
  cleanupLocalStorage = null;
});

test("uploadImage sends Authorization header when token exists", async () => {
  cleanupLocalStorage = installLocalStorageMock({
    "study-note-token": "token-123",
  });

  let capturedUrl = "";
  let capturedOptions = {};

  cleanupFetch = installFetchMock(async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;

    return {
      async json() {
        return {
          success: true,
          data: { url: "/uploads/image.png" },
          error: null,
        };
      },
    };
  });

  const result = await uploadImage(new Blob(["image"], { type: "image/png" }));

  assert.equal(capturedUrl, "http://localhost:3001/api/images");
  assert.equal(capturedOptions.method, "POST");
  assert.equal(capturedOptions.headers.Authorization, "Bearer token-123");
  assert.ok(capturedOptions.body instanceof FormData);
  assert.equal(result.data.url, "http://localhost:3001/uploads/image.png");
});

test("uploadImage omits Authorization header when token is absent", async () => {
  cleanupLocalStorage = installLocalStorageMock();

  let capturedOptions = {};

  cleanupFetch = installFetchMock(async (_url, options) => {
    capturedOptions = options;

    return {
      async json() {
        return {
          success: false,
          data: null,
          error: "인증이 필요합니다.",
        };
      },
    };
  });

  const result = await uploadImage(new Blob(["image"], { type: "image/png" }));

  assert.equal(capturedOptions.headers.Authorization, undefined);
  assert.equal(result.success, false);
  assert.equal(result.error, "인증이 필요합니다.");
});
