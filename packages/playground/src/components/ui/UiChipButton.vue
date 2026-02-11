<script setup lang="ts">
import type { StyleValue } from 'vue'
import { tv } from 'tailwind-variants'
import { computed, ref, useAttrs } from 'vue'
import { cn } from './utils'

type ChipTone = 'strong' | 'card'
type ChipSize = 'xs' | 'sm' | 'md' | 'lg'

interface UiChipButtonProps {
  active?: boolean
  tone?: ChipTone
  size?: ChipSize
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<UiChipButtonProps>(), {
  active: false,
  tone: 'strong',
  size: 'md',
  type: 'button',
})

const chipButton = tv({
  base: 'inline-flex items-center gap-1.5 rounded border text-[0.75rem] transition',
  variants: {
    size: {
      xs: 'px-2 py-0.5',
      sm: 'px-2 py-1',
      md: 'px-2.5 py-1',
      lg: 'px-3 py-1.5',
    },
    tone: {
      strong: 'border-pg-border bg-pg-surface-strong text-pg-text-soft hover:bg-pg-hover-strong',
      card: 'border-pg-border bg-pg-surface-card text-pg-text-soft hover:bg-pg-hover-strong',
    },
    active: {
      true: 'border-pg-accent bg-pg-accent text-pg-on-accent hover:border-pg-accent hover:bg-pg-accent hover:text-pg-on-accent',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'strong',
  },
})

const attrs = useAttrs()
const classes = computed(() => cn(
  chipButton({ size: props.size, tone: props.tone, active: props.active }),
  attrs.class,
))

const buttonAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs as Record<string, unknown>
  return rest
})
const buttonStyle = computed(() => attrs.style as StyleValue | undefined)

const buttonRef = ref<HTMLButtonElement | null>(null)

defineExpose({
  el: buttonRef,
})
</script>

<template>
  <button
    ref="buttonRef"
    v-bind="buttonAttrs"
    :type="props.type"
    :class="classes"
    :style="buttonStyle"
  >
    <slot />
  </button>
</template>
