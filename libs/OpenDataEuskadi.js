const fs = require('fs');
const path = require('path');
const { finished } = require('stream/promises');
const { Readable } = require('stream');
					
class OpenDataEuskadi {
	/**
	 * Obtiene la ruta de los datos del nodo.
	 * 
	 * @returns La ruta de los archivos de datos para el nodo.
	 */
	static #getDataPath() {
		const dataPath = './downloads/OpenDataEuskadi';

		try
		{
			var fileDir = null;

			if ((typeof __filename !== 'undefined') && (__filename !== null)) {
				// Obtenemos la carpeta del fichero actual.
				fileDir = path.dirname(__filename);
			} else if ((typeof __dirname !== 'undefined') && (__dirname !== null)) {
				fileDir = __dirname;
			}
			else
			{
				throw new Error('No se ha definido __filenme ni __directory.');
			}

			// El fichero actual está en la ruta libs del nodo así que el nodo 
			// está un directorio por debajo.
			const dataPath = path.resolve(fileDir, '../data');

			// Si el directorio no existe lo creamos.
			try
			{
				if (!fs.existsSync(dataPath)) {
					fs.mkdirSync(dataPath, { recursive: true });
				}
			}
			catch(error)
			{
				console.error('OpenDataEuskadi: No se ha podido crear el directorio de datos.');
				console.error(error);
			}

			return dataPath;
		}
		catch (error)
		{
			console.error(error);
		}

