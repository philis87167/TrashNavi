<template>
    <q-page class="">
        <div class="row">
            <div :class="mainStore._route ? 'col-5' : 'col-12'" v-if="mainStore._route">
                <q-btn unelevated class="full-width" color="red-8" label="Navigation abbrechen" @click="mainStore.closeNavigation" />
                <div id="navigationHints">
                    <q-card class="my-card q-ma-xs shadow-1 q-pa-sm" v-for="(item, index) of mainStore._route" :key="index">
                        <div class="text-bold text-body1">in {{ formatDistance(item.distance) }}</div>
                        <div class="text-caption">{{ item.street_name }}</div>
                        {{ item.text }}
                    </q-card>
                </div>
            </div>
            <div :class="mainStore._route ? 'col-7' : 'col-12'">
                <div id="map" style="height:90vh"></div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import "leaflet/dist/leaflet.css"
import * as L from 'leaflet';
import {useMainStore} from 'src/stores/main.store'
import { format } from 'quasar';
const initialMap = ref(null);

const mainStore = useMainStore()

onMounted(()=> {
    initialMap.value = L.map('map', {
        zoomAnimation:false,
    }).setView([52.52437, 13.41053], 11);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, 
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(initialMap.value);
    
    mainStore._map = initialMap.value
});

function formatDistance(meter) {
    if (meter >= 1000) {
        var kilometer = meter / 1000;
        return kilometer.toFixed(2) + ' km';
    } else {
        return meter.toFixed(0) + ' m';
    }
}

</script>

<style scoped lang="scss">
    #map {
        width: 100%;
        height: 100%;
    }

    #navigationHints {
        height: 90vh;
        overflow-y: scroll;
    }
</style>
