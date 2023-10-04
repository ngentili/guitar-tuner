import './main.css'
import { NoteDetectionResult, findNote } from './note-detection'
import pitchfinder from 'pitchfinder'

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => run(stream))

function run(stream: MediaStream) {
    //
    // html
    //
    const freqStatus = document.getElementById('freq')!
    const noteStatus = document.getElementById('note')!
    const devStatus = document.getElementById('deviation')!

    const tunerIndicator = document.getElementById('tuner-indicator')! as HTMLElement

    const graphContainer = document.getElementById('graph-container')!

    const spectrum = document.getElementById('spectrum')! as HTMLCanvasElement
    const spectrumCtx = spectrum.getContext('2d')!

    const oscilloscope = document.getElementById('oscilloscope')! as HTMLCanvasElement
    const oscilloscopeCtx = oscilloscope.getContext('2d')!

    window.addEventListener('resize', e => {
        let h = graphContainer.clientHeight
        let w = graphContainer.clientWidth

        spectrum.height = h
        spectrum.width = w

        oscilloscope.height = h
        oscilloscope.width = w
    })

    //
    // status
    //
    function updateStatus(hz: number, noteResult: NoteDetectionResult) {
        const nbsp = '\u00A0'

        freqStatus.innerHTML = `${hz.toFixed().padStart(3, nbsp)} hz`
        noteStatus.innerHTML = noteResult.note
        devStatus.innerHTML = noteResult.semitones.toFixed(1).replace(/^[^-]/, txt => '+' + txt)
    }

    //
    // tuner
    //
    function updateTuner(semitones: number) {
        let lineWidth = tunerIndicator.clientWidth

        let leftPercent = Math.round(semitones * 100) + 50
        let halfLineWidth = (lineWidth / 2).toFixed(1)

        tunerIndicator.style.left = `calc(${leftPercent}% - ${halfLineWidth}px)`
    }

    //
    // spectrum
    //
    function updateSpectrum() {
        let c = spectrumCtx

        let barWidth = c.canvas.width / freqBufferLength

        // draw spectrum
        c.fillStyle = 'rgb(0, 0, 0)'
        c.fillRect(0, 0, c.canvas.width, c.canvas.height)

        c.fillStyle = 'rgb(255, 0, 0)'

        for (let i = 0; i < freqDomainData.length; i++) {
            // let hz = frequencies[i]
            let db = freqDomainData[i]

            const fraction = (db - analyser.minDecibels) / (analyser.maxDecibels - analyser.minDecibels)

            let barHeight = fraction * c.canvas.height
            c.fillRect(i * (c.canvas.width / freqDomainData.length), c.canvas.height, barWidth, -barHeight)
        }
    }

    //
    // oscilloscope
    //
    function updateOscilloscope() {
        let c = oscilloscopeCtx

        c.fillStyle = 'rgb(200, 200, 200)'
        c.fillRect(0, 0, c.canvas.width, c.canvas.height)

        c.lineWidth = 2
        c.strokeStyle = 'rgb(0, 0, 0)'

        const sliceWidth = (c.canvas.width * 1.0) / magBufferLength
        let x = 0

        c.beginPath()
        for (let i = 0; i < magBufferLength; i++) {
            const v = timeDomainData[i] / 128.0
            const y = (v * c.canvas.height) / 2

            if (i === 0) {
                c.moveTo(x, y)
            } else {
                c.lineTo(x, y)
            }

            x += sliceWidth
        }

        c.lineTo(c.canvas.width, c.canvas.height / 2)
        c.stroke()
    }

    function calculateHPS(spectrum: Float32Array, sampleRate: number, fftSize: number): number {

        // Step 2: Initialize the Harmonic Product Spectrum (HPS)
        const hps = new Array(spectrum.length).fill(1.0);

        // Step 3: Calculate the HPS
        for (let harmonic = 2; harmonic <= 4; harmonic++) {
            const hpsIndex = Math.floor(harmonic * (spectrum.length / fftSize));

            for (let i = hpsIndex; i < spectrum.length; i++) {
                hps[i] *= spectrum[i];
            }
        }

        // Step 4: Find the peak in the HPS
        let maxHPSValue = 0;
        let maxHPSIndex = 0;

        for (let i = 0; i < hps.length; i++) {
            if (hps[i] > maxHPSValue) {
                maxHPSValue = hps[i];
                maxHPSIndex = i;
            }
        }

        // Step 5: Calculate the fundamental frequency
        const fundamentalFrequency = (sampleRate / fftSize) * maxHPSIndex;

        return fundamentalFrequency;
    }

    function findMaxFreq(freqDomainData: Float32Array) {
        let maxDb = -Infinity
        let hz = 0

        for (let i = 0; i < freqDomainData.length; i++) {
            const db = freqDomainData[i]
            if (db > maxDb) {
                maxDb = db
                hz = frequencies[i]
            }
        }

        return hz
    }

    let audioContext = new AudioContext()

    let source = audioContext.createMediaStreamSource(stream)

    let analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    let frequencies = Array.from({ length: analyser.frequencyBinCount },
        (_, i) => (i + 1) * (audioContext.sampleRate / 2) / analyser.frequencyBinCount)

    source.connect(analyser)

    let freqBufferLength = analyser.frequencyBinCount
    let freqDomainData = new Float32Array(freqBufferLength)

    let magBufferLength = analyser.fftSize
    let timeDomainData = new Float32Array(magBufferLength)

    const yin = pitchfinder.YIN({ sampleRate: audioContext.sampleRate })
    const amdf = pitchfinder.AMDF({ sampleRate: audioContext.sampleRate, minFrequency: 20, maxFrequency: 20000 })

    function draw() {
        requestAnimationFrame(draw)

        // get current audio data
        analyser.getFloatFrequencyData(freqDomainData)
        analyser.getFloatTimeDomainData(timeDomainData)

        // let hz = yin(timeDomainData)
        // let hz = amdf(timeDomainData)
        // let hz = calculateHPS(freqDomainData, audioContext.sampleRate, analyser.fftSize)
        let hz = findMaxFreq(freqDomainData)

        let noteResult = findNote(hz)

        updateStatus(hz, noteResult)
        updateTuner(noteResult.semitones)
        updateSpectrum()
        updateOscilloscope()

        console.log(hz)
    }

    requestAnimationFrame(draw)
}
