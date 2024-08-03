const { spawn, exec} = require('child_process');
const path = require('path');
var fs = require('fs');
var out = fs.openSync('./out.log', 'a');
var err = fs.openSync('./out.log', 'a');

// Путь к аудиофайлу, который нужно воспроизвести
const audioFilePath = 'D:\\dev-projects\\jbot\\src\\tts\\gtts.wav';

// Путь к PowerShell-скрипту
const psScriptPath = path.join(__dirname, 'play2.ps1');

// Команда для запуска PowerShell-скрипта с параметром
// const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', psScriptPath], { shell: true, detached: true, stdio: [ 'ignore', out, err ] });
// const ps = exec('powershell.exe -c (New-Object Media.SoundPlayer "C:/Windows/Media/Ring06.wav").PlaySync();')
const ps = exec('powershell.exe -c (New-Object Media.SoundPlayer "C:/Windows/Media/аккорд.wav").PlaySync();')

// const ps = exec('powershell.exe -c (New-Object Media.SoundPlayer "C:/gtts.wav").PlaySync();')
// const ps = exec(`powershell -c (New-Object Media.SoundPlayer "D:/dev-projects/jbot/src/tts/gtts.wav").PlaySync();`)

ps.unref()

ps.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ps.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

ps.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);

    // Добавляем задержку перед завершением Node.js-скрипта
    setTimeout(() => {
        console.log('Node.js script finished');
    }, 10000); // 10 секунд задержки, при необходимости можно увеличить
});
