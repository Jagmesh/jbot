<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import LogPanel from "./LogPanel.vue";
import {useLocalStorageNumber} from "../composables/useLocalStorageNumber.ts";
import {calculateAudioSpeed} from "../utils/utils.ts";

type PlayEventPayload = { url: string };
type LogEntry = { text: string; type: "error" | "info" };

let es: EventSource | null = null;

const SSE_EVENTS_PATH = '/sse/audio'
const PLAY_AUDIO_EVENT = 'play_audio'

const enabled = ref(false);
const playing = ref(false);
const queue = ref<string[]>([]);
const logs = ref<LogEntry[]>([]);

const volume = useLocalStorageNumber("jbot_audio_volume", 1, {min: 0, max: 1});
const volumePercent = computed(() => `${Math.round(volume.value * 100)}%`);

function log(msg: string, type: LogEntry["type"] = "info") {
  const ts = new Date().toISOString().slice(11, 19);
  logs.value.push({text: `[${ts}] ${msg}`, type})
  if (logs.value.length > 300) logs.value.splice(0, logs.value.length - 300);
}

async function playUrl(url: string) {
  const audio = new Audio(url);
  await new Promise<void>((resolve, reject) => {
    audio.addEventListener("loadedmetadata", () => {
     const rate = calculateAudioSpeed(audio.duration);
     console.log(`Dur: ${audio.duration}, Rate: ${rate}`)
     audio.playbackRate = rate;
    }, { once: true });
    audio.addEventListener("canplay", () => resolve(), { once: true });
    audio.addEventListener("error", () => reject(new Error("Audio error")), {once: true});
    audio.load();
  })
  audio.volume = volume.value;

  log(`Playing: ${url}. ` +
      `Playback speed: ${audio.playbackRate.toFixed(2)}x. ` +
      `Volume: ${audio.volume.toFixed(2)}x`
  );

  await new Promise<void>((resolve, reject) => {
    audio.addEventListener("ended", () => resolve(), {once: true});
    audio.play().catch(reject);
  });

  log(`Ended: ${url}`);
}

async function pump() {
  if (!enabled.value || playing.value) return;
  const url = queue.value.shift();
  if (!url) return;

  playing.value = true;
  try {
    await playUrl(url);
  } catch (e: any) {
    log(`Failed: ${url} (${e?.message ?? String(e)})`);
  } finally {
    playing.value = false;
    pump();
  }
}

onMounted(() => {
  es = new EventSource(SSE_EVENTS_PATH);

  es.addEventListener("open", () => log(`Connected to ${SSE_EVENTS_PATH}`));
  es.addEventListener("error", () => log("SSE error (reconnecting...)", 'error'));

  es.addEventListener(PLAY_AUDIO_EVENT, (ev) => {
    const data = JSON.parse((ev as MessageEvent).data) as PlayEventPayload;
    queue.value.push(data.url);
    log(`Enqueued: ${data.url}`);
    pump();
  });
});

onBeforeUnmount(() => {
  es?.close();
  es = null;
});

function enableAudio() {
  enabled.value = true;
  log("Audio enabled");
  pump();
}
</script>

<template>
  <div>
    <p>
      1) Нажми <b>Enable audio</b> один раз (иначе браузер блокирует автоплей).<br />
      2) Держи вкладку открытой.
    </p>

    <div class="controls">
      <button @click="enableAudio">Enable audio</button>

      <label class="muted" for="volume">
        Volume: <span>{{ volumePercent }}</span>
      </label>

      <input
          id="volume"
          type="range"
          min="0"
          max="100"
          step="1"
          :value="Math.round(volume * 100)"
          @input="volume = Number(($event.target as HTMLInputElement).value) / 100"
      />
    </div>

    <LogPanel :logs="logs" />
  </div>
</template>

<style scoped>
.controls { display: flex; align-items: center; gap: 12px; margin: 12px 0; flex-wrap: wrap; }
button { padding: 10px 14px; font-size: 14px; }
.controls input[type="range"] { width: 260px; }
.muted { opacity: 0.7; }
</style>