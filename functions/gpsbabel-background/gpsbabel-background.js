const axios = require('axios');
const fs = require('fs').promises;
const { exec } = require('child-process-promise');

const fileTypeMapping = {
  gpx: 'gpx',
  kml: 'kml',
  json: 'geojson',
  tcx: 'gtrnctr',
};

const typeMapping = {
  gpx: { extension: 'gpx', mediaType: 'application/gpx+xml' },
  kml: { extension: 'kml', mediaType: 'application/vnd.google-earth.kml+xml' },
  geojson: { extension: 'json', mediaType: 'application/geo+json' },
  gtrnctr: { extension: 'tcx', mediaType: 'application/vnd.garmin.tcx+xml' },
};

const isJson = async (data) => {
  try {
    JSON.parse(data);
  } catch (e) {
    return false;
  }
  return true;
};

const saveFile = async (data, fileName) => {
  if (await isJson(data) === true) {
    var fileContents = JSON.stringify(JSON.parse(data));
    var fileType = 'json';
  } else {
    var fileContents = data;
    var fileType = 'xml';
  }
  await fs.writeFile(`${fileName}.${fileType}`, fileContents, 'utf-8');
  return fileType;
};

const convertFile = async (inType, fileName, inFileType, outType, count, distance, error) => {
  if (typeMapping[inType] === undefined || typeMapping[outType] === undefined) {
    return false;
  }
  const outFile = `${fileName}.${typeMapping[outType].extension}`;
  const params = [
    './bin/gpsbabel',
    `-i ${inType}`,
    `-f ${fileName}.${inFileType}`,
  ];
  if (distance !== undefined) {
    params.push(`-x position,distance=${distance}`);
  }
  if (error !== undefined) {
    params.push(`-x simplify,crosstrack,error=${error}`);
  }
  if (count !== undefined) {
    params.push(`-x simplify,count=${count}`);
  }
  params.push(`-o ${outType}`);
  params.push(`-F ${outFile}`);
  return await (exec(params.join(' '))
    .then((result) => outFile)
    .catch((err) => false));
};

const readFile = async (fileName, inFileType, outType) => {
  const outFile = `${fileName}.${typeMapping[outType].extension}`;
  const data = await fs.readFile(outFile, {
    encoding: 'utf-8',
  });
  await fs.unlink(`${fileName}.${inFileType}`);
  await fs.unlink(outFile);
  return data;
};

exports.handler = async (event, context) => {
  let inFile;
  let inFileType;
  let inType;
  let body = {};
  const params = event.queryStringParameters;
  if (event.httpMethod === 'GET' || event.httpMethod === 'POST') {
    const fileName = `/tmp/${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    if (event.httpMethod === 'GET') {
      inFile = params.infile;
    } else if (event.httpMethod === 'POST') {
      if (await isJson(event.body) === true) {
        body = JSON.parse(event.body);
        inFile = body.url;
      } else {
        inFileType = await saveFile(event.body, fileName);
        inType = params.intype;
      }
    }
    if (inFile) {
      const url = new URL(inFile);
      inFileType = await saveFile(await (await axios.get(url.href)).data, fileName);
      const extension = url.pathname.split('.').pop();
      inType = params.intype || fileTypeMapping[extension];
    }
    const { outtype: outType, count, distance, error, webhook: webHook } = params;
    const outFile = await convertFile(inType, fileName, inFileType, outType, count, distance, error);
    if (outFile === false) {
      return {
        statusCode: 405,
        body: 'Error when converting file',
      };
    }
    const data = await readFile(fileName, inFileType, outType);
    const messageData = {
      app: 'gpsbabel',
      event: `convert_${inType}_${outType}`,
      foreignKey: inFile ? inFile : fileName,
      data: {
        event: {
          body,
          params,
        },
        content: data,
      },
    }
    await axios.post(webHook, JSON.stringify(messageData));
    return {
      statusCode: 200,
      body: 'Ok',
    };
  }
  return {
    statusCode: 405,
    body: 'Method Not Allowed',
  };
};
