param (
    [string]$text
)

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synthesizer.SelectVoice("Microsoft Irina Desktop") # Change to your preferred voice
$synthesizer.Speak($text)
