# Play a single file
Add-Type -AssemblyName presentationCore
$mediaPlayer = New-Object system.windows.media.mediaplayer
$mediaPlayer.open('D:\dev-projects\jbot\src\tts\speaking_528.wav')
$mediaPlayer.Play()