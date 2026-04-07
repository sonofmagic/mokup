<script setup lang="ts">
import type { Placement, Strategy } from '@floating-ui/dom'
import type { ComponentPublicInstance } from 'vue'
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface UiFloatingMenuProps {
  placement?: Placement
  strategy?: Strategy
  offset?: number
  shiftPadding?: number
  flipPadding?: number
  panelClass?: string
  panelRole?: string
}

const props = withDefaults(defineProps<UiFloatingMenuProps>(), {
  placement: 'bottom-start',
  strategy: 'fixed',
  offset: 6,
  shiftPadding: 8,
  flipPadding: 8,
  panelClass: '',
  panelRole: 'menu',
})

type ReferenceTarget = Element | ComponentPublicInstance | null

const panelId = `pg-floating-menu-${Math.random().toString(36).slice(2, 10)}`
const isOpen = ref(false)
const referenceEl = ref<HTMLElement | null>(null)
const floatingEl = ref<HTMLElement | null>(null)
const floatingStyle = ref<{ position: Strategy, left: string, top: string }>({
  position: props.strategy,
  left: '0px',
  top: '0px',
})
let autoUpdateCleanup: ReturnType<typeof autoUpdate> | null = null

function resolveElement(target: ReferenceTarget): HTMLElement | null {
  if (!target) {
    return null
  }
  if (target instanceof HTMLElement) {
    return target
  }
  const componentTarget = target as ComponentPublicInstance & {
    $el?: unknown
    el?: { value?: unknown }
  }
  const exposedElement = componentTarget.el?.value
  if (exposedElement instanceof HTMLElement) {
    return exposedElement
  }
  return componentTarget.$el instanceof HTMLElement ? componentTarget.$el : null
}

function setReference(target: ReferenceTarget) {
  referenceEl.value = resolveElement(target)
}

function clearAutoUpdate() {
  if (autoUpdateCleanup) {
    autoUpdateCleanup()
    autoUpdateCleanup = null
  }
}

async function updateFloatingPosition() {
  const reference = referenceEl.value
  const floating = floatingEl.value
  if (!reference || !floating) {
    return
  }
  const { x, y } = await computePosition(reference, floating, {
    placement: props.placement,
    strategy: props.strategy,
    middleware: [
      offset(props.offset),
      flip({ padding: props.flipPadding }),
      shift({ padding: props.shiftPadding }),
    ],
  })
  floatingStyle.value = {
    position: props.strategy,
    left: `${Math.round(x)}px`,
    top: `${Math.round(y)}px`,
  }
}

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) {
    close()
    return
  }
  open()
}

function handlePointerDown(event: PointerEvent) {
  if (!isOpen.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  if (referenceEl.value?.contains(target) || floatingEl.value?.contains(target)) {
    return
  }
  close()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return
  }
  close()
}

watch(isOpen, (value) => {
  if (value) {
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeydown)
    void nextTick().then(() => {
      if (!isOpen.value || !referenceEl.value || !floatingEl.value) {
        return
      }
      void updateFloatingPosition()
      clearAutoUpdate()
      autoUpdateCleanup = autoUpdate(referenceEl.value, floatingEl.value, () => {
        void updateFloatingPosition()
      })
    })
    return
  }
  clearAutoUpdate()
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  clearAutoUpdate()
  document.removeEventListener('pointerdown', handlePointerDown)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="contents">
    <slot
      name="trigger"
      :is-open="isOpen"
      :panel-id="panelId"
      :open="open"
      :close="close"
      :toggle="toggle"
      :set-reference="setReference"
    />
    <Teleport to="body">
      <div
        v-if="isOpen"
        :id="panelId"
        ref="floatingEl"
        :class="props.panelClass"
        :style="floatingStyle"
        :role="props.panelRole"
      >
        <slot :close="close" />
      </div>
    </Teleport>
  </div>
</template>
