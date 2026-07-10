import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getAssetUrl,
  getMediaUrl,
  getProfileAvatarUrl,
  getUploadResultUrl
} from "./projectMedia.js"

test("normalizes public asset URL fields without deriving storage paths", () => {
  assert.equal(getAssetUrl({ public_url: " https://cdn.example.com/avatar.png " }), "https://cdn.example.com/avatar.png")
  assert.equal(getAssetUrl({ key: "uploads/avatar.png", bucket: "portfolio" }), "")
})

test("normalizes nested upload result URL fields", () => {
  assert.equal(
    getUploadResultUrl({
      filename: "profile.png",
      asset: { public_url: "https://cdn.example.com/profile.png" }
    }),
    "https://cdn.example.com/profile.png"
  )
})

test("prefers the top-level upload URL when multiple URL fields exist", () => {
  assert.equal(
    getMediaUrl({
      url: "https://cdn.example.com/top.png",
      asset: { url: "https://cdn.example.com/nested.png" }
    }),
    "https://cdn.example.com/top.png"
  )
})

test("normalizes saved profile avatar aliases", () => {
  assert.equal(getProfileAvatarUrl({ avatar_url: "https://cdn.example.com/me.jpg" }), "https://cdn.example.com/me.jpg")
  assert.equal(getProfileAvatarUrl({ image: { public_url: "https://cdn.example.com/nested.jpg" } }), "https://cdn.example.com/nested.jpg")
  assert.equal(getProfileAvatarUrl({ avatar: "https://cdn.example.com/string.jpg" }), "https://cdn.example.com/string.jpg")
})
