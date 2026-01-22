<script setup lang="ts">
import type { StyleValue } from 'vue'
import { tv } from 'tailwind-variants'
import { computed, useAttrs } from 'vue'
import { cn } from './utils'

type PillTone = 'strong' | 'card' | 'chip'
type PillSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg'

interface UiPillProps {
  tone?: PillTone
  size?: PillSize
  caps?: boolean
  tracking?: 'tight' | 'wide' | 'none'
}

const props = withDefaults(defineProps<UiPillProps>(), {
  tone: 'strong',
  size: 'md',
  caps: true,
  tracking: 'wide',
})

const pill = tv({
  base: 'inline-flex items-center gap-2 rounded-full',
  variants: {
    size: {
      xxs: 'px-2 py-0.5 text-[0.55rem]',
      xs: 'px-2.5 py-1 text-[0.55rem]',
      sm: 'px-3 py-1 text-[0.55rem]',
      md: 'px-3 py-1.5 text-[0.6rem]',
      lg: 'px-3 py-1.5 text-[0.65rem]',
    },
    tone: {
      strong: 'border border-pg-border bg-pg-surface-strong text-pg-text-soft',
      card: 'border border-pg-border bg-pg-surface-card text-pg-text-soft',
      chip: 'bg-pg-chip text-pg-chip-text',
    },
    caps: {
      true: 'uppercase',
      false: '',
    },
    tracking: {
      wide: 'tracking-[0.25em]',
      tight: 'tracking-[0.2em]',
      none: '',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'strong',
    caps: true,
    tracking: 'wide',
  },
})

const attrs = useAttrs()
const classes = computed(() => {
  const tracking = props.caps ? props.tracking : 'none'
  return cn(
    pill({
      size: props.size,
      tone: props.tone,
      caps: props.caps,
      tracking,
    }),
    attrs.class,
  )
})
const pillAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs as Record<string, unknown>
  return rest
})
const pillStyle = computed(() => attrs.style as StyleValue | undefined)
</script>

<template>
  <span v-bind="pillAttrs" :class="classes" :style="pillStyle">
    <slot />
  </span>
</template>
