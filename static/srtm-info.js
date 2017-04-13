define(['text!./srtm-info.html'], function(html){
	'use strict';

	var InfoView = Mn.ItemView.extend({
		template: $(html).filter('#srtm-info-template')[0].outerHTML
	});

	return InfoView;
});