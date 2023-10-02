import './main.css'
import { frequencyToNoteName } from './notes'

const freq = document.getElementById('freq')
if (!freq) {
    throw new Error('Element not found')
}

const note = document.getElementById('note')
if (!note) {
    throw new Error('Element not found')
}

const deviation = document.getElementById('deviation')
if (!deviation) {
    throw new Error('Element not found')
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement | null
if (!canvas) {
    throw new Error('Element not found')
}

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const canvasCtx = canvas.getContext('2d')
if (!canvasCtx) {
    throw new Error('Could not get canvas context')
}

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {

        let audioContext = new AudioContext()

        let source = audioContext.createMediaStreamSource(stream)

        let analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048

        let frequencies = Array.from({ length: analyser.frequencyBinCount },
            (_, i) => (i + 1) * (audioContext.sampleRate / 2) / analyser.frequencyBinCount)

        source.connect(analyser)

        let bufferLength = analyser.frequencyBinCount
        let freqData = new Uint8Array(bufferLength)

        let barWidth = canvas.width / bufferLength

        function draw(c: CanvasRenderingContext2D) {
            requestAnimationFrame(() => draw(c))

            analyser.getByteFrequencyData(freqData)

            c.fillStyle = 'rgb(0, 0, 0)'
            c.fillRect(0, 0, c.canvas.width, c.canvas.height)

            c.fillStyle = 'rgb(255, 0, 0)'

            for (let i = 0; i < freqData.length; i++) {
                let hz = frequencies[i]
                let db = freqData[i]

                let barHeight = (db / 255) * c.canvas.height
                c.fillRect(i * (c.canvas.width / freqData.length), c.canvas.height, barWidth, -barHeight)
            }

            let maxFreq = Math.max(...freqData)

            let noteMatch = frequencyToNoteName(maxFreq)

            freq!.innerHTML = maxFreq.toString()
            note!.innerHTML = noteMatch.note
            freq!.innerHTML = noteMatch.deviation.toString()
        }

        requestAnimationFrame(() => draw(canvasCtx))
    })

