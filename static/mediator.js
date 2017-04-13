define([
    './srtm-view',
    './srtm-polyline',
    'map',
    './srtm-calc',
    './srtm-chart',
    'pile',
    './model',
    './srtm-frenel',
    './srtm-info',
    'app'
], function(SrtmView, Polyline, map, initCalc, chartSrtm, Pile, SrtmModel, getFrenelValues, InfoView, App) {
    'use strict';

    var featureGroup = new L.FeatureGroup();
    var Mediator = {
        enable: function() {
            this.srtmView = new SrtmView({
                model: new SrtmModel()
            });
            var srtmView = this.srtmView;
            var _this = this;

            // App.menu.hide();

            Pile.addView(srtmView, true, true);

            featureGroup.addTo(map);

            srtmView.on('drawLine', function() {
                var polyline = new Polyline(map, featureGroup);
                polyline.enable();
                // polyline.on('draw:srtmfinishdraw', function(e) {

                // });
            });

            srtmView.on('setCoord', function() {
                if (srtmView.model.get('firstLatlng') != "" || srtmView.model.get('lastLatlng') != "") {
                    map.fire('editDisable');
                    srtmView.setData();
                    var temp = srtmView.model.get('firstLatlng').split(',');
                    var p1 = {
                        lat: parseFloat(temp[0]),
                        lng: parseFloat(temp[1])
                    };
                    temp = srtmView.model.get('lastLatlng').split(',');
                    var p2 = {
                        lat: parseFloat(temp[0]),
                        lng: parseFloat(temp[1])
                    };
                    srtmView.model.set({
                        p1: p1,
                        p2: p2,
                        firstLatlng: String(p1.lat) + ',' + String(p1.lng),
                        lastLatlng: String(p2.lat) + ',' + String(p2.lng)
                    });

                    var ll1 = L.latLng(p1.lat, p1.lng);
                    var ll2 = L.latLng(p2.lat, p2.lng);
                    var latlngs = [ll1, ll2];

                    featureGroup.clearLayers();
                    var polyline = L.polyline(latlngs, {
                        color: '#fe57a1'
                    }).addTo(featureGroup);
                    map.fitBounds(polyline.getBounds());

                    _this._drawingLine(map, featureGroup, srtmView, _this);
                } else {
                    map.fire('drawCreated');
                }
            });

            map.on('draw:created', function(e) {
                this.fire('editDisable');
                var layer = e.layer;
                featureGroup.clearLayers();
                featureGroup.addLayer(layer);

                srtmView.setData();
                var p1 = layer._latlngs[0];
                var p2 = layer._latlngs[1];

                srtmView.model.set({
                    p1: p1,
                    p2: p2,
                    firstLatlng: String(p1.lat) + ',' + String(p1.lng),
                    lastLatlng: String(p2.lat) + ',' + String(p2.lng)
                });
                _this._addChartView();
                _this._drawingLine(map, featureGroup, srtmView, _this);
                $('.chart-button')[0].disabled=false;

            });

            map.on('drawCreated', function(e) {
                srtmView.setData();
                srtmView.model.set({
                    p1: featureGroup.getLayers()[0]._latlngs[0],
                    p2: featureGroup.getLayers()[0]._latlngs[1],
                    firstLatlng: String(p1.lat) + ',' + String(p1.lng),
                    lastLatlng: String(p2.lat) + ',' + String(p2.lng)
                });
            });

            srtmView.on('srtmClose', function() {
                Mediator.disable();
            });
        },
        _calculate: function(p1, p2, view) {
            var ll1 = p1.lat + ',' + p1.lng;
            var ll2 = p2.lat + ',' + p2.lng;
            var url_ggl_req = "http://maps.googleapis.com/maps/api/elevation/json?path=" + ll1 + "|" + ll2 + "&samples=" + view.model.get('numberPoints') + "&sensor=false&callback=?&";
            var url = "/" + "srtm/" + "?url_req=" + encodeURIComponent(url_ggl_req);
            $.ajax({
                dataType: "json",
                url: url,
                success: function(data) {
                    if (data.status === "OK") {
                        var attrs = view.model.toJSON();
                        var result = initCalc(data.results, attrs.h1, attrs.h2, attrs.enableCurve, attrs.refraction);
                        view.model.set({
                            azimuth1: result.azimuth1.toFixed(3),
                            azimuth2: result.azimuth2.toFixed(3),
                            distance: result.AxisValues[result.AxisValues.length - 1].x.toFixed(3)
                        });

                        var frVal;
                        if (view.model.get('enableFrenel')) {
                            frVal = getFrenelValues(
                                result.line_values,
                                result.AxisValues,
                                view.model.get('frenelGHz'),
                                view.model.get('frenelPerc')
                            );
                        }
                        chartSrtm(result, view.model.get('enableFrenel'), frVal);
                        var infoView = new InfoView({
                            model: view.model
                        });
                        view.getRegion('information').show(infoView);
                    }
                }
            });
        },
        _drawingLine: function(map, featureGroup, view, self) {
            var edit = new EditPolyline(featureGroup.getLayers()[0]);
            edit.enable();
            map.on('editDisable', function() {
                edit.disable();
            });

            featureGroup.getLayers()[0].on('edit', function() {
                var p1 = this._latlngs[0];
                var p2 = this._latlngs[1];

                view.setData();
                view.model.set({
                    p1: p1,
                    p2: p2,
                    firstLatlng: String(p1.lat) + ',' + String(p1.lng),
                    lastLatlng: String(p2.lat) + ',' + String(p2.lng)
                });
                self._calculate(p1, p2, view);
            });
            var p1 = view.model.get('p1');
            var p2 = view.model.get('p2');
            self._calculate(p1, p2, view);
        },
        _addChartView: function() {
            if ($('.srtm-info').css('display') == 'none') {
                $('.srtm-info').css('display', 'block');
                var html = '<div class="srtm-chart" id="srtm-chart"></div>';
                $(html).appendTo($('#map'));
                var cont = $('#srtm-chart')[0];
                L.DomEvent.addListener(cont, 'click', function(e) {
                    L.DomEvent.stopPropagation(e);
                });
                L.DomEvent.addListener(cont, 'dblclick', function(e) {
                    L.DomEvent.stopPropagation(e);
                });
                L.DomEvent.addListener(cont, 'mousedown', function(e) {
                    L.DomEvent.stopPropagation(e);
                });
                L.DomEvent.addListener(cont, 'wheel', function(e) {
                    L.DomEvent.stopPropagation(e);
                });
            }
        },
        disable: function() {
            $('.srtm-info').css('display', 'none');
            Pile.empty();
            $('.srtm-chart').remove();
            map.fire('editDisable');
            featureGroup.clearLayers();
        }
    }

    return Mediator;
});
