define(['leaflet', 'leaflet-draw'], function(L) {
	'use strict';

    L.drawLocal.draw.toolbar.actions.text = "Отмена";
    L.drawLocal.draw.toolbar.actions.title = "Отмена рисования";
    L.drawLocal.draw.toolbar.buttons.polyline = "Нарисовать линию";

    var Polyline = L.Draw.Polyline.extend({

        initialize: function(map, featureGroup, options) {
            this.featureGroup = featureGroup;
            L.Draw.Polyline.prototype.initialize.call(this, map, options);
        },

        _vertexChanged: function(latlng, added) {
            this._updateFinishHandler();
            this._updateRunningMeasure(latlng, added);
            this._clearGuides();
            this._updateTooltip();
            this._edit = undefined;

            var markerCount = this._markers.length;
            var icon = L.divIcon({className: 'srtm-marker'});
            /*var icon = L.icon({
                iconUrl: 'static/mrsk_srtm/src/map-marker-blue.png',
                iconSize: [40, 48]
            });*/
            if (markerCount > 1) {
                this._finishShape();
                this.disable();
                this.fire('draw:srtmfinishdraw');
            }
        },
        disable: function() {
            L.Handler.prototype.disable.call(this);

            this._map.fire('draw:srtmdrawstop', {
                layerType: this.type
            });
        },

        _getTooltipText: function() {
            var showLength = this.options.showLength,
                labelText, distanceStr;

            if (this._markers.length === 0) {
                labelText = {
                    text: 'Кликните, чтобы начать рисовать линию'
                };
            } else {
                distanceStr = showLength ? this._getMeasurementString() : '';

                if (this._markers.length === 1) {
                    labelText = {
                        text: 'Кликните, чтобы нарисовать линию',
                        subtext: distanceStr
                    };
                } else {
                    labelText = {
                        text: 'Кликните, чтобы закончить',
                        subtext: distanceStr
                    };
                }
            }
            return labelText;
        }
    });


    window.EditPolyline = L.Edit.Poly.extend({
        includes: L.Edit.Poly,

        options: {
            icon: new L.DivIcon({
                className: 'srtm-marker',
                iconSize: new L.Point(35, 38),
            })
        },

        initialize: function(poly, options) {
            this._poly = poly;
            this._poly.options.editing = {
                color: '#fe57a1',
                opacity: 0.6,
                fill: true,
                fillColor: '#fe57a1',
                fillOpacity: 0.1,
                maintainColor: false
            };
            L.setOptions(this, options);
        },
        _createMiddleMarker: function(marker1, marker2) {
            //pass
        }
    });

    return Polyline;
})
