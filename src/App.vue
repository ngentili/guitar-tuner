<script setup lang="ts">
import { FrequencyGraph, OscilloscopeGraph, StatusBar } from './components'
import { onMounted, ref } from 'vue'
import pitchfinder from 'pitchfinder'

const hz = ref<number>()
const minDecibels = ref<number>()
const maxDecibels = ref<number>()
const freqArray = ref<number[]>()
const timeArray = ref<number[]>()

onMounted(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => run(stream))
})

function run(stream: MediaStream) {
    const audioContext = new AudioContext()

    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    minDecibels.value = analyser.minDecibels
    maxDecibels.value = analyser.maxDecibels

    const amdf = pitchfinder.AMDF({
        sampleRate: audioContext.sampleRate,
        minFrequency: 20,
        maxFrequency: 20000
    })

    let source = audioContext.createMediaStreamSource(stream)

    source.connect(analyser)

    let freqBufferLength = analyser.frequencyBinCount
    let freqDomainData = new Float32Array(freqBufferLength)

    let magBufferLength = analyser.fftSize
    let timeDomainData = new Float32Array(magBufferLength)

    function draw() {
        requestAnimationFrame(draw)

        // get current audio data
        analyser.getFloatFrequencyData(freqDomainData)
        analyser.getFloatTimeDomainData(timeDomainData)

        freqArray.value = Array.from(freqDomainData)
        timeArray.value = Array.from(timeDomainData)

        // analyze
        let detectedHz = amdf(timeDomainData) ?? undefined

        if (detectedHz != undefined) {
            detectedHz = Math.round(detectedHz)
        }

        if (detectedHz == undefined || detectedHz <= 0 || detectedHz >= (audioContext.sampleRate / 2)) {
            return
        }

        hz.value = detectedHz
    }

    requestAnimationFrame(draw)
}

</script>

<template>
    <StatusBar :hz="hz" />
    <FrequencyGraph :freqArray="freqArray" :min-decibels="minDecibels" :max-decibels="maxDecibels" />
    <OscilloscopeGraph :timeArray="timeArray" />
</template>

<style></style>
