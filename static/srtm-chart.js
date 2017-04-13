'use strict';

define(
    ['d3', 'c3'],
    function(d3, c3) {
        function chartSrtm(sample, enableFrenel, frVal) {
            var axisObj = {
                'Высота': 'x',
                'Линия видимости': 'x2'
            };
            // base dots
            var xArrElev = ['x'],
                yArrElev = ['Высота'];
            for (var i = 0; i < sample.AxisValues.length; i++) {
                xArrElev.push(+sample.AxisValues[i]['x'].toFixed(2));
                yArrElev.push(+sample.AxisValues[i]['y'].toFixed(2));
            };
            // vision dots
            var xArrSign = ['x2'],
                yArrSign = ['Линия видимости'];
            for (var i = 0; i < sample.line_values.length; i++) {
                xArrSign.push(+sample.line_values[i]['x'].toFixed(2));
                yArrSign.push(+sample.line_values[i]['y'].toFixed(2));
            };

            var regions = [];
            try {
                for (var i = 0; i < sample.inter_areas_arr.length; i++) {
                    var lst = sample.inter_areas_arr[i].length - 1;
                    var ob = {};
                    ob.start = sample.inter_areas_arr[i][0].x;
                    ob.end = sample.inter_areas_arr[i][lst].x;
                    ob.class = 'ban';
                    regions.push(ob);
                }
            } catch (e) {}
            var columns = [xArrElev, yArrElev, xArrSign, yArrSign];

            if (enableFrenel) {
                var frenelDotsX = ['x3'];
                var frenelDotsY = ["Зона Френеля"];
                for (var i = 0; i < frVal.length; i++) {
                    frenelDotsY.push(frVal[i].y.toFixed(2));
                    frenelDotsX.push(frVal[i].x.toFixed(2));
                }
                columns.push(frenelDotsX);
                columns.push(frenelDotsY);
                axisObj["Зона Френеля"] = 'x3';
            }

            var srtmChart = c3.generate({
                bindto: '#srtm-chart',
                data: {
                    xs: axisObj,
                    columns: columns
                },
                zoom: {
                    enabled: true
                },
                size: {
                    width: 500,
                    height: 300
                },
                regions: regions,
                grid: {
                    x: {
                        show: true
                    },
                    y: {
                        show: true
                    }
                },
                axis: {
                    x: {
                        type: '',
                        ticks: {
                            format: function(x) {
                                return x;
                            }
                        }
                    },
                }
            });
        }
        return chartSrtm;
    });
