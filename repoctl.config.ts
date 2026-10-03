import { defineMonorepoConfig } from 'repoctl'

export default defineMonorepoConfig({
  commands: {
    create: {
      defaultTemplate: 'tsdown',
      renameJson: false,
    },
    clean: {
      autoConfirm: false,
      includePrivate: true,
    },
    release: {
      qualityScripts: ['release:check'],
    },
    upgrade: {
      skipOverwrite: false,
      mergeTargets: true,
    },
  },
})
