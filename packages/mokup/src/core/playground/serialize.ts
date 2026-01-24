import type { RouteTable } from '../../shared/types'
import type { PlaygroundGroup } from './grouping'
import { formatRouteFile, resolveRouteGroup } from './grouping'

type PlaygroundDisabledReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'
    | 'unknown'

interface PlaygroundDisabledRouteInput {
  file: string
  reason?: string
  method?: string
  url?: string
}

interface PlaygroundDisabledRoute {
  file: string
  reason: PlaygroundDisabledReason
  method?: string
  url?: string
  group?: string
  groupKey?: string
}

type PlaygroundIgnoredReason = 'unsupported' | 'invalid-route' | 'unknown'

interface PlaygroundIgnoredRouteInput {
  file: string
  reason?: string
}

interface PlaygroundIgnoredRoute {
  file: string
  reason: PlaygroundIgnoredReason
  group?: string
  groupKey?: string
}

interface PlaygroundConfigFileInput {
  file: string
}

interface PlaygroundConfigFile {
  file: string
  group?: string
  groupKey?: string
}

const disabledReasonSet = new Set<PlaygroundDisabledReason>([
  'disabled',
  'disabled-dir',
  'exclude',
  'ignore-prefix',
  'include',
  'unknown',
])

const ignoredReasonSet = new Set<PlaygroundIgnoredReason>([
  'unsupported',
  'invalid-route',
  'unknown',
])

function normalizeDisabledReason(reason?: string): PlaygroundDisabledReason {
  if (reason && disabledReasonSet.has(reason as PlaygroundDisabledReason)) {
    return reason as PlaygroundDisabledReason
  }
  return 'unknown'
}

function normalizeIgnoredReason(reason?: string): PlaygroundIgnoredReason {
  if (reason && ignoredReasonSet.has(reason as PlaygroundIgnoredReason)) {
    return reason as PlaygroundIgnoredReason
  }
  return 'unknown'
}

function toPlaygroundRoute(
  route: RouteTable[number],
  root: string | undefined,
  groups: PlaygroundGroup[],
) {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const preSources = route.middlewares
    ?.filter(entry => entry.position === 'pre')
    .map(entry => formatRouteFile(entry.source, root)) ?? []
  const postSources = route.middlewares
    ?.filter(entry => entry.position === 'post')
    .map(entry => formatRouteFile(entry.source, root)) ?? []
  const normalSources = route.middlewares
    ?.filter(entry => entry.position !== 'pre' && entry.position !== 'post')
    .map(entry => formatRouteFile(entry.source, root)) ?? []
  const combinedSources = [
    ...preSources,
    ...normalSources,
    ...postSources,
  ]
  return {
    method: route.method,
    url: route.template,
    file: formatRouteFile(route.file, root),
    type: typeof route.handler === 'function' ? 'handler' : 'static',
    status: route.status,
    delay: route.delay,
    middlewareCount: combinedSources.length,
    middlewares: combinedSources,
    preMiddlewareCount: preSources.length,
    normalMiddlewareCount: normalSources.length,
    postMiddlewareCount: postSources.length,
    preMiddlewares: preSources,
    normalMiddlewares: normalSources,
    postMiddlewares: postSources,
    groupKey: matchedGroup?.key,
    group: matchedGroup?.label,
  }
}

function toPlaygroundDisabledRoute(
  route: PlaygroundDisabledRouteInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundDisabledRoute {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const disabled: PlaygroundDisabledRoute = {
    file: formatRouteFile(route.file, root),
    reason: normalizeDisabledReason(route.reason),
  }
  if (typeof route.method !== 'undefined') {
    disabled.method = route.method
  }
  if (typeof route.url !== 'undefined') {
    disabled.url = route.url
  }
  if (matchedGroup) {
    disabled.groupKey = matchedGroup.key
    disabled.group = matchedGroup.label
  }
  return disabled
}

function toPlaygroundIgnoredRoute(
  route: PlaygroundIgnoredRouteInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundIgnoredRoute {
  const matchedGroup = resolveRouteGroup(route.file, groups)
  const ignored: PlaygroundIgnoredRoute = {
    file: formatRouteFile(route.file, root),
    reason: normalizeIgnoredReason(route.reason),
  }
  if (matchedGroup) {
    ignored.groupKey = matchedGroup.key
    ignored.group = matchedGroup.label
  }
  return ignored
}

function toPlaygroundConfigFile(
  entry: PlaygroundConfigFileInput,
  root: string | undefined,
  groups: PlaygroundGroup[],
): PlaygroundConfigFile {
  const matchedGroup = resolveRouteGroup(entry.file, groups)
  const configFile: PlaygroundConfigFile = {
    file: formatRouteFile(entry.file, root),
  }
  if (matchedGroup) {
    configFile.groupKey = matchedGroup.key
    configFile.group = matchedGroup.label
  }
  return configFile
}

export type {
  PlaygroundConfigFileInput,
  PlaygroundDisabledRouteInput,
  PlaygroundIgnoredRouteInput,
}
export {
  toPlaygroundConfigFile,
  toPlaygroundDisabledRoute,
  toPlaygroundIgnoredRoute,
  toPlaygroundRoute,
}
