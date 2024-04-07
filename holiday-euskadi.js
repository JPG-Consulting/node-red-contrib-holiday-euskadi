"use strict";


 module.exports = function(RED) {
    
    function HolidayEuskadiNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;

        node.on('input', function(msg) {
            if (!msg.hasOwnProperty("payload")) {
                node.warn("Message has no payload");
                return;
            }

            var currentDate = null;

            // Leemos la fecha.
            if ((typeof msg.payload === "number") || (typeof msg.payload === "string")) {
                currentDate = new Date(msg.payload);
            }
            else if ((typeof msg.payload === "object") && (Object.prototype.toString.call(msg.payload) !== '[object Date]')) {
                currentDate = msg.payload;
            }

            if (currentDate === null)
            {
                node.error("The payload is not a timestamp or a Date");
                return;
            }

			// Obtenemos el día de la semana para determinar si es fin de semana.
            var dayOfWeek = currentDate.getDay().toString();
            msg.weekend = config.weekend.split(",").includes(dayOfWeek);
			
			if (msg.weekend) {
				const weekDayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

                msg.holiday = weekDayNames[dayOfWeek];
			} else {
				msg.holiday = '';
			}

            var territory = null;
            switch(config.territory) {
                case '01':
                    territory = 'Álava - Araba';
                    break;
                case '20':
                    territory = 'Gipuzkoa';
                    break; 
                case '48':
                    territory = 'Bizkaia';
                    break;
                default:
                    msg.error = 'No se ha establecido un territorio.';
                    node.send([null, null, msg]);
                    return;
            }

            // El municipio, por el API, viene como cadena y trae un cero por delante.
            var municipality = parseInt(config.municipality);

			const OpenDataEuskadi = require('./libs/OpenDataEuskadi.js');
		    OpenDataEuskadi.getCalendarioLaboral(currentDate, { date: true, territory: territory, municipality: municipality })
				.then((holidays) => {
					if ((holidays.length === 0)	&& (!msg.weekend)) {
						node.send([null, msg, null]);
					} else {
                        if (holidays.length > 0) {
                            msg.holiday = holidays[0].descriptionEs;
                        }

						node.send([msg, null, null]);
					}
				})
				.catch((error) => {
					msg.error = error;
					node.send([null, null, msg]);
				});
        });
    }
    RED.nodes.registerType("holiday-euskadi", HolidayEuskadiNode);
}