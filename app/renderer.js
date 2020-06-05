const { ipcRenderer } = require('electron')

$(document).ready(function () {

    const rc4 = {
        inputEncode: "",
        outputEncode: "",
        inputDecode: "",
        outputDecode: "",
    }
    const rsa = {
        inputEncode: "",
        outputEncode: "",
        inputDecode: "",
        outputDecode: "",
    }
    const aes = {
        inputEncode: "",
        outputEncode: "",
        inputDecode: "",
        outputDecode: "",
    }

    $('#btn-login').click(function () {
        window.location.href = "./index.html"
    })
    // aes algorithm
    const aesEncryptionButton = $('#aes-encryption .get-result')
    const aesEncryptionMessage = $('#aes-encryption #message')
    const aesEncryptionPassword = $('#aes-encryption #key')
    const aesEncryptionResult = $('#aes-encryption #result')

    const aesDecryptionButton = $('#aes-decryption .get-result')
    const aesDecryptionMessage = $('#aes-decryption #message')
    const aesDecryptionPassword = $('#aes-decryption #key')
    const aesDecryptionResult = $('#aes-decryption #result')

    ipcRenderer.on('aes-encryption-reply', (event, args) => {
        console.log("--------aes-encryption-reply------------")
        console.log(args)
        aes.outputEncode = Buffer.from(args, 'base64');
        aesEncryptionResult.val(aes.outputEncode.toString("base64").substring(0,400))
    })

    ipcRenderer.on('aes-decryption-reply', (event, args) => {
        //console.log(args)
        aes.outputDecode = Buffer.from(args, 'base64');
        aesDecryptionResult.val(aes.outputEncode.toString("base64").substring(0,400))
    })

    aesDecryptionButton.click(function () {
        console.log('aes decryption')
        ipcRenderer.send('aes-decryption', {
            message: aes.inputDecode,
            password: aesDecryptionPassword.val()
        })
    })
    aesEncryptionButton.click(function () {
        // console.log('aes encryption')
        ipcRenderer.send('aes-encryption', {
            message: aes.inputEncode,
            password: aesEncryptionPassword.val()
        })
    })


    // rc4 algorithm
    const rc4EncryptionButton = $('#rc4-encryption .get-result')
    const rc4EncryptionPassword = $('#rc4-encryption #key')
    const rc4EncryptionResult = $('#rc4-encryption #result')

    const rc4DecryptionButton = $('#rc4-decryption .get-result')
    const rc4DecryptionPassword = $('#rc4-decryption #key')
    const rc4DecryptionResult = $('#rc4-decryption #result')

    ipcRenderer.on('rc4-encryption-reply', (event, args) => {
        rc4.outputEncode = Buffer.from(args);
        rc4EncryptionResult.val(rc4.outputEncode.toString("base64").substring(0,400));
    })

    ipcRenderer.on('rc4-decryption-reply', (event, args) => {
        rc4.outputDecode = Buffer.from(args);
        rc4DecryptionResult.val(rc4.outputDecode.toString("base64").substring(0,400))
    })

    rc4EncryptionButton.click(function () {
        ipcRenderer.send('rc4-encryption', {
            message: rc4.inputEncode,
            password: rc4EncryptionPassword.val()
        })
    })

    rc4DecryptionButton.click(function () {
        ipcRenderer.send('rc4-decryption', {
            message: rc4.inputDecode,
            password: rc4DecryptionPassword.val()
        })
    })

    // rsa algorithm
    ipcRenderer.on('rsa-encryption-reply', (event, result) => {
        console.log("result ", result)
        rsa.outputEncode = Buffer.from(result);
        $('#rsa-encryption #result').val(rsa.outputEncode.toString("base64").substring(0,400))
    })

    ipcRenderer.on('rsa-decryption-reply', (event, result) => {
        rsa.outputDecode = Buffer.from(result);
        $('#rsa-decryption #result').val(rsa.outputDecode.toString("base64").substring(0,400))
    })

    ipcRenderer.on('rsa-genkey-reply', (event, result) => {
        const { publicKey, privateKey } = result
        $('#rsa-genkey #rsa-public-key').val(publicKey)
        $('#rsa-genkey #rsa-private-key').val(privateKey)
    })

    $('#rsa-encryption .get-result').click(function () {
        ipcRenderer.send('rsa-encryption', {
            message: rsa.inputEncode,
            publicKey: $('#rsa-encryption #rsa-encrypt-key').val()
        })
    })

    $('#rsa-decryption .get-result').click(() => {
        ipcRenderer.send('rsa-decryption', {
            message: rsa.inputDecode,
            privateKey: $('#rsa-decryption #key').val()
        })
    })

    $('#rsa-genkey .get-result').click(() => {
        ipcRenderer.send('rsa-genkey')
    })


    // Handle file open and save
    const loading = $('.loading')
    let currentTextarea

    ipcRenderer.on('open-file-reply', function (event, result) {
        console.log("Event", result)
        if (result) {
            switch (result[1]) {
                case "open-rsa-en":
                    rsa.inputEncode = Buffer.from(result[0]);
                    currentTextarea.val(rsa.inputEncode.toString("base64").substring(0,400));
                    break;
                case "open-rsa-de":
                    rsa.inputDecode = Buffer.from(result[0]);
                    currentTextarea.val(rsa.inputDecode.toString("base64").substring(0,400));
                    break;
                case "open-rc4-en":
                    rc4.inputEncode = Buffer.from(result[0]);
                    currentTextarea.val(rc4.inputEncode.toString("base64").substring(0,400));
                    break;
                case "open-rc4-de":
                    rc4.inputDecode = Buffer.from(result[0]);
                    currentTextarea.val(rc4.inputDecode.toString("base64").substring(0,400));
                    break;
                case "open-aes-en":
                    aes.inputEncode = Buffer.from(result[0]);
                    currentTextarea.val(aes.inputEncode.toString("base64").substring(0,400));
                    break;
                case "open-aes-de":
                    aes.inputDecode = Buffer.from(result[0]);
                    currentTextarea.val(aes.inputDecode.toString("base64").substring(0,400));
                    break;
                default:
                    console.log("No thing");
                    break;
            }
        }
        loading.removeClass('show')
    })

    $('.file-button.open').click(function (e) {
        try {
            currentTextarea = $(this).siblings('textarea')
            ipcRenderer.send('open-file', e.target.id)
            loading.addClass('show')
        }
        catch (err) {
            loading.removeClass('show')
        }
    })

    ipcRenderer.on('save-file-reply', (event, result) => {
        loading.removeClass('show')
    })

    $('.file-button.save').click(function (e) {
        try {

            switch (e.target.id) {
                case "save-rsa-en":
                    ipcRenderer.send('save-file', rsa.outputEncode);
                    break;
                case "save-rsa-de":
                    ipcRenderer.send('save-file', rsa.outputDecode);
                    break;
                case "save-rc4-en":
                    ipcRenderer.send('save-file', rc4.outputEncode);
                    break;
                case "save-rc4-de":
                    ipcRenderer.send('save-file', rc4.outputDecode);
                    break;
                case "save-aes-en":
                    ipcRenderer.send('save-file', aes.outputEncode);
                    break;
                case "save-aes-de":
                    ipcRenderer.send('save-file', aes.outputDecode);
                    break;
                default:
                    console.log("Not support");
                    break;
            }
        }
        catch (err) {
            loading.removeClass('show')
        }
    })
});