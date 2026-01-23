declare module 'virtual:mokup-bundle' {
  const mokupBundle: {
    manifest: import('mokup/runtime').Manifest
    moduleMap?: import('mokup/runtime').ModuleMap
    moduleBase?: string | URL
  }
  export default mokupBundle
  export { mokupBundle }
}
