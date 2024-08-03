param (
    [string]$path
)

Write-Output "Path: $path"

# Load the necessary assembly for MediaPlayer
Add-Type -AssemblyName presentationCore

# Create a new instance of MediaPlayer
$player = New-Object system.windows.media.mediaplayer

# Open the specified audio file
$player.Open([Uri]$path)

# Start playing the audio
$player.Play()

Write-Output "Playing audio..."

# Keep the script running while the audio is playing
# Adjust the sleep time as needed
while ($player.NaturalDuration.HasTimeSpan -and $player.Position -lt $player.NaturalDuration.TimeSpan) {
    Write-Output "Audio position: $($player.Position)"
    Start-Sleep -Seconds 1
}

Write-Output "Playback finished"

