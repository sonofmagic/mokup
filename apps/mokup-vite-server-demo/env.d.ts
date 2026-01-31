/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_MOKUP_BASE?: string
  readonly VITE_USE_MOKUP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
