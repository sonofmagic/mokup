<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  configChain?: string[]
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const { t } = useI18n()

const configItems = computed(() => {
  return (props.configChain ?? []).map((file, index) => ({
    file,
    order: index + 1,
    disabled: props.configStatusMap.get(file) === 'disabled',
  }))
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 border-t px-4 py-3 text-[0.6rem] uppercase tracking-[0.2em] border-pg-border text-pg-text-muted">
      <span>{{ t('detail.configChain') }}</span>
      <UiPill tone="chip" size="xxs" :caps="false">
        {{ configItems.length }}
      </UiPill>
    </div>
    <div
      v-if="configItems.length > 0"
      class="flex flex-col gap-2 border-t px-4 py-3 text-xs border-pg-border text-pg-text-soft"
    >
      <div
        v-for="item in configItems"
        :key="`config-${item.order}-${item.file}`"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="rounded-full border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
          {{ item.order }}
        </span>
        <span class="text-[0.7rem] text-pg-text-subtle">
          {{ item.file }}
        </span>
        <UiPill v-if="item.disabled" tone="strong" size="xxs" :caps="false">
          {{ t('configPanel.statusDisabled') }}
        </UiPill>
      </div>
    </div>
    <div
      v-else
      class="border-t px-4 py-3 text-xs border-pg-border text-pg-text-muted"
    >
      {{ t('detail.configChainEmpty') }}
    </div>
  </div>
</template>
