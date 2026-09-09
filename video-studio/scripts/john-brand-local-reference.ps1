$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$narrator = New-Object System.Speech.Synthesis.SpeechSynthesizer
$narrator.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
$narrator.SelectVoice('Microsoft Zira Desktop')
$narrator.Rate = 0
$narrator.SetOutputToWaveFile('D:\Develop_local\envitefy\video-studio\public\projects\john-space-disco\vo-create-sapi-reference.wav')
$narrator.SpeakSsml('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">Bring their birthday ideas to life with <phoneme alphabet="ipa" ph="ɛnˈvaɪtfaɪ">Envitefy</phoneme> Concierge.</speak>')
$narrator.Dispose()
Write-Output 'Created exact-IPA local synthetic speech reference.'
