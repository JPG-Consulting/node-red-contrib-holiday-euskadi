# node-red-contrib-holiday-euskadi
Un nodo para comprobar si es un día festivo en un municipio del País Vasco

Utiliza los datos de [Open Data Euskadi](https://opendata.euskadi.eus/catalogo-datos/?r01kQry=tC:euskadi;tF:opendata;tT:ds_eventos;mO:documentName.LIKE.calendario%20laboral,documentDescription.LIKE.calendario%20laboral;m:documentLanguage.EQ.es;p:Inter).

Utiliza el servicio [API Calendario Laboral](https://api-calendario-laboral.online/) únicamente para obtener los municipios (Buscando la solución)

Tiene 3 salidas:
1. Si es festivo o fin de semana.
2. Si NO es festivo NI fin de semana
3. Si se produce un error en la consulta

La salida de error la opodemos unir como que no es festivo, coo que es festivo o hacerlo aleatorio. Esta salida también permitiría registrar el error antes de proceder.
