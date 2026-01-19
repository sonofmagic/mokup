<script setup lang="ts">
type LogoSize = 'small' | 'large'

withDefaults(
  defineProps<{
    size?: LogoSize
    showText?: boolean
  }>(),
  {
    size: 'small',
    showText: true,
  },
)
</script>

<template>
  <span class="mokup-brand" :class="`mokup-brand--${size}`">
    <img class="mokup-brand__logo" src="/brand/mokup-logo.svg" alt="Mokup mascot">
    <span v-if="showText" class="mokup-brand__text">Mokup</span>
  </span>
</template>
