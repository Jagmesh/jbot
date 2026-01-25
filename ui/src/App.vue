<script setup lang="ts">
import AudioPlayer from "./components/AudioPlayer.vue";
</script>

<template>
  <div class="wrap">
    <h1>JBOT Audio Player</h1>
    <AudioPlayer />
  </div>
</template>

<style scoped>
.wrap { font-family: system-ui, sans-serif; max-width: 720px; margin: 24px auto; padding: 0 16px; }
</style>