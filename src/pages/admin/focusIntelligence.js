const UNKNOWN_VALUES = new Set([
  "",
  "unknown",
  "n/a",
  "na",
  "none",
  "null",
  "undefined"
])

const COMPLETED_STATUS_PARTS = [
  "pass",
  "success",
  "complete",
  "completed",
  "done",
  "verified",
  "ready"
]

const FAILED_STATUS_PARTS = [
  "fail",
  "failed",
  "error",
  "blocked",
  "not_ready",
  "not ready"
]

const RENEWAL_HEADERS_ACTION_PATTERN = /frontend.{0,80}consumes?.{0,80}(?:access-token|access token).{0,80}renewal headers/i

export const isUnknownValue = (value) => {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === "string") {
    return UNKNOWN_VALUES.has(value.trim().toLowerCase())
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}

export const getDisplayField = (item, names, fallback = "") => {
  if (!item || typeof item !== "object") {
    return fallback
  }

  for (const name of names) {
    const value = item[name]

    if (!isUnknownValue(value)) {
      return value
    }
  }

  return fallback
}

export const getProjectLatestStatus = (project) => getDisplayField(project, [
  "latestStatus",
  "latest_status",
  "latestResultStatus",
  "latest_result_status",
  "resultStatus",
  "result_status",
  "status"
], "Unknown")

export const getProjectLastWorkTime = (project) => {
  const topLevel = getDisplayField(project, [
    "lastWorkAt",
    "last_work_at",
    "lastWorkTime",
    "last_work_time",
    "lastWorkedAt",
    "last_worked_at",
    "latestWorkAt",
    "latest_work_at",
    "updatedAt",
    "updated_at"
  ])

  if (topLevel) {
    return topLevel
  }

  const lastWork = project?.lastWork || project?.last_work || project?.latestWork || project?.latest_work

  return getDisplayField(lastWork, [
    "lastWorkAt",
    "last_work_at",
    "createdAt",
    "created_at",
    "occurredAt",
    "occurred_at",
    "timestamp"
  ])
}

export const getProjectLastWorkSummary = (project) => {
  const lastWork = project?.lastWork || project?.last_work || project?.latestWork || project?.latest_work

  if (typeof lastWork === "string" && !isUnknownValue(lastWork)) {
    return lastWork
  }

  return getDisplayField(lastWork, [
    "summary",
    "title",
    "task",
    "goal",
    "rawReport",
    "raw_report"
  ])
}

export const getWorkEventStatus = (workEvent) => getDisplayField(workEvent, [
  "resultStatus",
  "result_status",
  "latestResultStatus",
  "latest_result_status",
  "latestStatus",
  "latest_status",
  "status"
], "Unknown")

export const getChangedFileCount = (item) => getDisplayField(item, [
  "changedFileCount",
  "changed_file_count",
  "filesChanged",
  "files_changed"
])

export const getCommandSummary = (item) => (
  getDisplayField(item, ["commandSummary", "command_summary"]) ||
  getDisplayField(item?.validation, ["commandSummary", "command_summary", "commands", "tests"])
)

const valueToText = (value) => {
  if (value === undefined || value === null || value === "") {
    return ""
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean).join(", ")
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, itemValue]) => `${key}: ${valueToText(itemValue)}`)
      .filter(Boolean)
      .join(", ")
  }

  return String(value)
}

export const formatSummaryItems = (value) => {
  if (isUnknownValue(value)) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean)
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, itemValue]) => `${key}: ${valueToText(itemValue)}`)
      .filter(item => item.trim() !== "")
  }

  return [String(value)]
}

export const isFailedStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase()

  return FAILED_STATUS_PARTS.some(part => normalized.includes(part))
}

export const isCompletedStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase()

  if (!normalized || isFailedStatus(normalized)) {
    return false
  }

  return COMPLETED_STATUS_PARTS.some(part => normalized.includes(part))
}

const compactText = (value) => {
  if (isUnknownValue(value)) {
    return ""
  }

  if (Array.isArray(value)) {
    return value.map(compactText).filter(Boolean).join(" ")
  }

  if (typeof value === "object") {
    return Object.values(value).map(compactText).filter(Boolean).join(" ")
  }

  return String(value)
}

