// The build id, injected at build time by the morsels45-build-id plugin in
// vite.config.ts. Declared here so the route that imports it typechecks.
declare module 'virtual:build-id' {
  export const BUILD: string
}
