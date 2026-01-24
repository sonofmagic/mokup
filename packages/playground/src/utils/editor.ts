import { toPosixPath } from './path'

interface ResolveEditorOptions {
  allowAbsoluteWithoutRoot?: boolean
}

function isAbsolutePath(value: string) {
  return value.startsWith('/') || /^[a-z]:\//i.test(value)
}

function normalizeRoot(root: string) {
  return toPosixPath(root).replace(/\/+$/, '')
}

function normalizeFile(file: string) {
  return toPosixPath(file).trim()
}

function resolveEditorUrl(
  file: string,
  workspaceRoot?: string,
  options: ResolveEditorOptions = {},
) {
  const normalizedFile = normalizeFile(file)
  if (!normalizedFile) {
    return null
  }
  if (isAbsolutePath(normalizedFile)) {
    if (!options.allowAbsoluteWithoutRoot && !workspaceRoot?.trim()) {
      return null
    }
    return `vscode://file/${encodeURI(normalizedFile)}`
  }
  if (!workspaceRoot?.trim()) {
    return null
  }
  const normalizedRoot = normalizeRoot(workspaceRoot)
  if (!normalizedRoot) {
    return null
  }
  const relative = normalizedFile.replace(/^\/+/, '')
  return `vscode://file/${encodeURI(`${normalizedRoot}/${relative}`)}`
}

function openInEditor(
  file: string,
  workspaceRoot?: string,
  options?: ResolveEditorOptions,
) {
  const target = resolveEditorUrl(file, workspaceRoot, options)
  if (!target) {
    return false
  }
  window.location.href = target
  return true
}

export type { ResolveEditorOptions }
export { openInEditor, resolveEditorUrl }