const actionText = (item) => compactText([
  item?.title,
  item?.summary,
  item?.task,
  item?.description,
  item?.reason,
  item?.sourceReason,
  item?.source_reason,
  item?.nextAction,
  item?.next_action
])

export const isRenewalHeadersActionText = (value) => (
  RENEWAL_HEADERS_ACTION_PATTERN.test(compactText(value))
)

export const isRenewalHeadersAction = (item) => (
  isRenewalHeadersActionText(actionText(item))
)

export const workEventCompletesRenewalHeadersAction = (workEvent) => {
  const eventText = compactText([
    workEvent?.goal,
    workEvent?.resultStatus,
    workEvent?.result_status,
    workEvent?.latestStatus,
    workEvent?.latest_status,
    workEvent?.summary,
    workEvent?.title,
    workEvent?.rawReport,
    workEvent?.raw_report,
    workEvent?.lastWork,
    workEvent?.last_work,
    workEvent?.resolved,
    workEvent?.verified,
    workEvent?.validation,
    workEvent?.commandSummary,
    workEvent?.command_summary
  ])

  return isRenewalHeadersActionText(eventText) && isCompletedStatus(getWorkEventStatus(workEvent))
}

export const filterVisibleActions = (actions, recentWorkEvents) => {
  const completedRenewalHeadersAction = recentWorkEvents.some(workEventCompletesRenewalHeadersAction)
  const visibleActions = []
  const suppressedActions = []

  for (const action of actions) {
    if (completedRenewalHeadersAction && isRenewalHeadersAction(action)) {
      suppressedActions.push(action)
    } else {
      visibleActions.push(action)
    }
  }

  return { visibleActions, suppressedActions }
}

export const getLatestDerivedResultStatus = ({ recentWorkEvents = [], trackingProjects = [] } = {}) => {
  for (const workEvent of recentWorkEvents) {
    const status = getWorkEventStatus(workEvent)

    if (!isUnknownValue(status)) {
      return status
    }
  }

  for (const project of trackingProjects) {
    const status = getProjectLatestStatus(project)

    if (!isUnknownValue(status)) {
      return status
    }
  }

  return ""
}

export const buildDisplayOutcomes = (briefing, recentWorkEvents, trackingProjects) => {
  const rawOutcomes = briefing?.outcomes || briefing?.outcomesSummary || briefing?.outcomes_summary

  if (!rawOutcomes || typeof rawOutcomes !== "object" || Array.isArray(rawOutcomes)) {
    return rawOutcomes
  }

  const latestStatus = getLatestDerivedResultStatus({ recentWorkEvents, trackingProjects })
  const latestStatusKey = Object.keys(rawOutcomes).find(key => (
    ["latestresultstatus", "latest_result_status", "resultstatus", "result_status"].includes(key.toLowerCase())
  ))

  if (!latestStatusKey || !isUnknownValue(rawOutcomes[latestStatusKey]) || isUnknownValue(latestStatus)) {
    return rawOutcomes
  }

  return {
    ...rawOutcomes,
    [latestStatusKey]: latestStatus
  }
}

const toCount = (value) => {
  const count = Number(value)

  return Number.isFinite(count) ? count : 0
}

const hasItems = (value) => Array.isArray(value) && value.length > 0

export const getDisplayReadyState = ({ briefing, trackingSummary, visibleActions, recentWorkEvents }) => {
  const rawReadyState = getDisplayField(briefing, ["readyState", "ready_state"], "")

  if (String(rawReadyState).toLowerCase() !== "not_ready") {
    return rawReadyState || "No ready state"
  }

  const latestStatus = getLatestDerivedResultStatus({ recentWorkEvents })
  const hasUnresolvedWork = visibleActions.length > 0 ||
    hasItems(briefing?.needsAttention || briefing?.needs_attention) ||
    hasItems(briefing?.risks) ||
    toCount(trackingSummary.blockedGoalCount ?? trackingSummary.blocked_goal_count) > 0 ||
    toCount(trackingSummary.openRiskCount ?? trackingSummary.open_risk_count) > 0 ||
    toCount(trackingSummary.failedCount ?? trackingSummary.failed_count) > 0 ||
    isFailedStatus(latestStatus)

  return hasUnresolvedWork ? rawReadyState : "ready"
}
