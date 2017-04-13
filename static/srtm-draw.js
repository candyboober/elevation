define(['leaflet', 'map', 'pile'], function(L, map, Pile) {
    'use strict';

    var Control = L.Control.extend({
        options: {
            position: 'topright',
            draw: {},
            edit: false,
            homeTitle: ''
        },

        initialize: function(options) {
            //провериь есть ли edit.featureGroup в options
            L.Control.prototype.initialize.call(this, options);
        },

        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'leaflet-srtm leaflet-control leaflet-control-navbar btn-group-vertical');
            var btn = L.DomUtil.create('i', 'leaflet-srtm-create fa fa-area-chart');
            var _this = this;
            this.polyline = undefined;
            L.DomEvent
                .addListener(container, "contextmenu", L.DomEvent.stopPropagation)
                .addListener(container, "contextmenu", L.DomEvent.preventDefault);

            this._drawButton = this._createButton('leaflet-srtm-draw', container);
            this._drawButton.title = 'Построение профиля высот';
            this._drawButton.appendChild(btn);
            this._on = false;

            L.DomEvent.on(this._drawButton, 'click', function() {
                require(['mrsk_srtm/mediator'], function(Mediator) {
                    if (_this._on) {
                        Mediator.disable();
                        $('.leaflet-srtm').removeClass('enabled');
                    } else {
                        Mediator.enable();
                        $('.leaflet-srtm').addClass('enabled');
                    };

                    _this._on = !_this._on;
                });

            });

            require(['app', 'mrsk_srtm/mediator'], function(App, Mediator) {
                App.menu.on('showContent', function() {
                    Mediator.disable();
                    $('.leaflet-srtm').removeClass('enabled');
                    _this._on = !_this._on;
                });
            });

            container.appendChild(this._drawButton);

            return container;
        },

        _createButton: function(className, container) {

            var btn = L.DomUtil.create('div', 'btn-icopanel btn btn-primary ' + className, container);
            L.DomEvent
                .on(btn, 'mousedown dblclick', L.DomEvent.stopPropagation)
                .on(btn, 'click', L.DomEvent.stop)
                .on(btn, 'click', this._refocusOnMap, this);


            return btn;
        },

        clearLayers: function() {
            try {
                this.polyline._edit.disable();
                this.options.edit.featureGroup.clearLayers();
            } catch (e) {}
        }
    });

    return function(options) {
        return new Control(options);
    }
});
