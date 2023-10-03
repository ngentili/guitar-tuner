import './main.css'
import { NoteMatch, frequencyToNoteName } from './notes'

(async () => {
    //
    // html
    //
    const freqStatus = document.getElementById('freq')!
    const noteStatus = document.getElementById('note')!
    const devStatus = document.getElementById('deviation')!

    const tunerMiddle = document.getElementById('tuner-indicator')! as HTMLElement

    const spectrum = document.getElementById('spectrum')! as HTMLCanvasElement
    const spectrumCtx = spectrum.getContext('2d')!

    let stream: MediaStream
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    catch { return }

    //
    // status
    //
    function updateStatus(freq: number, noteMatch: NoteMatch) {
        freqStatus.innerHTML = `${freq.toFixed().padStart(3, '\u00A0')} HZ`
        noteStatus.innerHTML = noteMatch.note
        devStatus.innerHTML = noteMatch.deviation.toFixed(1).replace(/^[^-]/, txt => '+' + txt)
    }

    //
    // tuner
    //
    function updateTuner(noteMatch: NoteMatch) {
        let semitones = noteMatch.deviation

        let containerWidth = tunerMiddle.parentElement!.clientWidth
        let lineWidth = tunerMiddle.clientWidth



        // let left = 
        // let right = 

        // tunerLeft.style.flex = left
        // tunerRight.style.flex = right
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

    let last100Freqs: number[] = []

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

        last100Freqs.push(maxFreq)

        if (last100Freqs.length > 100) {
            last100Freqs.shift()
        }

        let freqSum = last100Freqs.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        let freqAvg = freqSum / last100Freqs.length

        let noteMatch = frequencyToNoteName(freqAvg)

        updateStatus(freqAvg, noteMatch)
        updateTuner(noteMatch)
    }

    requestAnimationFrame(() => draw(spectrumCtx))
})()
