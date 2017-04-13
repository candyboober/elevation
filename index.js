const React = require('react');
const ReactDOM = require('react-dom');
const L = require('leaflet');
const zingchart = require('zingchart');
require('leaflet-draw');
require('whatwg-fetch');


class Map extends React.Component {
    constructor(props){
        super(props);
        this.accessToken = 'pk.eyJ1IjoiZGVubnk1MzEiLCJhIjoiY2l3NHhlbjkwMDAwcTJ0bzRzc3p0bmNxaCJ9.QG39g1_q4GANnTPVIizKEg';
        
        this.drawnItems = new L.FeatureGroup();
        var MyCustomMarker = L.Icon.extend({
            options: {
                shadowUrl: null,
                iconAnchor: new L.Point(12, 12),
                iconSize: new L.Point(24, 24),
                iconUrl: 'static/map-marker-blue.png'
            }
        });
        
        var options = {
            position: 'topright',
            draw: {
                polyline: false,
                polygon: false,
                circle: false,
                rectangle: false,
                marker: {
                    icon: new MyCustomMarker()
                }
            },
            edit: {
                featureGroup: this.drawnItems
            }
        };

        this.drawControl = new L.Control.Draw(options);
        this.tile = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
    componentDidMount(){
        this.map = new L.Map('map-root', {
            zoom: 12,
            zoomAnimation: false,
            zoomControl: false
        }).setView([47.25033915108796, 39.70733642578125], 13);
        L.control.zoom({
            position:'topright'
        }).addTo(this.map);

        this.tile.addTo(this.map);
        this.map.addLayer(this.drawnItems);
        this.map.addControl(this.drawControl);

        this.map.on('draw:created', e => {
            this.drawnItems.clearLayers();
            this.drawnItems.addLayer(e.layer);
            let latLng = e.layer.getLatLng();

            let samples = 20;
            let radius = 10;
            let lat = latLng.lat;
            let lng = latLng.lng;

            // fetch(`/elevation?samples=${samples}&lat=${lat}&lng=${lng}&radius=${radius}`)
            // .then(response => {
            //     return response.text();
            // })
            // .then(result => {
                // let coordinates = JSON.parse(result).coordinates;
                let coordinates = require('./data.js').default.coordinates;
                let polygon_coords;
                polygon_coords = coordinates.map(sectorData => {
                    return sectorData[sectorData.length - 1].location;
                });
                this.polygon = L.polygon(polygon_coords);
                this.drawnItems.addLayer(this.polygon);

                let distanceSet;
                distanceSet = coordinates.map(sectorData => {
                    return sectorData.map(dot => {
                        return latLng.distanceTo(dot.location);
                    })
                });
                let chartData = coordinates.map(sectorData => {
                    let first = sectorData[0];
                    let last = sectorData[sectorData.length - 1];
                    let delta = Math.abs(first.elevation - last.elevation) / samples;
                    let newSet = [first];
                    for (let i = 1; i < samples; i++){
                        let nextValue = newSet[i - 1].elevation + delta;
                        if (nextValue <= sectorData[i].elevation) {
                            break
                        }
                        newSet.push(sectorData[i]);
                    }
                    return newSet
                });
                let chartLocations = chartData.map(sectorData => {
                    let points = []
                    for (let point of sectorData){
                        if (point){
                            points.push(point.location);
                        }
                    }
                    return points;
                });
                this.renderChart(latLng, chartLocations);
            // });
        });
    }
    renderChart(center, coordinates){
        let config = {
            "backgroundColor":'#FBFCFE',
            "type": "radar",
            "plot": {
                "aspect": "area",
                "background-color": '#FBFCFE',
                "active-area": true
            },
            "plotarea":{
                "margin":'dynamic'
            },
            "scale-v": {
                "values": "0:10000:25",
                "labels": ["", "", "", "", ""],
                "ref-line": {
                    "line-color": "none"
                },
                "guide": {
                    "line-style": "solid",
                    "line-color":'#D7D8D9'
                }
            },
            "scale-k": {
                "values": "0:330:30",
                "format": "%v°",
                "aspect": "circle", //To set the chart shape to circular.
                "guide": {
                    "line-style": "solid",
                    "line-color" : "#1E5D9E",
                },
                "item": {
                    "padding": 5,
                    "font-color" : "#1E5D9E",
                    "font-family": 'Montserrat'
                },
            },
            "series": [
            {
                "values": [59, 30, 65, 34, 40, 33, 31, 90, 81, 70, 100, 28],
                "background-color": "#00BAF2",
                "line-color":"#00BAF2"
            }, 
            // {
            //     "values": [30, 100, 90, 99, 59, 34, 5, 3, 12, 15, 16, 75, 34],
            //     "background-color": "#E80C60",
            //     "line-color": "#E80C60"
            // }, 
            // {
            //     "values": [34, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30, 100],
            //     "backgroundColor": "#9B26AF",
            //     "lineColor": "#9B26AF"
            // }
            ]
        };
        let values = [];
        coordinates.forEach(latLng => {
            let point = latLng[latLng.length - 1];
            values.push(center.distanceTo(point));
        });
        config.series.push({
            "values": values,
            "background-color": "#E80C60",
            "line-color":"#E80C60"
        });

        zingchart.render({ 
            id : 'chart', 
            data : config, 
            height: '100%', 
            width: '100%'
        });
    }
    render(){
        return <div id="map"></div>
    }
};

ReactDOM.render(<Map/>, document.getElementById('map-root'));
