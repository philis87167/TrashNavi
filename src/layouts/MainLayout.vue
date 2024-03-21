<template>
  <q-layout view="lHh Lpr lFf">
    <q-header unelevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Trashmap
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
        <q-list>
            <q-item-label header>
                Menü
            </q-item-label>
            <q-item
                clickable
                @click="setMyLocation"
            >
                <q-item-section>
                    <q-item-label>Mein Standort</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-icon name="near_me" color="red" />
                </q-item-section>
            </q-item>
            <q-item
                clickable
                @click="setShowTargetDialog"
            >
                <q-item-section>
                    <q-item-label>Ziel eingeben</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-icon name="map" color="primary" />
                </q-item-section>
            </q-item>
            <q-item
                v-if="mainStore._route"
            >
                <q-item-section>
                    <q-item-label class="text-bold q-mb-xs">Aktuelle Navigation <q-icon :name="`directions_${mainStore._dir}`" /></q-item-label>
                        {{ mainStore._target.street }}, 
                        {{ mainStore._target.zip }} 
                        {{ mainStore._target.city }}
                </q-item-section>
                <q-item-section side>
                    <q-icon name="place" color="green" />
                </q-item-section>
            </q-item>
        </q-list>
        <q-dialog v-model="showTargetDialog" persistent>
            <q-card style="width: 80%">
                <q-card-section class="row items-center">
                    <span class="q-ml-sm text-body1 text-bold">Ziel eingeben</span>
                </q-card-section>
                <q-card-section class="q-gutter-sm">
                    <q-btn :color="mainStore._dir === 'car' ? 'green' : 'primary'" round unelevated icon="directions_car" @click="setDirection('car')" />
                    <q-btn :color="mainStore._dir === 'bike' ? 'green' : 'primary'" round unelevated icon="directions_bike" @click="setDirection('bike')" />
                    <q-btn :color="mainStore._dir === 'walk' ? 'green' : 'primary'" round unelevated icon="directions_walk" @click="setDirection('walk')" />
                </q-card-section>
                <q-card-section class="row q-col-gutter-sm">
                    <q-input class="col-12" outlined stack-label v-model="form.street" label="Straße" />
                    <q-input class="col-12 col-sm-4" outlined stack-label v-model="form.zip" label="PLZ" />
                    <q-input class="col-12 col-sm-8" outlined stack-label v-model="form.city" label="Stadt" />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Abbrechen" color="red" v-close-popup />
                    <q-btn flat label="Übernehmen" color="primary" @click="navigate()" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <q-dialog v-model="showMarkerDialog" persistent>
            <q-card style="width: 80%">
                <q-card-section class="row items-center">
                    <span class="q-ml-sm text-body1 text-bold">PIO</span>
                </q-card-section>
                <q-card-section class="row q-col-gutter-sm">
                    <div class="col-6" v-if="mainStore._waypoints && mainStore._waypoints.length === 2">
                        <q-btn unelevated class="full-width" color="primary" label="Als Zwischenziel" @click="navigate('between')" />
                    </div>
                    <div class="col-6">
                        <q-btn unelevated class="full-width" color="primary" label="Als Ziel" @click="navigate('target')" />
                    </div>                
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Abbrechen" color="red" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { defineComponent, onMounted, ref } from 'vue'
import * as L from 'leaflet';
import {useMainStore} from 'src/stores/main.store'
import { useWasteBasketStore } from 'src/stores/wastebaskets.store';
import { Geolocation } from '@capacitor/geolocation';
import { useRouter } from 'vue-router';
import router from 'src/router';
import { Notify, Loading, QSpinnerRings, extend} from 'quasar';

const mainStore = useMainStore()
const wasteBasketStore = useWasteBasketStore()
const selectedWasteBasket = ref([])
const linksList = [
  {
    title: 'Ziel eingeben',
    caption: 'quasar.dev',
    icon: 'map',
    link: 'https://quasar.dev'
  }
]

const form = ref({
    street: 'Bahnhof Zoo',
    zip: '',
    city: 'Berlin'
})

const Router = useRouter()

const showTargetDialog = ref(false)
const showMarkerDialog = ref(false)

const leftDrawerOpen = ref(false)

function setShowTargetDialog () {
    showTargetDialog.value = true
}

function toggleLeftDrawer () {
    leftDrawerOpen.value = !leftDrawerOpen.value
}

async function navigate(status) {
    loading(true)
    await Geolocation.checkPermissions()
    const coords = await Geolocation.getCurrentPosition();
    showTargetDialog.value = false
    showMarkerDialog.value = false
    switch(status) {
        case 'target':
            mainStore.getRoute({coords: coords.coords, form: selectedWasteBasket.value, status})
            break;
        case 'between':
            mainStore.getRoute({coords: coords.coords, form: selectedWasteBasket.value, status})
            break;
        default: {
            
            if (coords?.coords) {
                mainStore.getRoute({coords: coords.coords, form: extend(true, {}, form.value, status)})
            } else {
                Notify.create({
                    message: 'Bitte erlaube den Zugriff auf deinen Standort',
                    color: 'red',
                    icon: 'error',
                    position: 'top-right'
                })
            }
        }
    }
    loading(false)
}

function loading (status) {
    if ( status )
        Loading.show({
            message: 'Daten werden geladen...',
            spinner: QSpinnerRings,
            spinnerColor: 'blue-3',
            spinnerSize: 250,
        })
    else
        Loading.hide()
}

let myLocation = null
async function setMyLocation () {
    loading(true)

    if (myLocation)
        mainStore._map.removeLayer(myLocation)
    
    const coordinates = await Geolocation.getCurrentPosition();

    if (coordinates?.coords) {
        const markerLayer = L.layerGroup()
        mainStore._map.setView([coordinates.coords.latitude, coordinates.coords.longitude], 11)
        myLocation = L.marker([coordinates.coords.latitude, coordinates.coords.longitude], {icon: mainStore._marker.green}).addTo(mainStore._map);
        markerLayer.addLayer(myLocation)
    } else {
        Notify.create({
            message: 'Bitte erlaube den Zugriff auf deinen Standort',
            color: 'red',
            icon: 'error',
            position: 'top-right'
        })
    }

    loading(false)
}

function setDirection(dir) {
    mainStore._dir = dir
}

onMounted(()=> {
    wasteBasketStore._data.elements.forEach((item) => {
        L.marker([item.lat, item.lon]).bindPopup("Waste Basket").on('click', () => {
            selectedWasteBasket.value = [item.lon, item.lat]
            
            showMarkerDialog.value = true
        }).addTo(mainStore._map)
    })
});
</script>
