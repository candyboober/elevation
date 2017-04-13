define([], function() {
	'use strict';

	var SrtmModel = Backbone.Model.extend({
		defaults: {
			h1: 0,
			h2: 0,
			numberPoints: 5,
			p1: undefined,
			p2: undefined,
			enableCurve: false,
			refraction: 1.333,
			enableFrenel: false,
			frenelGHz: 0.299792458,
			frenelPer: 60,
			firstLatLng: '',
			lastLatlng: ''
		}
	});

	return SrtmModel;
});