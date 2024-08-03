const path = require('path');
const Powershell = require('node-powershell');

// Путь к аудиофайлу, который нужно воспроизвести
const audioFilePath = 'D:\\dev-projects\\jbot\\src\\tts\\gtts.wav';

// Путь к PowerShell-скрипту
const psScriptPath = path.join(__dirname, 'play.ps1');

// Создаем экземпляр PowerShell
const ps = new Powershell.PowerShell({
    executionPolicy: 'Bypass',
    noProfile: true
});

// Добавляем команду
ps.invoke(psScriptPath, [{ path: audioFilePath }]);

// Выполняем команду
ps.invoke()
    .then(output => {
        console.log(output);
    })
    .catch(err => {
        console.error(err);
    });
