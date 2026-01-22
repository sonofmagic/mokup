<script setup lang="ts">
import type { StyleValue } from 'vue'
import { tv } from 'tailwind-variants'
import { computed, useAttrs } from 'vue'
import { cn } from './utils'

interface UiFieldProps {
  label: string
  dense?: boolean
}

const props = withDefaults(defineProps<UiFieldProps>(), {
  dense: false,
})

const field = tv({
  base: 'flex flex-col uppercase text-pg-text-muted',
  variants: {
    dense: {
      true: 'gap-1 text-[0.55rem] tracking-[0.25em]',
      false: 'gap-1.5 text-[0.65rem] tracking-[0.2em]',
    },
  },
  defaultVariants: {
    dense: false,
  },
})

const attrs = useAttrs()
const classes = computed(() => cn(field({ dense: props.dense }), attrs.class))
const labelAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs as Record<string, unknown>
  return rest
})
const labelStyle = computed(() => attrs.style as StyleValue | undefined)
</script>

<template>
  <label v-bind="labelAttrs" :class="classes" :style="labelStyle">
    <span>{{ props.label }}</span>
    <slot />
  </label>
</template>
