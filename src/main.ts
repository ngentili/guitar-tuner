import './main.css'
import { NoteMatch, frequencyToNoteName } from './notes'

const nbsp ='\u00A0'

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => run(stream))

function run(stream: MediaStream) {
    //
    // html
    //
    const freqStatus = document.getElementById('freq')!
    const noteStatus = document.getElementById('note')!
    const devStatus = document.getElementById('deviation')!

    const tunerMiddle = document.getElementById('tuner-indicator')! as HTMLElement

    const spectrum = document.getElementById('spectrum')! as HTMLCanvasElement
    const spectrumCtx = spectrum.getContext('2d')!

    //
    // status
    //
    function updateStatus(freq: number, noteMatch: NoteMatch) {
        freqStatus.innerHTML = `${freq.toFixed().padStart(3, nbsp)} hz`
        noteStatus.innerHTML = noteMatch.note
        devStatus.innerHTML = noteMatch.deviation.toFixed(1).replace(/^[^-]/, txt => '+' + txt)
    }

    //
    // tuner
    //
    function updateTuner(deviationInSemitones: number) {
        let lineWidth = tunerMiddle.clientWidth

        let leftPercent = Math.round(deviationInSemitones * 100) + 50
        let halfLineWidth = (lineWidth / 2).toFixed(1)

        tunerMiddle.style.left = `calc(${leftPercent}% - ${halfLineWidth}px)`
    }

    //
    // spectrum
    //
    let audioContext = new AudioContext()

    let source = audioContext.createMediaStreamSource(stream)

    let analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    let frequencies = Array.from({ length: analyser.frequencyBinCount },
        (_, i) => (i + 1) * (audioContext.sampleRate / 2) / analyser.frequencyBinCount)

    source.connect(analyser)

    let bufferLength = analyser.frequencyBinCount
    let freqData = new Uint8Array(bufferLength)

    let lastXFreqs: number[] = []
    let freqCount = 100

    function draw(c: CanvasRenderingContext2D) {
        requestAnimationFrame(() => draw(c))

        let barWidth = c.canvas.width / bufferLength

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

        lastXFreqs.push(maxFreq)

        if (lastXFreqs.length > freqCount) {
            lastXFreqs.shift()
        }

        let freqSum = lastXFreqs.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        let freqAvg = freqSum / lastXFreqs.length

        let noteMatch = frequencyToNoteName(freqAvg)

        updateStatus(freqAvg, noteMatch)
        updateTuner(noteMatch.deviation)
    }

    requestAnimationFrame(() => draw(spectrumCtx))
}
