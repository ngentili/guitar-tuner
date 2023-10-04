// export interface PitchDetectionResult {
//     success: boolean
//     octave: number
//     note: string
//     semitones: number // -0.5 to 0.5
//     hz: number
// }

const A4 = 440 // hz
const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']

// export function detectPitch(freqDomainData: Uint8Array, timeDomainData: Uint8Array): PitchDetectionResult {

//     let maxFreq = Math.max(...freqDomainData)

//     let avgMagnitude = (
//         timeDomainData
//             .map(tdd => tdd / 128)
//             .reduce((accum, curr) => accum + curr, 0)
//     ) / timeDomainData.length

//     let volumeThreshold = 0.667

//     if (avgMagnitude < volumeThreshold) {
//         return {
//             success: false,
//             note: '',
//             octave: 0,
//             semitones: 0,
//             hz: 0,
//         }
//     }

//     let semitonesAboveA4 = 12 * (Math.log2(maxFreq) - Math.log2(A4))
//     let noteIndex = Math.round(semitonesAboveA4)

//     let semitones = semitonesAboveA4 - noteIndex;

//     let octave = Math.floor(noteIndex / 12)
//     let note = noteNames.at(noteIndex % 12) || ''

//     return {
//         success: true,
//         note,
//         octave,
//         semitones,
//         hz: maxFreq,
//     }
// }

export interface NoteDetectionResult {
    success: boolean
    octave: number
    note: string
    semitones: number // -0.5 to 0.5
}

export function findNote(hz: number): NoteDetectionResult {

    if (hz == null || hz < 0) {
        return {
            success: false,
            note: '',
            octave: 0,
            semitones: 0,
        }
    }

    let semitonesAboveA4 = 12 * (Math.log2(hz) - Math.log2(A4))
    let noteIndex = Math.round(semitonesAboveA4)

    let semitones = semitonesAboveA4 - noteIndex;

    let octave = Math.floor(noteIndex / 12)
    let note = noteNames.at(noteIndex % 12) || ''

    return {
        success: true,
        note,
        octave,
        semitones,
    }
}
