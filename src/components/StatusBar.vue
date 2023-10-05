<script setup lang="ts">
import { computed } from 'vue';
import { getNoteFromHz } from '../note-detection';

const { hz } = defineProps<{ hz?: number }>()

const result = computed(() =>
    hz == undefined ? undefined : getNoteFromHz(hz)
)

</script>

<template>
    <div class="status-bar">
        <div>Frequency: <span v-if="hz != undefined">{{ hz }} hz</span></div>
        <div>Octave: <span>{{ result?.octave }}</span></div>
        <div>Note: <span>{{ result?.note }}</span></div>
        <div>Deviation: <span>{{ result?.delta }}</span></div>
    </div>
</template>

<style scoped>
.status-bar {
    width: 100%;
    height: 15%;
}
</style>
