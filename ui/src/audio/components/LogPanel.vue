<script setup lang="ts">
type LogEntry = { text: string; type: "error" | "info" };

defineProps<{
  logs: LogEntry[];
}>();
</script>

<template>
  <pre class="log">
    <template v-for="(l, i) in logs" :key="i"><span :class="['line', `line--${l.type}`]">{{ l.text }}</span><span v-if="i !== logs.length - 1"></span>
    </template>
  </pre>
</template>

<style scoped>
.log {
  margin-top: 12px;
  white-space: pre-wrap;
  background: #111;
  color: #ddd;
  padding: 12px;
  border-radius: 8px;
  min-height: 140px;

  text-align: left;
}

.line--info { color: #ddd; }
.line--error { color: #ff6b6b; }
</style>