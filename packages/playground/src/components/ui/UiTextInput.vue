<script setup lang="ts">
import type { StyleValue } from 'vue'
import { tv } from 'tailwind-variants'
import { computed, useAttrs } from 'vue'
import { cn } from './utils'

interface UiTextInputProps {
  dense?: boolean
}

const props = withDefaults(defineProps<UiTextInputProps>(), {
  dense: false,
})

const textInput = tv({
  base: 'rounded-lg border outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent',
  variants: {
    dense: {
      true: 'px-2.5 py-1.5 text-[0.8rem]',
      false: 'px-3 py-2 text-sm',
    },
  },
  defaultVariants: {
    dense: false,
  },
})

const attrs = useAttrs()
const classes = computed(() => cn(textInput({ dense: props.dense }), attrs.class))
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs as Record<string, unknown>
  return rest
})
const inputStyle = computed(() => attrs.style as StyleValue | undefined)
</script>

<template>
  <input
    v-bind="inputAttrs"
    :class="classes"
    :style="inputStyle"
  >
</template>
