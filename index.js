const React = require('react');
const ReactDOM = require('react-dom');
const L = require('leaflet');
const zingchart = require('zingchart');
const config = require('./chartConfig.js').default;
require('leaflet-draw');
require('whatwg-fetch');


let Container = {};

let leafletMap;

const MyCustomMarker = L.Icon.extend({
    options: {
        shadowUrl: null,
        iconAnchor: new L.Point(12, 12),
        iconSize: new L.Point(24, 24),
        iconUrl: 'static/map-marker-blue.png'
    }
});

let renderChart = function(center, coordinates){
    let el = document.getElementById('chart');
    for (child of el.children) {
        child.remove();
    }

    let values = [];
    coordinates.forEach(latLng => {
        let point = latLng[latLng.length - 1];
        values.push(center.distanceTo(point));
    });
    config.series = [{
        "values": values,
        "background-color": "#E80C60",
        "line-color":"#E80C60"
    }];

    try{
        zingchart.render({ 
            id : 'chart', 
            data : config, 
            height: '100%', 
            width: '100%'
        });
    } catch(e) {
        alert('Произошла ошибка, пожалуйста повторите.');
        console.log(e);
    }
}

let run = function(latLng, elevation) {
    let samples = 20;
    let radius = 10;
    let lat = latLng.lat;
    let lng = latLng.lng;

    fetch(`/elevation?samples=${samples}&lat=${lat}&lng=${lng}&radius=${radius}`)
    .then(response => {
        return response.text();
    })
    .then(result => {
        let coordinates = JSON.parse(result).coordinates;
        // let coordinates = require('./data.js').default.coordinates;
        let polygon_coords;
        polygon_coords = coordinates.map(sectorData => {
            return sectorData[sectorData.length - 1].location;
        }); 
        this.polygon = L.polygon(polygon_coords);
        Container.drawnItems.addLayer(this.polygon);

        let distanceSet;
        distanceSet = coordinates.map(sectorData => {
            return sectorData.map(dot => {
                    return latLng.distanceTo(dot.location);
            })
        });
        let chartData = coordinates.map(sectorData => {
            let first = sectorData[0];
            // let last = sectorData[sectorData.length - 1];
            // let delta = Math.abs(first.elevation - last.elevation) / samples;
            let delta = Math.abs(first.elevation - elevation) / samples;
            let newSet = [first];
            for (let i = 1; i < samples; i++){
                let nextValue = newSet[i - 1].elevation + delta;
                if (nextValue < sectorData[i].elevation) {
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
        renderChart(latLng, chartLocations);
    });
}


class Map extends React.Component {
    constructor(props){
        super(props);
        this.accessToken = 'pk.eyJ1IjoiZGVubnk1MzEiLCJhIjoiY2l3NHhlbjkwMDAwcTJ0bzRzc3p0bmNxaCJ9.QG39g1_q4GANnTPVIizKEg';
        
        Container.drawnItems = new L.FeatureGroup();
        
        let options = {
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
                featureGroup: Container.drawnItems
            }
        };

        this.drawControl = new L.Control.Draw(options);
        this.tile = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    }
    componentDidMount(){
        leafletMap = new L.Map('map-root', {
            zoom: 12,
            zoomAnimation: false,
            zoomControl: false
        }).setView([47.25033915108796, 39.70733642578125], 13);
        L.control.zoom({
            position:'topright'
        }).addTo(leafletMap);

        this.tile.addTo(leafletMap);
        leafletMap.addLayer(Container.drawnItems);
        leafletMap.addControl(this.drawControl);

        leafletMap.on('draw:created', (e) => {
            Container.drawnItems.clearLayers();
            Container.drawnItems.addLayer(e.layer);
            let latLng = e.layer.getLatLng();
            run(latLng, 0);
        });
    }
    render(){
        return <div id="map"></div>
    }
};

class Ui extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            // elevation: 0
        };
    }
    setData(e){
        this.state[e.target.name] = Number(e.target.value);
    }
    chart(e){
        let lat = this.state.lat;
        let lng = this.state.lng;
        if (lat && lng) {
            Container.drawnItems.clearLayers();
            let marker = L.marker([lat, lng],  {icon: new MyCustomMarker()}).addTo(Container.drawnItems);
            let latlng = marker.getLatLng();
            run(latlng, this.state.elevation | 0);
        } else {
            alert('Укажите координаты или установите маркер с помощью контроллера в правом верхнем углу');
        }
    }
    render() {
        return (<div className="ui">
            <label>Координаты</label>
            <input type="number" name="lat" onChange={this.setData.bind(this)} placeholder="Широта" value={this.state.lat}></input>
            <input type="number" onChange={this.setData.bind(this)} name="lng" placeholder="Долгота" value={this.state.lng}></input>
            
            <label>Начальная высота приемного обьекта</label>
            <input type="number" name="elevation" placeholder="0" onChange={this.setData.bind(this)} value={this.state.elevation}></input>

            <button onClick={this.chart.bind(this)}>Построить диаграмму</button>
        </div>);
    }
}

ReactDOM.render(<Map/>, document.getElementById('map-root'));
ReactDOM.render(<Ui className="ui"/>, document.getElementById('ui-root'));
