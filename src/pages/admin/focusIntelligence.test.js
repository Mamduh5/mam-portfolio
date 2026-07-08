import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildDisplayOutcomes,
  filterVisibleActions,
  getDisplayReadyState,
  getProjectLastWorkTime,
  getProjectLatestStatus,
  getWorkEventStatus
} from "./focusIntelligence.js"

test("project cards prefer latest derived status and lastWorkAt fields", () => {
  const project = {
    status: "unknown",
    resultStatus: "passed",
    latestStatus: "verified",
    lastWorkTime: "unknown",
    lastWorkAt: "2026-07-08T12:00:00.000Z"
  }

  assert.equal(getProjectLatestStatus(project), "verified")
  assert.equal(getProjectLastWorkTime(project), "2026-07-08T12:00:00.000Z")
})

test("work events use resultStatus when raw status is unknown", () => {
  const workEvent = {
    status: "unknown",
    resultStatus: "passed"
  }

  assert.equal(getWorkEventStatus(workEvent), "passed")
})

test("outcomes replace unknown latest result status with derived work status", () => {
  const outcomes = buildDisplayOutcomes(
    { outcomes: { LatestResultStatus: "unknown", Resolved: 1 } },
    [{ resultStatus: "passed" }],
    []
  )

  assert.deepEqual(outcomes, {
    LatestResultStatus: "passed",
    Resolved: 1
  })
})

test("completed renewal-header work suppresses stale backend action", () => {
  const { visibleActions, suppressedActions } = filterVisibleActions(
    [
      { title: "Check whether the frontend consumes access-token renewal headers" },
      { title: "Review open project risks" }
    ],
    [
      {
        resultStatus: "passed",
        rawReport: "Verified the frontend consumes access-token renewal headers. npm test, npm run lint, npm run build, and git diff --check passed."
      }
    ]
  )

  assert.equal(visibleActions.length, 1)
  assert.equal(visibleActions[0].title, "Review open project risks")
  assert.equal(suppressedActions.length, 1)
})

test("not_ready is displayed only when unresolved work remains", () => {
  assert.equal(
    getDisplayReadyState({
      briefing: { readyState: "not_ready" },
      trackingSummary: { failedCount: 0, openRiskCount: 0, blockedGoalCount: 0 },
      visibleActions: [],
      recentWorkEvents: [{ resultStatus: "passed" }]
    }),
    "ready"
  )

  assert.equal(
    getDisplayReadyState({
      briefing: { readyState: "not_ready" },
      trackingSummary: { failedCount: 1, openRiskCount: 0, blockedGoalCount: 0 },
      visibleActions: [],
      recentWorkEvents: [{ resultStatus: "failed" }]
    }),
    "not_ready"
  )
})
