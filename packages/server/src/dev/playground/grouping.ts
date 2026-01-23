import { cwd } from 'node:process'
import { dirname, normalize, relative } from '@mokup/shared/pathe'

interface PlaygroundGroup {
  key: string
  label: string
  path: string
}

function toPosixPath(value: string) {
  return value.replace(/\\/g, '/')
}

function normalizePath(value: string) {
  return toPosixPath(normalize(value))
}

function isAncestor(parent: string, child: string) {
  const normalizedParent = normalizePath(parent).replace(/\/$/, '')
  const normalizedChild = normalizePath(child)
  return normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`)
}

function resolveGroupRoot(
  dirs: string[],
  serverRoot?: string,
) {
  if (!dirs || dirs.length === 0) {
    return serverRoot ?? cwd()
  }
  if (serverRoot) {
    const normalizedRoot = normalizePath(serverRoot)
    const canUseRoot = dirs.every(dir => isAncestor(normalizedRoot, dir))
    if (canUseRoot) {
      return normalizedRoot
    }
  }
  if (dirs.length === 1) {
    return normalizePath(dirname(dirs[0]!))
  }
  let common = normalizePath(dirs[0]!)
  for (const dir of dirs.slice(1)) {
    const normalizedDir = normalizePath(dir)
    while (common && !isAncestor(common, normalizedDir)) {
      const parent = normalizePath(dirname(common))
      if (parent === common) {
        break
      }
      common = parent
    }
  }
  if (!common || common === '/') {
    return serverRoot ?? cwd()
  }
  return common
}

function resolveGroups(dirs: string[], root: string) {
  const groups: PlaygroundGroup[] = []
  const seen = new Set<string>()
  for (const dir of dirs) {
    const normalized = normalizePath(dir)
    if (seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    const rel = toPosixPath(relative(root, normalized))
    const label = rel && !rel.startsWith('..') ? rel : normalized
    groups.push({
      key: normalized,
      label,
      path: normalized,
    })
  }
  return groups
}

function resolveRouteGroup(routeFile: string, groups: PlaygroundGroup[]) {
  if (groups.length === 0) {
    return undefined
  }
  const normalizedFile = toPosixPath(normalize(routeFile))
  let matched: PlaygroundGroup | undefined
  for (const group of groups) {
    if (normalizedFile === group.path || normalizedFile.startsWith(`${group.path}/`)) {
      if (!matched || group.path.length > matched.path.length) {
        matched = group
      }
    }
  }
  return matched
}

function formatRouteFile(file: string, root?: string) {
  if (!root) {
    return toPosixPath(file)
  }
  const rel = toPosixPath(relative(root, file))
  if (!rel || rel.startsWith('..')) {
    return toPosixPath(file)
  }
  return rel
}

export type { PlaygroundGroup }
export {
  formatRouteFile,
  resolveGroupRoot,
  resolveGroups,
  resolveRouteGroup,
}
