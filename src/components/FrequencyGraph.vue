<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    freqArray?: number[]
    maxDecibels?: number
    minDecibels?: number
}>()

const spectrum = ref<HTMLCanvasElement | null>(null)
const spectrumCtx = computed(() => spectrum.value?.getContext('2d'))

watch(() => props.freqArray, () => {
    if (props.freqArray === undefined || props.maxDecibels === undefined || props.minDecibels === undefined) {
        return
    }

    let c = spectrumCtx.value!

    let barWidth = c.canvas.width / props.freqArray.length

    // draw spectrum
    c.fillStyle = 'black'
    c.fillRect(0, 0, c.canvas.width, c.canvas.height)

    let hueStep = 360 / props.freqArray.length;

    for (let i = 0; i < props.freqArray.length; i++) {
        let db = props.freqArray[i]

        let fraction = (db - props.minDecibels) / (props.maxDecibels - props.minDecibels)
        let barHeight = fraction * c.canvas.height

        let hue = i * hueStep;
        c.fillStyle = `hsl(${hue}, 100%, 50%)`

        c.fillRect(i * (c.canvas.width / props.freqArray.length), c.canvas.height, barWidth, -barHeight)
    }
})
</script>

<template>
    <canvas ref="spectrum"></canvas>
</template>

<style scoped></style>
