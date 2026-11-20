`data/QuotesHeart.csv`存在少量已知错误，先不要用于难以重复的重要分析

## 恢复数据并运行分析

首次检出后，在仓库根目录运行以下命令。系统需要安装Git LFS、Python 3和7-Zip，并能在`PATH`中找到`7zz`、`7z`或`7za`

```sh
git lfs install
git lfs pull
python3 scripts/extract_data.py
uv run src/explore.py
```

|Git LFS归档|解压后的路径|
|---|---|
|`archives/eye-tracking.7z`|`data/eye_tracking/eyetracking/`|
|`archives/schema-paintings.7z`|`experiment/Schema paintings/`|
|`archives/imotions-intro.7z`|`iMotions_intro.mp4`|

解压后的路径已加入`.gitignore`。脚本可重复运行，会补齐缺失文件并保留已有文件。如果归档更新后需要替换同名文件，先移走对应的旧文件，再运行脚本
