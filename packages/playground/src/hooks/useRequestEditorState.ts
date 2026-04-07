import type { BodyType, MultipartFileEntry, RawBodyType, RouteParamField } from '../types'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface UseRequestEditorStateOptions<TTab extends string> {
  t: (key: string, params?: Record<string, unknown>) => string
  selectedUrl: () => string | undefined
  routeParams: () => RouteParamField[]
  missingParams: () => string[]
  missingPulse: () => number
  bodyType: () => BodyType
  rawType: () => RawBodyType
  multipartFiles: () => MultipartFileEntry[]
  setMultipartFiles: (value: MultipartFileEntry[]) => void
  setBinaryFile: (value: File | null) => void
  resolveDefaultTab: () => TTab
  syncRouteParamsTab?: (length: number, previous: number, current: TTab) => TTab | null
}

const RAW_TEXT_EXAMPLE = 'Hello Mokup'
const RAW_JAVASCRIPT_EXAMPLE = 'export const data = { ok: true }'
const RAW_HTML_EXAMPLE = '<div class="card">Hello</div>'
const RAW_XML_EXAMPLE = '<note>Hello</note>'
const BODY_JSON_EXAMPLE = '{ "name": "Ada" }'
const FORM_EXAMPLE = 'title=alpha\ncount=3'

