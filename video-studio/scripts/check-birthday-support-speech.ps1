Add-Type -AssemblyName System.Speech
$taskSpeechResults = @()
foreach ($taskSpeechKind in @('original','v1','v2')) {
  $taskRecognizer = [System.Speech.Recognition.SpeechRecognitionEngine]::new([System.Globalization.CultureInfo]::GetCultureInfo('en-US'))
  $taskRecognizer.LoadGrammar([System.Speech.Recognition.DictationGrammar]::new())
  $taskRecognizer.InitialSilenceTimeout = [TimeSpan]::FromSeconds(4)
  $taskRecognizer.EndSilenceTimeout = [TimeSpan]::FromMilliseconds(250)
  $taskRecognizer.SetInputToWaveFile((Join-Path $PWD ('projects/birthday-support/'+$taskSpeechKind+'-speech.wav')))
  $taskSegments = @()
  while ($null -ne ($taskRecognition = $taskRecognizer.Recognize())) {
    $taskSegments += @{text=$taskRecognition.Text; confidence=$taskRecognition.Confidence; start=$taskRecognition.Audio.AudioPosition.TotalSeconds; duration=$taskRecognition.Audio.Duration.TotalSeconds}
  }
  $taskSpeechResults += @{kind=$taskSpeechKind;segments=$taskSegments}
  $taskRecognizer.Dispose()
}
$taskSpeechResults | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath 'projects/birthday-support/offline-speech-review-v2.json'
$taskSpeechResults | ConvertTo-Json -Depth 8
