import './main.css'
import { NoteDetectionResult, getNoteFromHz } from './note-detection'
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

    const spectrumIndicator = document.getElementById('spectrum-indicator')! as HTMLCanvasElement

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

    spectrum.addEventListener('mousemove', e => {
        let xFraction = e.clientX / spectrum.width
        let minFreq = 0
        let maxFreq = audioContext.sampleRate / 2
        let hz = Math.round(xFraction * (maxFreq - minFreq))
        spectrumIndicator.innerHTML = `${hz} hz`
    })

    spectrum.addEventListener('mouseout', e => { spectrumIndicator.innerHTML = '' })

    //
    // status
    //
    function updateStatus(hz: number | null, noteResult: NoteDetectionResult) {
        const nbsp = '\u00A0'

        if (hz) {
            freqStatus.innerHTML = `${hz.toFixed().padStart(3, nbsp)} hz`
            noteStatus.innerHTML = noteResult.note
            devStatus.innerHTML = noteResult.delta.toFixed(1).replace(/^[^-]/, txt => '+' + txt)
        }
        else {
            freqStatus.innerHTML = nbsp
            noteStatus.innerHTML = nbsp
            devStatus.innerHTML = nbsp
        }
    }

    //
    // tuner
    //
    function updateTuner(delta: number) {
        let lineWidth = tunerIndicator.clientWidth

        let leftPercent = Math.round(delta * 100) + 50
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
        c.fillStyle = 'black'
        c.fillRect(0, 0, c.canvas.width, c.canvas.height)

        let hueStep = 360 / freqDomainData.length;

        for (let i = 0; i < freqDomainData.length; i++) {
            let db = freqDomainData[i]

            let fraction = (db - analyser.minDecibels) / (analyser.maxDecibels - analyser.minDecibels)
            let barHeight = fraction * c.canvas.height

            let hue = i * hueStep;
            c.fillStyle = `hsl(${hue}, 100%, 50%)`

            c.fillRect(i * (c.canvas.width / freqDomainData.length), c.canvas.height, barWidth, -barHeight)
        }
    }

    //
    // oscilloscope
    //
    function updateOscilloscope() {
        let c = oscilloscopeCtx

        c.fillStyle = 'black'
        c.fillRect(0, 0, c.canvas.width, c.canvas.height)

        c.lineWidth = 2
        c.strokeStyle = 'white'

        const sliceWidth = (c.canvas.width * 1.0) / magBufferLength
        let x = 0

        c.beginPath()
        for (let i = 0; i < magBufferLength; i++) {
            const v = (timeDomainData[i] + 1) / 2
            const y = v * c.canvas.height

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

    let audioContext = new AudioContext()

    let source = audioContext.createMediaStreamSource(stream)

    let analyser = audioContext.createAnalyser()
    analyser.fftSize = 2048

    source.connect(analyser)

    let freqBufferLength = analyser.frequencyBinCount
    let freqDomainData = new Float32Array(freqBufferLength)

    let magBufferLength = analyser.fftSize
    let timeDomainData = new Float32Array(magBufferLength)

    const amdf = pitchfinder.AMDF({
        sampleRate: audioContext.sampleRate,
        minFrequency: 20,
        maxFrequency: 20000
    })

    function draw() {
        requestAnimationFrame(draw)

        // get current audio data
        analyser.getFloatFrequencyData(freqDomainData)
        analyser.getFloatTimeDomainData(timeDomainData)

        // analyze
        let hz = amdf(timeDomainData)

        if (hz && hz >= (audioContext.sampleRate / 2)) {
            hz = null
        }

        let note = getNoteFromHz(hz)

        // update canvases
        updateStatus(hz, note)
        updateTuner(note.delta)
        updateSpectrum()
        updateOscilloscope()
    }

    requestAnimationFrame(draw)
}
