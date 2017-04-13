'use strict';

define([], function() {

	// old version
    //alert('old frenel'); 
    // function getFrenelZone(ab, bc, frequency, percent) {
    //     var la = +ab * 1000,
    //         lb = +bc * 1000,
    //         R = la + lb,
    //         f = +frequency,
    //         r,
    //         k = la / R,
    //         lambd = 0.3 / f,
    //         p = (percent / 100) || 1;
    //     if (la && lb && f && f != 0) {
    //         r = Math.sqrt((1 / 3) * lambd * R * (k) * (1 - k));
    //         r = r * p;
    //         return r;
    //     }
    // }

    // by my correction
    function getFrenelZone(ab, bc, frequency, percent) {
        var la = +ab * 1000;
        var lb = +bc * 1000;
        var lambd = 299792458/(+frequency*Math.pow(10, 9));
        var p = (percent / 100) || 1;
        if (la && lb && frequency && frequency != 0) {
            var r = Math.sqrt((lambd*la*lb)/(la+lb));
            return r*p;
        }
    }

    // by itu-r p.526
    // alert('itu-r frenel');
    // function getFrenelZone(ab, bc, frequency, percent) {
    //     var f = +frequency*Math.pow(10, 3),
    //         r,
    //         p = (percent / 100) || 1;
    //     if (ab && bc && f && f != 0) {
    //         r = 550*Math.sqrt((ab*bc)/(f*(ab+bc)));
    //         return r*p;
    //     }
    // }

    function getCoordsOfIntersectedPoint(point_a, point_b, dist_ab, dist_ac) {
        var point_c = {};
        var dist_cb = +dist_ab - +dist_ac;

        if (dist_cb == 0) {
            return point_b;
        }

        var lamb = dist_ac / dist_cb,
            x,
            y,
            x1 = +point_a.x,
            y1 = +point_a.y,
            x2 = +point_b.x,
            y2 = +point_b.y;

        x = (x1 + lamb * x2) / (1 + lamb);
        y = (y1 + lamb * y2) / (1 + lamb);

        point_c.x = x;
        point_c.y = y;

        return point_c;
    }

    function getFrenelValues(line_values, AxisValues, frequency, percent) {
        var frenel_arr = [],
            fren_radius = 0,
            fren_ab,
            fren_bc,
            point_a = {
                x: line_values[0].x,
                y: line_values[0].y
            },
            point_b = {
                x: line_values[1].x,
                y: line_values[1].y
            },
            point_c = {},
            distan = 0,
            distan2 = 0,
            r = 0,
            deltaY = 0;

        frenel_arr.push({
            x: point_a.x,
            y: point_a.y,
            deltaY: +point_a.y - +AxisValues[0].y,
            axisY: +AxisValues[0].y
        });

        for (var i = 1, max = AxisValues.length - 1; i < max; i++) {
            fren_ab = +AxisValues[i].x;
            fren_bc = +line_values[1].x - +fren_ab;
            point_c = getCoordsOfIntersectedPoint(point_a, point_b, +line_values[1].x, fren_ab);
            fren_radius = getFrenelZone(fren_ab, fren_bc, frequency, percent);
            deltaY = +point_c.y - +AxisValues[i].y - +fren_radius;

            frenel_arr.push({
                x: AxisValues[i].x,
                y: +point_c.y - +fren_radius,
                deltaY: deltaY,
                axisY: AxisValues[i].y
            });
        }

        frenel_arr.push({
            x: point_b.x,
            y: point_b.y,
            deltaY: +point_a.b - +AxisValues[AxisValues.length - 1].y,
            axisY: +AxisValues[AxisValues.length - 1].y
        });

        return frenel_arr;
    };
    return getFrenelValues;
});
