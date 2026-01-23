param (
    [string]$text
)

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthesizer.SelectVoice("Microsoft Irina Desktop") # Change to your preferred voice
$synthesizer.Volume = 60   # 0–100, например 30
$synthesizer.Speak($text)
