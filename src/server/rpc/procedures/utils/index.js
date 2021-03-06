// a set of utilities to be used by rpcs

// sets up the headers and send an image
const sendImageBuffer = (response, imageBuffer) => {
    response.set('cache-control', 'private, no-store, max-age=0');
    response.set('content-type', 'image/png');
    response.set('content-length', imageBuffer.length);
    response.set('connection', 'close');
    response.status(200).send(imageBuffer);
};

// creates snap friendly structure out of an array ofsimple keyValue json object or just single on of them.
const jsonToSnapList = inputJson => {
    // if an string is passed check to see if it can be parsed to json
    if (typeof inputJson === 'string') {
        try {
            inputJson =  JSON.parse(inputJson);
        } catch (e) {
            return inputJson;
        }
    }

    // if it's not an obj(json or array)
    if (inputJson === null || inputJson === undefined) return [];
    if (typeof inputJson !== 'object') return inputJson;

    let keyVals = [];
    if (Array.isArray(inputJson)) {
        inputJson = inputJson.filter(item => item);
        for (let i = 0; i < inputJson.length; i++) {
            keyVals.push(jsonToSnapList(inputJson[i]));
        }
    }else{
        const inputKeys = Object.keys(inputJson);
        for (let i = 0; i < inputKeys.length; i++) {
            keyVals.push([inputKeys[i], jsonToSnapList(inputJson[inputKeys[i]]) ]);
        }
    }
    return keyVals;
};



// turns a tuple-like object into query friendly string
const encodeQueryData = tuple => {
    let ret = [];
    for (let d in tuple)
        ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(tuple[d]));
    return ret.join('&');
}

module.exports = {
    sendImageBuffer,
    encodeQueryData,
    jsonToSnapList
};
