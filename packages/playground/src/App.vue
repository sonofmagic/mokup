<script setup lang="ts">
import PlaygroundHotReloadToast from './components/PlaygroundHotReloadToast.vue'
import PlaygroundWorkspace from './components/PlaygroundWorkspace.vue'
import { usePlaygroundAppState } from './hooks/usePlaygroundAppState'

const { hotReloadVisible, workspaceProps } = usePlaygroundAppState()
</script>

<template>
  <div class="h-screen overflow-hidden pg-app-bg" data-testid="playground-app">
    <PlaygroundHotReloadToast :visible="hotReloadVisible" />
    <PlaygroundWorkspace v-bind="workspaceProps" />
  </div>
</template>
