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
            var isWeekend = config.weekend.split(",").includes(dayOfWeek);

            // Si es fin de semana...
            if(isWeekend) {
                const weekDayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

                msg.holiday = weekDayNames[dayOfWeek];
                msg.weekend = true;

                // Es fin de semana así que lo devolvemos por la primera salida.
                node.send([msg, null, null]);
                return;
            } 

            // Si llegamos aquí no era un fin de semana.
            msg.weekend = false;
            msg.holiday = ""

            // 
            // Llamada al servicio.
            //
            var szYear = currentDate.getFullYear().toString();
            var szMonth = (currentDate.getMonth() + 1).toString();
            var szDate = currentDate.getDate().toString();

            var holidayFound = false;

            var requestUri = 'https://api-calendario-laboral.online/api/v1/festivities/bydate/' + szYear + '/' + szMonth + '/' + szDate; 

            fetch(requestUri)
                .then((response) => response.text())
                .then((body) => {
                    // Procesamos
                    try
                    {
                        var jsonBody = JSON.parse(body);

                        if (jsonBody.length === 0) {
                            node.send([null, msg, null]);
                            return;
                        }

                        jsonBody.forEach(element => {
                            var items = element.items;

                            if(typeof items !== 'undefined') {
                                items.forEach(item => {
                                    if ((item.municipality_code === config.municipality) || (item.municipality_code === config.territory) || (item.municipality_code === "16")) {
                                        holidayFound = true;
                                        msg.holiday = item.festivity_name_es;
                                    }
                                });
                            }
                        });
                    }
                    catch(error)
                    {
                        msg.error = error;
                        node.send([null, null, msg]);
                        return;
                    }
                    
                    if (holidayFound)
                    node.send([msg, null, null]);
                    else
                        node.send([null, msg, null]);
                }).catch((error) => {
                    msg.error = error;
                    node.send([null, null, msg]);
                }); 
        });
    }
    RED.nodes.registerType("holiday-euskadi", HolidayEuskadiNode);
}