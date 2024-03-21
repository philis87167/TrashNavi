import { api } from 'src/boot/axios'
import { defineStore } from 'pinia';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Notify } from 'quasar';

export const useMainStore = defineStore('main', {
    state: () => ({
        _map: null,
        _route: null,
        _actRoute: null,
        _dir: 'car',
        _grasshoperApi: "7d361359-5141-481a-a887-07bc4f4a8161",
        _target: {},
        _marker: {
            green: new L.Icon({
                iconUrl: 'src/css/marker/marker-icon-2x-green.png',
                shadowUrl: 'src/css/marker/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }),
            red: new L.Icon({
                iconUrl: 'src/css/marker/marker-icon-2x-red.png',
                shadowUrl: 'src/css/marker/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }
    }),
    getters: {

    },
    actions: {
        async getRoute({coords, form, status}) {

            const start = [ coords.longitude, coords.latitude ]
            let targetGeoCode = { data: { hits: [] } }
            let target = null
            let waypoints = [
                start
            ]
            //standart Navigation
            if (!status) {
                const targetString = `${form.street || ''},${form.zip || ''} ${form.city || ''}`
                const targetGeoCode = await api.get(`https://graphhopper.com/api/1/geocode?q=${targetString}&locale=de&key=${this._grasshoperApi}`)
                target = [targetGeoCode.data.hits[0].point.lng, targetGeoCode.data.hits[0].point.lat]
                waypoints.push(target)
            }

            //Waste Basket Navigation
            if ( status === 'target' ) {
                target = [form[0], form[1]]
                form = { street: 'Waste Basket'}
                waypoints.push(target)
            }

            //Between Navigation
            if ( status === 'between' ) {
                target = [form[0], form[1]]
                waypoints.push(this._waypoints[0])
                waypoints.push(target)
                waypoints.push(this._waypoints[1])
            }

            this._waypoints = waypoints

            if (target) {

                if (status !== 'between'    )
                    this.setAdress(form)

                const waypointsMarker = this._waypoints.map(item => {
                    return L.latLng(item[1], item[0])
                })
                
                const res = await api({
                    method: 'POST',
                    url: `https://graphhopper.com/api/1/route?key=${this._grasshoperApi}`,
                    data: {
                        points: waypoints,
                        profile: this._dir,
                        locale: 'de'
                    }
                })

                let that = this;

                if ( this._actRoute ) {
                    this._map.removeControl(this._actRoute);
                    this._actRoute = null;
                }
                this._actRoute = L.Routing.control({
                    waypoints: waypointsMarker,
                    createMarker: function(i, wp, nWps) {
                        if (i === 0) {
                          // here change the starting and ending icons
                          return L.marker(wp.latLng, {
                            icon: that._marker.green // here pass the custom marker icon instance
                          });
                        } else {
                          // here change all the others
                          return L.marker(wp.latLng, {
                            icon: that._marker.red
                          });
                        }
                      }
                }).addTo(this._map);

                if (res.data && res.data.paths && res.data.paths[0] && res.data.paths[0].instructions)
                    this._route = res.data.paths[0].instructions
            } else {
                Notify.create({
                    message: 'Adresse nicht gefunden',
                    color: 'red',
                    icon: 'error',
                    position: 'top-right'
                })


            }
        },
        async setAdress(form) {
            this._target = form
        },
        closeNavigation () {
            if (this._actRoute) {
                this._map.removeControl(this._actRoute);
                this._actRoute = null;
            }

            this._route = null
            this._waypoints = null
        }
    },
})
