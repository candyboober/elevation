'use strict';

define(
    ['leaflet'],
    function(L) {
        var current_point_dist = 0;
        var srtmLineValues;
        var axValues;

        var calcAzimuth = function(llat1, llong1, llat2, llong2) {
            var rad = 6372795,
                pi = Math.PI,
                lat1 = llat1 * pi / 180,
                lat2 = llat2 * pi / 180,
                long1 = llong1 * pi / 180,
                long2 = llong2 * pi / 180,
                cl1 = Math.cos(lat1),
                cl2 = Math.cos(lat2),
                sl1 = Math.sin(lat1),
                sl2 = Math.sin(lat2),
                delta = long2 - long1,
                cdelta = Math.cos(delta),
                sdelta = Math.sin(delta),
                x,
                y,
                z,
                z2,
                ad,
                anglerad2,
                angledeg;
            var Degrees = function(radians) {
                return radians * 180 / Math.PI;
            }
            var Radians = function(degrees) {
                return degrees * Math.PI / 180;
            }

            x = (cl1 * sl2) - (sl1 * cl2 * cdelta);
            y = sdelta * cl2;
            z = Degrees(Math.atan(-y / x));

            if (x < 0) {
                z = z + 180;
            }

            z2 = (z + 180) % 360 - 180;
            z2 = -Radians(z2);
            anglerad2 = z2 - ((2 * Math.PI) * Math.floor((z2 / (2 * Math.PI))));
            angledeg = (anglerad2 * 180) / Math.PI;

            return angledeg;
        };

        function getRefraktAndEarthCurveCorrection(k, distance, dist) {
            var a = 6371000, //Радиус Земли, м
                Re = +k * a, // Эквивалентный радиус земли (м), с учетом коэффициент эквивалентного радиуса Земли - k. 
                yi = 0, // Искомое значение изменения высоты, для точки на расстоянии d от первой станции для длины пути - distance 
                R = +distance * 1000, // Длина всего пути м
                d = +dist * 1000, // Длина пути до точки м
                c = d / R;

            yi = ((R * R) / (2 * Re)) * c * (1 - c); // м

            return yi;
        };

        function isIntersected(a1, a2, b1, b2) {
            var d = (a1.x - a2.x) * (b2.y - b1.y) - (a1.y - a2.y) * (b2.x - b1.x);
            var da = (a1.x - b1.x) * (b2.y - b1.y) - (a1.y - b1.y) * (b2.x - b1.x);
            var db = (a1.x - a2.x) * (a1.y - b1.y) - (a1.y - a2.y) * (a1.x - b1.x);
            if (d == 0) {
                return false;
            }
            var ta = da / d;
            var tb = db / d;
            if (0 <= ta && ta <= 1 && 0 <= tb && tb <= 1) {
                var cx = a1.x + ta * (a2.x - a1.x);
                var cy = a1.y + ta * (a2.y - a1.y);
                var c = {
                    x: cx,
                    y: cy
                };
                return c;
            } else return false;
        };

        function getIntersectedAreas_arr(line_values, AxisValues) {
            var intersect_arr = [], // хранит точки пересечений
                length = AxisValues.length,
                val = {},
                inter_area_poi = [], // массив точек, по которым задана пересекаемая область.
                inter_areas_arr = []; // Массив массивов, каждая область при построении графика должна быть уникальной серией. парсится в функции srtmCreateChart

            for (var i = 1, max = AxisValues.length; i < max; i++) {
                val = isIntersected(line_values[0], line_values[1], AxisValues[i - 1], AxisValues[i]); // возвращает координаты(дистанция, высота) точек пересечения    
                if (val !== false) {
                    intersect_arr.push(val);
                }
            }

            for (var i = 0, max_i = intersect_arr.length; i < max_i; i++) {
                if (i % 2 == 1) {
                    inter_area_poi = [];
                    inter_area_poi.push(intersect_arr[i - 1]);
                    for (var j = 0, max_j = AxisValues.length; j < max_j; j++) {
                        if (AxisValues[j].x > intersect_arr[i - 1].x && AxisValues[j].x < intersect_arr[i].x) {
                            inter_area_poi.push(AxisValues[j]);
                        }
                    }
                    inter_area_poi.push(intersect_arr[i]);
                    inter_areas_arr.push(inter_area_poi);
                }
            }
            return inter_areas_arr;
        };

        function initCalc(json_resp, p1_added_elev, p2_added_elev, earthCurveChecked, k_curve) {
            var AxisValues = [],
                values = {},
                elev = '',
                dist = '',
                lat = '',
                lng = '',
                p_first,
                p_last,
                distance,
                line_values,
                latlng = [],
                inter_areas_arr = [],
                geojjson = {};
            if (typeof json_resp.response == 'string') {
                var seralize = JSON.parse(json_resp.response);
                var json = seralize.results;
            } else {
                var json = json_resp;
            }
            var p1 = json[0],
                p2 = json[json.length - 1],
                AxisMin = 0,
                AxisMax = 0,
                alt_arr = [],
                p1_llngs = [+p1.location.lat, +p1.location.lng],
                p2_llngs = [+p2.location.lat, +p2.location.lng];
            var azimuth1 = calcAzimuth(p1_llngs[0], p1_llngs[1], p2_llngs[0], p2_llngs[1]);
            var azimuth2 = calcAzimuth(p2_llngs[0], p2_llngs[1], p1_llngs[0], p1_llngs[1]);

            p_first = L.latLng(p1_llngs);
            p_last = L.latLng(p2_llngs);

            distance = +(p_first.distanceTo(p_last)) / 1000;

            line_values = [{
                x: 0,
                y: 0,
                added_elev: +p1_added_elev,
                y_base: +p1.elevation
            }, {
                x: distance,
                y: 0,
                added_elev: +p2_added_elev,
                y_base: +p2.elevation
            }];

            line_values[0].y = line_values[0].added_elev + line_values[0].y_base;
            line_values[1].y = line_values[1].added_elev + line_values[1].y_base;

            alt_arr.push(line_values[0].y, line_values[1].y);

            for (var i = 0, max = json.length; i < max; i++) {

                elev = +json[i].elevation;
                lat = +json[i].location.lat;
                lng = +json[i].location.lng;

                alt_arr.push(elev);
                latlng = L.latLng([lat, lng]);

                dist = (p_first.distanceTo(latlng)) / 1000;

                values = {
                    x: +dist,
                    y: 0,
                    lat: lat,
                    lng: lng,
                    y_base: +elev,
                    y_curve: 0,
                    added_elev: 0
                };

                if (earthCurveChecked === true) {
                    values.y_curve = +getRefraktAndEarthCurveCorrection(k_curve, distance, dist);
                    values.y = values.y_base + values.y_curve;
                } else {
                    values.y = values.y_base;
                }

                AxisValues.push(values);
            }

            inter_areas_arr = getIntersectedAreas_arr(line_values, AxisValues);

            var resDots = {
                AxisValues: AxisValues,
                line_values: line_values,
                inter_areas_arr: inter_areas_arr,
                azimuth1: azimuth1,
                azimuth2: azimuth2
            };
            return resDots;
        };

        return initCalc;
    }
);
