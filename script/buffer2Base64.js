function bufferToBase64String(buffer) {
    let base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return base64;
}

function base64StringToBuffer(str) {
    let asciiString = atob(str);
    return new Uint8Array([...asciiString].map(char => char.charCodeAt(0))).buffer;
}
