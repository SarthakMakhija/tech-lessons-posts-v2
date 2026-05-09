<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm') {
      document.body.classList.toggle('show-menu')
    }
  })
})
</script>

<template>
  <!-- This component doesn't render anything, just handles the global shortcut -->
  <span></span>
</template>
