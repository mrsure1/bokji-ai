$path = "c:\Users\LJY\Downloads\활용가이드_중앙부처복지서비스(v2.2).doc"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($path)
  $text = $doc.Content.Text
  $doc.Close()
  $text | Out-File -FilePath "D:\MrSure\bokji-ai\scripts\bokjiro-guide.txt" -Encoding utf8
  Write-Output "OK"
} finally {
  $word.Quit()
}
