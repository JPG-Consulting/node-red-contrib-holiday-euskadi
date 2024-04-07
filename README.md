# node-red-contrib-holiday-euskadi
Un nodo para comprobar si es un día festivo en un municipio del País Vasco

Utiliza los datos de [Open Data Euskadi](https://opendata.euskadi.eus/catalogo-datos/?r01kQry=tC:euskadi;tF:opendata;tT:ds_eventos;mO:documentName.LIKE.calendario%20laboral,documentDescription.LIKE.calendario%20laboral;m:documentLanguage.EQ.es;p:Inter).

Para los municipios utiliza los datos descargado de:
* [Álava - Araba](https://api.euskadi.eus/nora/states/16/counties/01/municipalities?summarized=true)
* [Gipuzkoa](https://api.euskadi.eus/nora/states/16/counties/20/municipalities?summarized=true)
* [Bizkaia](https://api.euskadi.eus/nora/states/16/counties/48/municipalities?summarized=true)

Estos datos se alamcenan en la carpeta ``resources`` con el nombre ``municipalities_[XX]`` donde el valor de ``[XX]`` es el código de la provincia:
* Álava - Araba = 01 (municipalities_01.json)
* Gipuzkoa = 20 (municipalities_20.json)
* Bizkaia = 48 (municipalities_48.json)

TODO: Estos ficheros deberían actualizarse automáticamente.

Tiene 3 salidas:
1. Si es festivo o fin de semana.
2. Si NO es festivo NI fin de semana
3. Si se produce un error en la consulta

La salida de error la opodemos unir como que no es festivo, coo que es festivo o hacerlo aleatorio. Esta salida también permitiría registrar el error antes de proceder.

## Instalación

### En Node-RED
* Vía Manage Palette -> Buscar "node-red-contrib-holiday-euskadi"

### En una shell
* vaya al directorio de instalación de Node-RED, i.e.: `~/.node-red`
* ejecut `npm install node-red-contrib-config`