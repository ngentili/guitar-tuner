export interface NoteMatch {
    octave: number
    note: string
    deviation: number
}

const A4 = 440
const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

export function frequencyToNoteName(frequency: number): NoteMatch {
    let semitonesAboveA4 = 12 * (Math.log2(frequency) - Math.log2(A4))
    let noteIndex = Math.round(semitonesAboveA4)

    let deviationInSemitones = semitonesAboveA4 - noteIndex;

    let octave = Math.floor(noteIndex / 12)
    let note = noteNames.at(noteIndex % 12) || ''

    return {
        octave,
        note,
        deviation: deviationInSemitones,
    }
}
