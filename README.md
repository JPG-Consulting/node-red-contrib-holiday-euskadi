# node-red-contrib-holiday-euskadi
Un nodo para comprobar si es un día festivo en un municipio del País Vasco

Utiliza el servicio [API Calendario Laboral](https://api-calendario-laboral.online/)

Tiene 3 salidas:
1. Si es festivo o fin de semana.
2. Si NO es festivo NI fin de semana
3. Si se produce un error en la consulta

La salida de error la opodemos unir como que no es festivo, coo que es festivo o hacerlo aleatorio. Esta salida también permitiría registrar el error antes de proceder.
