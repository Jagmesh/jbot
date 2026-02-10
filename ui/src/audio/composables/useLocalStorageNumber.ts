import {ref, watch} from "vue";

export function useLocalStorageNumber(
    key: string,
    defaultValue: number,
    opts?: { min?: number; max?: number }
) {
    const clamp = (n: number) => {
        const min = opts?.min ?? -Infinity;
        const max = opts?.max ?? Infinity;
        return Math.min(max, Math.max(min, n));
    };

    const read = () => {
        const raw = localStorage.getItem(key);
        const n = raw === null ? defaultValue : Number(raw);
        return Number.isFinite(n) ? clamp(n) : clamp(defaultValue);
    };

    const state = ref<number>(read());

    watch(state, (v) => {
        localStorage.setItem(key, String(clamp(v)));
    });

    return state;
}