import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { api } from "./api.js"
import { clearSession, getAccessToken, saveAccessToken } from "./sessionStore.js"

const createLocalStorage = () => {
  const store = new Map()

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  }
}

const withAdapter = async (adapter, run) => {
  const previousAdapter = api.defaults.adapter
  api.defaults.adapter = adapter

  try {
    await run()
  } finally {
    api.defaults.adapter = previousAdapter
  }
}

beforeEach(() => {
  globalThis.localStorage = createLocalStorage()
  clearSession()
})

test("stores renewed access token from authenticated responses", async () => {
  saveAccessToken("old-token")

  await withAdapter(
    async (config) => ({
      config,
      data: {},
      headers: {
        "x-access-token-renewed": "true",
        "x-access-token": "new-token",
        "x-access-token-expires-at": "2026-07-08T12:00:00.000Z"
      },
      request: {},
      status: 200,
      statusText: "OK"
    }),
    async () => {
      await api.get("/protected", {
        headers: { Authorization: "Bearer old-token" }
      })
    }
  )

  assert.equal(getAccessToken(), "new-token")
})

test("leaves access token unchanged without renewal headers", async () => {
  saveAccessToken("current-token")

  await withAdapter(
    async (config) => ({
      config,
      data: {},
      headers: {},
      request: {},
      status: 200,
      statusText: "OK"
    }),
    async () => {
      await api.get("/protected", {
        headers: { Authorization: "Bearer current-token" }
      })
    }
  )

  assert.equal(getAccessToken(), "current-token")
})

test("ignores renewal headers on anonymous responses", async () => {
  saveAccessToken("current-token")

  await withAdapter(
    async (config) => ({
      config,
      data: {},
      headers: {
        "x-access-token-renewed": "true",
        "x-access-token": "anonymous-token"
      },
      request: {},
      status: 200,
      statusText: "OK"
    }),
    async () => {
      await api.get("/public")
    }
  )

  assert.equal(getAccessToken(), "current-token")
})

test("preserves 401 rejections for existing logout/session-expired handling", async () => {
  saveAccessToken("expired-token")

  await withAdapter(
    async (config) => {
      const error = new Error("Request failed with status code 401")
      error.config = config
      error.request = {}
      error.response = {
        config,
        data: { error: "unauthorized" },
        headers: {},
        request: {},
        status: 401,
        statusText: "Unauthorized"
      }
      throw error
    },
    async () => {
      await assert.rejects(
        api.get("/protected", {
          headers: { Authorization: "Bearer expired-token" }
        }),
        (error) => error.response?.status === 401
      )
    }
  )

  assert.equal(getAccessToken(), "expired-token")
})
