<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()
</script>

<template>
  <Transition name="pg-hot-toast">
    <div v-if="props.visible" class="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <div class="pg-hot-toast inline-flex items-center gap-2 rounded border border-pg-border bg-pg-surface-panel px-4 py-2 text-sm font-medium text-pg-text">
        <span class="i-[carbon--checkmark-filled] h-4 w-4 text-pg-accent" aria-hidden="true" />
        Hot reload complete
      </div>
    </div>
  </Transition>
</template>