		// Devolvemos la ruta por defecto.
		return './downloads/OpenDataEuskadi';
	}

	/**
	 * Lee los datos JSON de un fichero.
	 * @param {*} filename El fichero con los datos JSON
	 * @returns Un objeto con la fecha de creación y modificación así como los datos JSON.
	 */
	static #readJsonFile(filename) {
		try
		{
			// Si no existe devolvemos null directamente.
			if (!fs.existsSync(filename)) {
				return null;
			}

			// Obtenemos los stats.
			const stats = fs.statSync(filename);

			// Leemos el JSON como objeto.
			const data = JSON.parse(fs.readFileSync(filename));

			return {
				creation: stats.ctime,
				modified: stats.mtime,
				data: data
			}
		}
		catch(error)
		{
			// No debería llegar aquí, pero si lo hace avisamos.
			console.error(error);
			// ...y devolvemos null.
			return null;
		}
	}

	static #applyCalendarioLaboralFilters(data, options) {
		if ((typeof data === 'undefined') || (data === null)) {
			throw new Error('No se han espeficiado los días festivos.');
		}

		if ((typeof options === 'undefined') || (options === null)) {
			return data;
		}

		// Preparamos la fecha.
		var checkDate = null;
		if ((typeof options.date === 'date') || (options.date instanceof Date)) {
			checkDate = options.date.getFullYear().toString() + '/' + (options.date.getMonth() + 1).toString() + '/' + options.date.getDate();
		} else if ((typeof options.date !== 'undefined') || (options.date !== null)) {
			throw new Error('La opción date tiene un valor no válido.');
		}

		var checkTerritory = null;
		if ((typeof options.territory === 'string') || (options.territory instanceof String)) {
			checkTerritory = options.territory;
		}

		var checkMunicipality = null;
		if ((typeof options.municipality === 'string') || (options.municipality instanceof String)) {
			checkMunicipality = options.municipality;
		} else if (typeof options.municipality === 'number') {
            checkMunicipality = parseInt(options.municipality);
        }

		// Filtramos
		var dateEntries = [];

		for (let i = 0; i < data.length; i++) {
			let currentItem = data[i];

			// Filtramos por fecha.
			if ((checkDate === null) || (checkDate === currentItem.date)) {
				// Filtramos por territorio.
				if ((checkTerritory === null) || (currentItem.territory === 'Todos/denak')) {
					dateEntries.push(currentItem);
				} else if (checkTerritory === currentItem.territory) { 
					// Filtramos por municipio
					if (checkMunicipality === null) {
						dateEntries.push(currentItem);	
					}
					else if (((typeof currentItem.municipalitycode === 'undefined') || (currentItem.municipalitycode === null)) && ((currentItem.municipalityEs === checkTerritory) || (currentItem.municipalityEu === checkTerritory))) {
						// Festivo en el territorio.
						dateEntries.push(currentItem);
					} else if (checkMunicipality === currentItem.municipalitycode) {
						dateEntries.push(currentItem);
					}
				}
			}
		}

		return dateEntries;
	}

	/**
	 * Obtiene un JSON desde una URL.
	 * 
	 * @param {*} url La URL del JSON.
	 * @param {*} options Las opciones para el fetch.
	 * @returns Un objeto JSON.
	 */
	static async #fetchJson(url, options = null) {
		return new Promise( async (resolve, reject) => {
			try
			{	
				// Mergeamos las opciones por defecto.
				var defaultOptions = { method: 'GET', cache: 'no-cache', redirect: 'follow'};
				if ((typeof options === 'object')) {
					options = { defaultOptions, options };
				}
				else if ((typeof options === 'undefined') || (options === null)) {
					options = defaultOptions;
				}

				// Enviamos la solictud.
				var response = await fetch(url, options);
				
				// El resultado debe ser 200 OK.
				if (response.status !== 200) {
					reject('Error ' + response.status + ' ' + response.statusText);
					return;
				}
				
				// El content-type debería ser application/json
				const contentType = response.headers.get('content-type');
				if (contentType !== 'application/json') {
					reject('Not a JSON file (ContentType: ' + contentType + ')');
					return;
				}
				
				// Nos aseguramos que tenemos un JSON convirtiendo la
				// respuesta a un JSON.
				const body = await response.text();
				const json = JSON.parse(body);

				// Devolvemos el JSON.
				resolve(json);
			}
			catch(error)
			{
				reject(error);
			}
		});
	}

	static #writeToFile(file, data) {
		try
		{
			const existed = fs.existsSync(file);
			const backupFile = file + '.bck';

			if (existed) {
				fs.renameSync(file, backupFile);
			}

			try
			{
				let dirName = path.dirname(file);
				if (!fs.existsSync(dirName)) {
					fs.mkdirSync(dirName, { recursive: true });
				}

				if (typeof data === 'object') {
					fs.writeFileSync(file, JSON.stringify(data));
				} else {
					fs.writeFileSync(file, data);
				}
			} 
			catch(error)
			{
				console.error('OpenDataEuskadi: ' + error);
				if (fs.existsSync(backupFile) && (!fs.existsSync(file))) {
					fs.renameSync(backupFile, file);
				}
			}
			finally
			{
				if (fs.existsSync(backupFile)) {
					fs.rmSync(backupFile);
				}
			}

			return fs.existsSync(file);
		}
		catch(error)
		{
			console.error('OpenDataEuskadi: No se ha podido escribir el fichero.');
			console.error(error)
			return false;
		}
	}

	static async getCalendarioLaboral(date, options = {}) {
		return new Promise( async (resolve, reject) => {
			try
			{
				// Validamos la fecha.
				if ((typeof date === 'undefined') || (date === null)) {
					// Si no se ha especificado utilizamos la fecha actual.
					date = new Date();
				} else if ((typeof date === 'string') || (date instanceof String)) {
					date = Date.parse(date);
				}

				if ((typeof date !== 'date') && (!(date instanceof Date))) {
					throw new Error('El argumento date de getCalendarioLaboral tiene un valor no válido.');
				}

				// Preparamos los filtros
				const defaultOptions = { date: false, territory: null, municipality: null };
				if ((typeof options === 'undefined') || (options === null)) {
					options = defaultOptions;
				} else if(typeof options === 'object') {
					options = { ...defaultOptions, ...options };
				} else {
					throw new Error('El argumento options de getCalendarioLaboral tiene un valor no válido.');
				}

				// Validamos las opciones.
				if ((typeof options.date === 'boolean') || (options.date instanceof Boolean)) {
					// Si es booleano vamos a cambiarlo por la fecha.
					if (options.date) {
						options.date = date;
					} else {
						options.date = null;
					}
				} else if ((typeof options.date === 'date') || (options.date instanceof Date)) {
					// el año de date y de options.date debería ser el mismo.
					if (date.getFullYear() !== options.date.getFullYear()) {
						throw new Error('Incoherencia en los datos entre date y options.date');
					}
				} else {
					throw new Error('El argumento options tiene un valor no válido para date.');
				}

				if ((options.municipality != null) && (options.territory === null)) {
					throw new Error('Se ha especificado el municipio pero no se ha especificado el territorio.');
				}

				// Empezamos!
				const szYear = date.getFullYear().toString();

				// La ruta hasta los datos del calendario laboral.
				const downloadPath = path.resolve(this.#getDataPath(), 'ds_eventos/calendario_laboral');
				const filename = 'calendario_laboral_' + date.getFullYear() + '.json';
				const fullPath = path.resolve(downloadPath, filename);

				// Leemos el JSON local.
				var localJson = this.#readJsonFile(fullPath);
				if (localJson !== null) {
					resolve(this.#applyCalendarioLaboralFilters(localJson.data, options));
					return;
				}

				// Si llegamos aquí tenemos que descargar el fichero.
				var url = 'https://opendata.euskadi.eus/contenidos/ds_eventos/calendario_laboral_' + szYear + '/opendata/calendario_laboral_' + szYear + '.json';
				
				var response = await this.#fetchJson(url);

				//  Vamos a escribir.
				if (!this.#writeToFile(fullPath, response)) {
					reject('Error al escribir el archivo local.');
					return;
				}
				
				// ToDo: Aquí podríamos devolver el calendario completo.
				
				localJson = this.#readJsonFile(fullPath);
				if (localJson === null) {
					throw new Error('OpenDataEuskadi: No se han podido leer los datos JSON.');
					return;
				}

				resolve(this.#applyCalendarioLaboralFilters(localJson.data, options));
			}
			catch(error)
			{
				console.error(error);
				reject('getCalendarioLaboral failed.');
			}
		});
	}
}

module.exports = OpenDataEuskadi;