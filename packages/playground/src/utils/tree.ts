import type { PlaygroundRoute, TreeMode, TreeRow } from '../types'
import { toPosixPath } from './path'

interface TreeNode {
  id: string
  label: string
  kind: 'folder' | 'route'
  path: string
  route?: PlaygroundRoute
  children: TreeNode[]
  map?: Map<string, TreeNode>
}

function buildSegments(route: PlaygroundRoute, mode: TreeMode) {
  if (mode === 'file') {
    return toPosixPath(route.file).split('/').filter(Boolean)
  }
  const raw = toPosixPath(route.url)
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw
  return trimmed ? trimmed.split('/').filter(Boolean) : []
}

/**
 * Build a tree structure for the route list.
 *
 * @param routes - Playground routes.
 * @param mode - Tree mode.
 * @returns Root tree node.
 *
 * @example
 * import { buildRouteTree } from '@mokup/playground'
 *
 * const tree = buildRouteTree([], 'file')
 */
export function buildRouteTree(routes: PlaygroundRoute[], mode: TreeMode) {
  const root: TreeNode = {
    id: `${mode}:root`,
    label: '',
    kind: 'folder',
    path: '',
    children: [],
  }
  for (const route of routes) {
    const segments = buildSegments(route, mode)
    if (segments.length === 0) {
      const leafId = `${mode}:route:${route.method} ${route.url}|${route.file}`
      root.children.push({
        id: leafId,
        label: '/',
        kind: 'route',
        path: '/',
        route,
        children: [],
      })
      continue
    }
    let current = root
    const total = segments.length
    for (let index = 0; index < total; index += 1) {
      const segment = segments[index]
      const isLeaf = index === total - 1
      if (isLeaf) {
        const leafId = `${mode}:route:${route.method} ${route.url}|${route.file}`
        current.children.push({
          id: leafId,
          label: segment,
          kind: 'route',
          path: segments.join('/'),
          route,
          children: [],
        })
        continue
      }
      if (!current.map) {
        current.map = new Map()
      }
      const path = segments.slice(0, index + 1).join('/')
      let next = current.map.get(path)
      if (!next) {
        next = {
          id: `${mode}:folder:${path}`,
          label: segment,
          kind: 'folder',
          path,
          children: [],
        }
        current.map.set(path, next)
        current.children.push(next)
      }
      current = next
    }
  }
  return root
}

/**
 * Sort a route tree node in-place.
 *
 * @param node - Root node to sort.
 * @returns The sorted node.
 *
 * @example
 * import { sortRouteTree } from '@mokup/playground'
 *
 * const sorted = sortRouteTree({ id: 'root', label: '', kind: 'folder', children: [] })
 */
export function sortRouteTree(node: TreeNode) {
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'folder' ? -1 : 1
    }
    const labelCompare = a.label.localeCompare(b.label)
    if (labelCompare !== 0) {
      return labelCompare
    }
    if (a.route && b.route) {
      return a.route.method.localeCompare(b.route.method)
    }
    return 0
  })
  for (const child of node.children) {
    if (child.kind === 'folder') {
      sortRouteTree(child)
    }
  }
}

function collectFolderIds(node: TreeNode, ids: string[]) {
  for (const child of node.children) {
    if (child.kind === 'folder') {
      ids.push(child.id)
      collectFolderIds(child, ids)
    }
  }
}

/**
 * Collect all folder ids for a route list and tree mode.
 *
 * @param routes - Routes list.
 * @param mode - Tree mode.
 * @returns List of folder ids.
 *
 * @example
 * import { getAllFolderIds } from '@mokup/playground'
 *
 * const ids = getAllFolderIds([], 'file')
 */
export function getAllFolderIds(routes: PlaygroundRoute[], mode: TreeMode) {
  const root = buildRouteTree(routes, mode)
  sortRouteTree(root)
  const ids: string[] = []
  collectFolderIds(root, ids)
  return ids
}

function toRows(
  node: TreeNode,
  depth: number,
  mode: TreeMode,
  rows: TreeRow[],
  isExpanded: (id: string) => boolean,
  selectedKey: string,
  getRouteKey: (route: PlaygroundRoute) => string,
) {
  for (const child of node.children) {
    const title = child.kind === 'folder'
      ? child.path
      : mode === 'file'
        ? child.route?.file
        : child.route?.url
    const expanded = child.kind === 'folder' ? isExpanded(child.id) : undefined
    rows.push({
      id: child.id,
      label: child.label,
      kind: child.kind,
      depth,
      title,
      expanded,
      selected: child.route ? getRouteKey(child.route) === selectedKey : false,
      route: child.route,
    })
    if (child.kind === 'folder' && expanded) {
      toRows(child, depth + 1, mode, rows, isExpanded, selectedKey, getRouteKey)
    }
  }
}

/**
 * Build flattened rows for the tree view.
 *
 * @param params - Tree builder inputs.
 * @returns List of tree rows.
 *
 * @example
 * import { buildTreeRows } from '@mokup/playground'
 *
 * const rows = buildTreeRows({ routes: [], mode: 'file' })
 */
export function buildTreeRows(params: {
  root: TreeNode
  mode: TreeMode
  isExpanded: (id: string) => boolean
  selectedKey: string
  getRouteKey: (route: PlaygroundRoute) => string
}) {
  const rows: TreeRow[] = []
  toRows(
    params.root,
    0,
    params.mode,
    rows,
    params.isExpanded,
    params.selectedKey,
    params.getRouteKey,
  )
  return rows
}