export function useRequestEditorState<TTab extends string>(
  options: UseRequestEditorStateOptions<TTab>,
) {
  const activeTab = ref<TTab>(options.resolveDefaultTab())
  const missingPulseActive = ref(false)
  const missingParamRefs = new Map<string, HTMLElement>()
  let missingPulseTimeout: ReturnType<typeof setTimeout> | null = null
  let multipartRowId = 0

  const missingParamsSet = computed(() => new Set(options.missingParams()))
  const hasMissingParams = computed(() => options.missingParams().length > 0)
  const hasRequiredParams = computed(() => options.routeParams().some(param => param.required))
  const rawTypeLabel = computed(() => {
    switch (options.rawType()) {
      case 'text':
        return options.t('detail.rawTypeText')
      case 'javascript':
        return options.t('detail.rawTypeJavascript')
      case 'html':
        return options.t('detail.rawTypeHtml')
      case 'xml':
        return options.t('detail.rawTypeXml')
      default:
        return options.t('detail.rawTypeJson')
    }
  })
  const bodyTypeLabel = computed(() => {
    switch (options.bodyType()) {
      case 'none':
        return options.t('detail.bodyTypeNone')
      case 'form-data':
        return options.t('detail.bodyTypeFormData')
      case 'form-urlencoded':
        return options.t('detail.bodyTypeFormUrlencoded')
      case 'raw':
        return `${options.t('detail.bodyTypeRaw')} · ${rawTypeLabel.value}`
      case 'binary':
        return options.t('detail.bodyTypeBinary')
      default:
        return options.t('detail.bodyTypeNone')
    }
  })

  function paramPlaceholder(param: RouteParamField) {
    return param.kind === 'param'
      ? options.t('detail.paramPlaceholder')
      : options.t('detail.paramPlaceholderCatchall')
  }

  function registerMissingParamRef(name: string, el: HTMLElement | null) {
    if (!el) {
      missingParamRefs.delete(name)
      return
    }
    missingParamRefs.set(name, el)
  }

  function triggerMissingPulse() {
    if (missingPulseTimeout) {
      clearTimeout(missingPulseTimeout)
      missingPulseTimeout = null
    }
    missingPulseActive.value = false
    if (typeof window === 'undefined') {
      return
    }
    window.requestAnimationFrame(() => {
      missingPulseActive.value = true
      missingPulseTimeout = window.setTimeout(() => {
        missingPulseActive.value = false
        missingPulseTimeout = null
      }, 1400)
    })
  }

  function focusFirstMissingParam() {
    const [firstMissing] = options.missingParams()
    if (!firstMissing) {
      return
    }
    const target = missingParamRefs.get(firstMissing)
    if (!target) {
      return
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.querySelector('input')?.focus()
  }

  watch(
    options.selectedUrl,
    () => {
      activeTab.value = options.resolveDefaultTab()
    },
    { immediate: true },
  )

  if (options.syncRouteParamsTab) {
    watch(
      () => options.routeParams().length,
      (length, previous) => {
        const nextTab = options.syncRouteParamsTab?.(length, previous, activeTab.value)
        if (nextTab) {
          activeTab.value = nextTab
        }
      },
    )
  }

  watch(
    options.missingPulse,
    async (value, previous) => {
      if (value === previous || !hasMissingParams.value) {
        return
      }
      activeTab.value = 'params' as TTab
      await nextTick()
      focusFirstMissingParam()
      triggerMissingPulse()
    },
  )

  watch(
    () => options.missingParams().length,
    (length) => {
      if (length === 0) {
        missingPulseActive.value = false
      }
    },
  )

  function resolveBodyPlaceholder() {
    switch (options.bodyType()) {
      case 'raw':
        switch (options.rawType()) {
          case 'text':
            return options.t('detail.bodyPlaceholderRawText', { sample: RAW_TEXT_EXAMPLE })
          case 'javascript':
            return options.t('detail.bodyPlaceholderRawJavascript', { sample: RAW_JAVASCRIPT_EXAMPLE })
          case 'html':
            return options.t('detail.bodyPlaceholderRawHtml', { sample: RAW_HTML_EXAMPLE })
          case 'xml':
            return options.t('detail.bodyPlaceholderRawXml', { sample: RAW_XML_EXAMPLE })
          default:
            return options.t('detail.bodyPlaceholderRawJson', { json: BODY_JSON_EXAMPLE })
        }
      case 'form-data':
        return options.t('detail.bodyPlaceholderFormData', { sample: FORM_EXAMPLE })
      case 'form-urlencoded':
        return options.t('detail.bodyPlaceholderFormUrlencoded', { sample: FORM_EXAMPLE })
      default:
        return ''
    }
  }

  function createMultipartRow(): MultipartFileEntry {
    multipartRowId += 1
    return {
      id: `multipart-${multipartRowId}`,
      name: '',
      files: [],
    }
  }

  function addMultipartRow() {
    options.setMultipartFiles([...options.multipartFiles(), createMultipartRow()])
  }

  function removeMultipartRow(id: string) {
    options.setMultipartFiles(options.multipartFiles().filter(row => row.id !== id))
  }

  function updateMultipartName(id: string, value: string) {
    options.setMultipartFiles(
      options.multipartFiles().map(row => (row.id === id ? { ...row, name: value } : row)),
    )
  }

  function updateMultipartFiles(id: string, event: Event) {
    const input = event.target as HTMLInputElement | null
    const files = Array.from(input?.files ?? [])
    options.setMultipartFiles(
      options.multipartFiles().map(row => (row.id === id ? { ...row, files } : row)),
    )
  }

  function resolveMultipartLabel(row: MultipartFileEntry) {
    if (row.files.length === 0) {
      return options.t('detail.bodyMultipartChoose')
    }
    return options.t('detail.bodyMultipartCount', { count: row.files.length })
  }

  function updateBinaryFile(event: Event) {
    const input = event.target as HTMLInputElement | null
    const [file] = Array.from(input?.files ?? [])
    options.setBinaryFile(file ?? null)
  }

  function clearBinaryFile() {
    options.setBinaryFile(null)
  }

  function formatBytes(size: number) {
    if (!size) {
      return '0 B'
    }
    if (size < 1024) {
      return `${size} B`
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  onBeforeUnmount(() => {
    if (missingPulseTimeout) {
      clearTimeout(missingPulseTimeout)
      missingPulseTimeout = null
    }
  })

  return {
    activeTab,
    bodyTypeLabel,
    clearBinaryFile,
    formatBytes,
    hasMissingParams,
    hasRequiredParams,
    missingParamsSet,
    missingPulseActive,
    paramPlaceholder,
    rawTypeLabel,
    registerMissingParamRef,
    resolveBodyPlaceholder,
    resolveMultipartLabel,
    updateBinaryFile,
    updateMultipartFiles,
    updateMultipartName,
    addMultipartRow,
    removeMultipartRow,
  }
}
