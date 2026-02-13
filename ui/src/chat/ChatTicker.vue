<template>
  <div class="ticker" ref="tickerRef">
    <div
        v-for="msg in actives"
        :key="msg.id"
        class="message"
        :data-id="msg.id"
        ref="messageRefs"
        :style="{ transform: `translateX(${msg.x}px)` }"
    >
      <div class="message-bg"></div>
      <span class="user" :style="{ color: msg.color || '#ffffff' }">{{ msg.user }}:</span>
      <span class="text">{{ msg.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {getRefWidth} from "./utils/utils.ts";

type ChatMessage = {
  id: string
  user: string
  color?: string
  text: string
}

type ActiveMsg = ChatMessage & {
  x: number
  width: number
  measured: boolean
}

const queue = ref<ChatMessage[]>([])
const actives = ref<ActiveMsg[]>([])

const tickerRef = ref<HTMLElement | null>(null)
const messageRefs = ref<HTMLElement[]>([])

// Параметры — подбирай по вкусу
const SPEED = 100       // px / sec
const GAP = 12          // px — минимальный зазор между сообщениями
const REMOVE_BUFFER = 6 // px — удаляем, когда правый край ушёл глубже этого буфера

let measuring = false   // флаг: сейчас идёт измерение нового элемента

function findElById(id: string) {
  return messageRefs.value.find(el => el.dataset.id === id) || null
}

// измеряем ширину элемента и помечаем measured=true
async function measureActive(active: ActiveMsg) {
  // если шрифт может грузиться асинхронно, подождём (это предотвращает width=0)
  if ((document as any).fonts && (document as any).fonts.ready) {
    try {
      await (document as any).fonts.ready
    } catch {
      // ignore
    }
  }

  const el = findElById(active.id)
  if (!el) {
    active.width = 0
    active.measured = true
    return
  }

  // Force reflow read
  active.width = el.offsetWidth
  // Устанавливаем стиль (на случай, если визуально ещё не в нужной позиции)
  el.style.transform = `translateX(${active.x}px)`
  active.measured = true
}

// Попытка спавна одного следующего сообщения — защищена measuring флагом
async function trySpawnOnce() {
  if (measuring) return false
  if (queue.value.length === 0) return false

  const tickerW = getRefWidth(tickerRef)
  const last = actives.value[actives.value.length - 1]

  // Если есть последний, но он ещё не измерен — нельзя спавнить
  if (last && !last.measured) return false

  // Условие для спавна: либо нет активных, либо правый край last ушёл влево на GAP
  if (!last || (last.x + last.width <= tickerW - GAP)) {
    const msg = queue.value.shift()!
    const active: ActiveMsg = { ...msg, x: tickerW, width: 0, measured: false }
    actives.value.push(active)

    measuring = true
    await nextTick()
    await measureActive(active)
    measuring = false
    return true
  }

  return false
}

// РАФ цикл — двигает все active
let rafId: number | null = null
let lastTs = 0

function rafLoop(ts: number) {
  if (!lastTs) lastTs = ts
  const delta = (ts - lastTs) / 1000
  lastTs = ts

  const movePx = SPEED * delta

  // Двигаем все
  for (let i = 0; i < actives.value.length; i++) {
    actives.value[i]!.x -= movePx
  }

  // Удаляем те, которые полностью вышли (с небольшим буфером)
  while (actives.value.length > 0) {
    const first = actives.value[0]
    if (first!.x + first!.width < -REMOVE_BUFFER) {
      // убираем реф и сдвигаем массив
      actives.value.shift()
    } else {
      break
    }
  }

  // Пытаемся спавнить новые (может спавнить несколько, но measurement блокирует конкуренцию)
  // Важно: не await здесь — measurement выполняется асинхронно, но флаг measuring защитит от гонок.
  let guard = 0
  while (guard < 6) { // лимит, чтобы не заблокировать цикл
    trySpawnOnce()
    // trySpawnOnce может вернуть Promise<boolean> — но мы не ждём; проверка measuring предотвратит многократный spawn
    // Если trySpawnOnce синхронно вернёт false — значит нет места; тогда прервём попытки.
    // Но trySpawnOnce возвращает Promise, поэтому проверяем measuring/queue length next iteration.
    // Простейшее правило: прерываем, если measuring или нет очереди или last не даёт места.
    if (measuring) break
    if (queue.value.length === 0) break
    // пробуем ещё раз (возможно после предыдущ измерения освободилось место)
    guard++
    // small break to let measurement finish across ticks — избегаем busy loop
    if (guard > 1) break
  }

  rafId = requestAnimationFrame(rafLoop)
}

// SSE: слушаем события и пушим в очередь
onMounted(() => {
  rafId = requestAnimationFrame(rafLoop)

  const es = new EventSource('/sse/chat')
  es.addEventListener('open', () => console.log('Connected to /sse/chat'))
  es.addEventListener('error', (err) => console.error('SSE error', err))
  es.addEventListener('chat_message', (e) => {
    try {
      const msg = JSON.parse(e.data) as ChatMessage
      if (!msg.id) msg.id = crypto.randomUUID()
      queue.value.push(msg)
      // попробуем запустить спавн (не await)
      trySpawnOnce()
    } catch (err) {
      console.error('Bad SSE message', err)
    }
  })

  const onResize = () => {
    // при ресайзе возможно появилось место
    trySpawnOnce()
  }
  window.addEventListener('resize', onResize)

  onUnmounted(() => {
    es.close()
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
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
  height: 24px;
  overflow: hidden;
  background: transparent;
}

.message {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  font-size: 20px;
  font-weight: 600;
}

.message-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  border-radius: 6px;
  z-index: 0;
}

.user, .text {
  position: relative;
  z-index: 1;
}

.user { margin-left: 10px; }
.text { color: #ffffff; margin-right: 10px; }

.ticker, .message, .user, .text {
  font-family: 'Roboto Mono', monospace;
}
</style>
