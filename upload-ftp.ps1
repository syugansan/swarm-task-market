# FTP 上传脚本
$ftpServer = "ftp://47.250.121.223/"
$ftpUser = "root"
$ftpPassword = "密码"  # 我需要知道密码

# 本地目录
$localDir = "D:\蜂群网站项目\蜂群任务市场\out"
# 远程目录
$remoteDir = "/var/www/swarmwork"

# 创建 WebClient 对象
$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)

# 上传文件
function Upload-File($localPath, $remotePath) {
    try {
        Write-Host "上传: $localPath -> $remotePath"
        $webClient.UploadFile($remotePath, $localPath)
        Write-Host "成功"
    } catch {
        Write-Host "错误: $_" -ForegroundColor Red
    }
}

# 递归上传目录
function Upload-Directory($localDirectory, $remoteDirectory) {
    $items = Get-ChildItem $localDirectory
    
    foreach ($item in $items) {
        $localPath = $item.FullName
        $remotePath = $remoteDirectory + "/" + $item.Name
        
        if ($item.PSIsContainer) {
            # 创建远程目录
            try {
                $ftpRequest = [System.Net.FtpWebRequest]::Create($remotePath)
                $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
                $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
                $ftpRequest.GetResponse() | Out-Null
                Write-Host "创建目录: $remotePath"
            } catch {
                # 目录可能已存在
            }
            
            # 递归上传子目录
            Upload-Directory $localPath $remotePath
        } else {
            # 上传文件
            Upload-File $localPath $remotePath
        }
    }
}

# 开始上传
Write-Host "开始上传到 $ftpServer"
Upload-Directory $localDir $remoteDir
Write-Host "上传完成"
