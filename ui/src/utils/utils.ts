export function calculateAudioSpeed(duration: number): number {
    return 1 + (duration / 100) * 3;
}