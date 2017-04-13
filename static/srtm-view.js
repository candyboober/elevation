define(['text!mrsk_srtm/srtm-params.html'], function(html) {
    'use strict';

    var SrtmView = Mn.LayoutView.extend({
        template: $(html).filter("#srtm-params")[0].outerHTML,

        regions: {
            main: 'srtm-ui',
            information: '.srtm-info'
        },

        ui: {
            h1: '.input-first',
            h2: '.input-first',
            sample: '.slider',
            sliderValue: '.slider-value',
            coordCheck: '.coord-input',
            firstLatlng: '.first-latlng',
            lastLatlng: '.last-latlng',
            curveCheck: '.curve-earth',
            curveValue: '.const-earth-input',
            frenelCheck: '.frenel-zone',
            frenelHz: '.input-frelen-hz',
            frenelPerc: '.input-frenel-proc',
            chartBtn: '.chart-button',
            drawBtn: '.draw-button'
        },

        events: {
            'change .coord-input': 'hideChecks',
            'change .curve-earth': 'hideChecks',
            'change .frenel-zone': 'hideChecks',
            'click .chart-button': 'startChart',
            'change .slider': 'sliderLabel',
            'click .draw-button': 'drawLine',
            'click .srtm-close': 'closeView'
        },

        hideChecks: function(e) {
            if (e.target.checked) {
                for (var j = 3; j < e.target.parentNode.children.length; j++) {
                    e.target.parentNode.children[j].style.display = 'block';
                    // e.target.parentNode.style.display = 'block';
                }
            } else {
                for (var j = 3; j < e.target.parentNode.children.length; j++) {
                    e.target.parentNode.children[j].style.display = 'none';
                    // e.target.parentNode.style.display = 'flex';
                }
            }

        },

        startChart: function() {
            this.setData();
            this.trigger('setCoord');
        },

        drawLine: function() {
            this.trigger('drawLine');
        },

        sliderLabel: function() {
            this.ui.sliderValue.text(this.ui.sample.val());
        },

        setData: function() {
            var h1 = $(this.ui.h1).val();
            var h2 = $(this.ui.h2).val();
            var numberPoints = $(this.ui.sliderValue).text();
            var enableCurve = $(this.ui.curveCheck).prop('checked');
            var refraction = $(this.ui.curveValue).val();
            var enableFrenel = $(this.ui.frenelCheck).prop('checked');
            var frenelGHz = $(this.ui.frenelHz).val();
            var frenelPerc = $(this.ui.frenelPerc).val();

            this.model.set({
                h1: h1,
                h2: h2,
                numberPoints: numberPoints,
                enableCurve: enableCurve,
                refraction: refraction,
                enableFrenel: enableFrenel,
                frenelGHz: frenelGHz,
                frenelPerc: frenelPerc
            });
        },

        closeView: function() {
            $('.leaflet-srtm-draw').trigger('click');
        }
    });

    return SrtmView;
});
