const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const crypto = require('crypto')
const fs = require('fs')
const NodeRSA = require('node-rsa')
const rc4 = require('arc4')

let win;
function createWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 750,
        webPreferences: {
            nodeIntegration: true
        },
    })
    win.loadFile('./app/login.html')
}


// aes
ipcMain.on('aes-encryption', (event, args) => {
    try {
        let { message, password } = args
        const key = crypto.scryptSync(password, 'salt', 32)
        const iv = Buffer.alloc(16, 0)
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
        message = Buffer.from(message).toString("base64")
        let encrypted = cipher.update(message, 'base64', 'base64')
        encrypted += cipher.final('base64')
        event.sender.send('aes-encryption-reply', encrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to encrypt message! Please check your key!')
    }
})

ipcMain.on('aes-decryption', (event, args) => {
    try {
        let { message, password } = args
        //console.log('decryption', message, password)
        const key = crypto.scryptSync(password, 'salt', 32)
        const iv = Buffer.alloc(16, 0)
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        let decrypted = decipher.update(Buffer.from(message, 'base64'), 'base64', 'base64')
        decrypted += decipher.final('base64')
        event.sender.send('aes-decryption-reply', decrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to decrypt message! Please check your key!')
    }
})

// rc4
ipcMain.on('rc4-encryption', (event, args) => {
    try {
        console.log("rc4-encryption-reply")
        let { message, password } = args
        console.log(`Message: ${message instanceof(Uint8Array)}`)
        message = Buffer.from(message);
        let cipher = rc4('arc4', password)
        let encrypted = cipher.encodeBuffer(message);
        event.sender.send('rc4-encryption-reply', encrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to encrypt message! Please check your key!')
    }
})

ipcMain.on('rc4-decryption', (event, args) => {
    try {
        
        let { message, password } = args
        console.log("rc4-decryption: " , message instanceof(Uint8Array))
        let cipher = rc4('arc4', password)
        message = Buffer.from(message)
        let decrypted = cipher.decodeBuffer(message)
        console.log("descrupt: ", decrypted)
        event.sender.send('rc4-decryption-reply', decrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to decrypt message! Please check your key!')
    }
})

// rsa
ipcMain.on('rsa-genkey', (event) => {
    const key = new NodeRSA({ b: 512 })
    const publicKey = key.exportKey('pkcs8-public-pem')
    const privateKey = key.exportKey('pkcs8-private-pem')
    event.sender.send('rsa-genkey-reply', { publicKey, privateKey })
})

ipcMain.on('rsa-encryption', (event, args) => {
    try {
        let { message, publicKey } = args
        console.log('------------------- rsa encryption: -------------')
        const key = new NodeRSA({ b: 512 })
        key.importKey(publicKey, 'pkcs8-public-pem')
        message = Buffer.from(message)
        const encrypted = key.encrypt(message, "buffer")
        event.sender.send('rsa-encryption-reply', encrypted)
        console.log('result of rsa encryption: ', encrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to encrypt message! Please check your key!')
    }
})

ipcMain.on('rsa-decryption', (event, args) => {
    try {
        let { message, privateKey } = args
        console.log('------------------- rsa decryption: -------------')
        const key = new NodeRSA({ b: 512 })
        key.importKey(privateKey, 'pkcs8-private-pem')
        message = Buffer.from(message);
        const decrypted = key.decrypt(message, 'buffer')
        event.sender.send('rsa-decryption-reply', decrypted)
    }
    catch (err) {
        console.log(err)
        dialog.showErrorBox('Error', 'Fail to decrypt message! Please check your key!')
    }
})

// Handle open, save file dialog
ipcMain.on('open-file', (event, args) => {
    dialog.showOpenDialog(win, {
        defaultPath: __dirname,
        filters: [
            { name: 'Text file', extensions: ['txt'] },
            { name: 'All files', extensions: ['*'] }
        ]
    }).then(filenames => {
        console.log(__dirname)
        console.log(filenames)
        if (filenames.filePaths[0] === undefined) {
            event.sender.send('open-file-reply', null)
        }
        else {
            fs.readFile(filenames.filePaths[0], function (err, data) {
                console.log(err)
                if (err) {
                    event.sender.send('open-file-reply', null)
                }
                else {
                    console.log("Data save to Base64")
                    // console.log(data.toString('base64'))
                    // console.log(data.toString('binary'))
                    //console.log(data)
                    console.log(data);

                    event.sender.send('open-file-reply', [data,args])
                }
            })
        }
    })
})

ipcMain.on('save-file', (event, data) => {
    dialog.showSaveDialog({
        defaultPath: __dirname,
        filters: [
            { name: 'Text file', extensions: ['txt'] },
            { name: 'All files', extensions: ['*'] }
        ]
    }).then(filename => {
        console.log(filename)
        if (filename.filePath) {
            console.log("data ",data)
            fs.writeFile(filename.filePath, Buffer.from(data), (err) => {
            })
        }
    })
})

app.on('ready', createWindow)