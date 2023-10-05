const A4 = 440 // hz
const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

export interface NoteDetectionResult {
    octave: number
    note: string
    delta: number // -0.5 to 0.5 semitones
}

export function getNoteFromHz(hz: number): NoteDetectionResult {
    let semitonesAboveA4 = 12 * (Math.log2(hz) - Math.log2(A4))
    let noteIndex = Math.round(semitonesAboveA4)

    let deltaSemitones = semitonesAboveA4 - noteIndex;

    let octave = Math.floor(noteIndex / 12)
    let note = noteNames.at(noteIndex % 12) || ''

    return {
        note,
        octave,
        delta: deltaSemitones,
    }
}
