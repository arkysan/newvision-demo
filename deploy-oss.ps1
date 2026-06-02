# New Vision Demo — Deploy to Alibaba Cloud OSS (Hong Kong)
# Run this after setting up credentials: ossutil config

$ossutil = "C:\Users\ARKAI\AppData\Local\ossutil\ossutil-2.2.1-windows-amd64\ossutil.exe"
$bucket  = "oss://newvision-demo"
$region  = "oss-cn-hongkong"

Write-Host "Deploying New Vision demo to Alibaba Cloud OSS (Hong Kong)..."

# Upload index.html with correct content-type and cache headers
& $ossutil cp index.html "$bucket/index.html" `
  --force `
  --header "Content-Type:text/html;charset=utf-8" `
  --header "Cache-Control:public,max-age=300"

Write-Host ""
Write-Host "Live URL:"
Write-Host "http://newvision-demo.$region.aliyuncs.com/index.html"
Write-Host "http://newvision-demo.$region.aliyuncs.com"
