declare module 'virtual:mokup-bundle' {
  const mokupBundle: {
    manifest: import('mokup/runtime').Manifest
    moduleMap?: import('mokup/runtime').ModuleMap | undefined
    moduleBase?: string | URL | undefined
  }
  export default mokupBundle
  export { mokupBundle }
}
