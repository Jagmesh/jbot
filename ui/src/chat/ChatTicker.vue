<template>
  <div class="ticker" ref="tickerRef">
    <div
        v-if="current"
        class="message"
        ref="messageRef"
    >
      <div class="message-bg"></div>
      <span
          class="user"
          :style="{ color: current.color || '#ffffff' }"
      >
        {{ current.user }}:
      </span>
      <span class="text">{{ current.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

type ChatMessage = {
  id: string
  user: string
  color?: string
  text: string
}

const queue = ref<ChatMessage[]>([])
const current = ref<ChatMessage | null>(null)

const tickerRef = ref<HTMLElement | null>(null)
const messageRef = ref<HTMLElement | null>(null)

const SPEED = 200 // px/sec

function playNext() {
  if (current.value || queue.value.length === 0) return
  current.value = queue.value.shift()!
  nextTick(() => animateMessage())
}

function animateMessage() {
  if (!tickerRef.value || !messageRef.value || !current.value) return

  const tickerWidth = tickerRef.value.offsetWidth
  const messageWidth = messageRef.value.offsetWidth

  let start = performance.now()
  const startX = tickerWidth
  const endX = -messageWidth
  const distance = startX - endX
  const duration = distance / SPEED * 1000 // мс

  function step(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const x = startX + (endX - startX) * progress
    if (messageRef.value) messageRef.value.style.transform = `translateX(${x}px)`

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      current.value = null
      playNext()
    }
  }

  requestAnimationFrame(step)
}

onMounted(() => {
  const es = new EventSource("/sse/chat")

  es.addEventListener("open", () => console.log("Connected to /sse/chat"))
  es.addEventListener("error", () => console.error("SSE error (reconnecting...)"))

  es.addEventListener('chat_message', (e) => {
    const msg = JSON.parse(e.data)
    queue.value.push({
      ...msg,
      id: crypto.randomUUID(),
    })
    playNext()
  })
})
</script>

<style scoped>
:root, body, html {
  background: transparent;
  margin: 0;
  padding: 0;
}

.ticker {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;
  background: transparent;
}

.message {
  position: absolute;
  top: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  font-size: 28px;
  font-weight: 600;
}

.message-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 6px;
  z-index: 0;
}

.user, .text {
  position: relative;
  z-index: 1;
}

.user {
  margin-left: 16px;
}

.text {
  color: #ffffff;
  margin-right: 16px;
}

.ticker, .message, .user, .text {
  font-family: 'Roboto Mono', monospace;
}
</style>
