# LingoFrame

LingoFrame 是一个基于真实英语视频的 AI 学习平台。用户输入 YouTube 视频链接，系统获取可用英文字幕，生成逐句课程、中文翻译、语法和俚语解释、TTS 发音练习，以及个人复习记录。

仓库：[github.com/ceyyy427/lingoframe](https://github.com/ceyyy427/lingoframe)

## 当前版本

- Web：Next.js + TypeScript
- Auth / Database：Supabase Magic Link + PostgreSQL + RLS
- AI：OpenAI Responses API 或 Anthropic
- 字幕：本机 `youtube-dl` 可执行文件
- 音频：OpenAI 转写和 TTS
- 后台：独立 lesson worker、Supabase RPC 原子抢占、worker heartbeat
- 复习：今日复习、困难句、间隔复习调度

## 安装前须知

1. 需要 Node.js 20 或更高版本。
2. 必须准备 Supabase 项目，并执行数据库 schema。
3. 至少配置一个 AI 服务：OpenAI 或 Anthropic。
4. 字幕获取依赖本机的 `youtube-dl`。项目只处理允许访问的字幕，不下载或重新分发第三方视频。
5. 课程生成是异步任务，必须同时运行 Web 服务和 lesson worker。
6. `SUPABASE_SERVICE_ROLE_KEY` 只能放在服务端环境变量中，不能提交到 GitHub。
7. 发音评分当前是“表达匹配度”，不是专业音素级发音评测。

## 本地安装

### 1. 获取代码

```bash
git clone https://github.com/ceyyy427/lingoframe.git
cd lingoframe
npm install
```

如果系统没有 Node.js，可以使用项目目录中的本地运行时：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
```

### 2. 安装 youtube-dl

macOS：

```bash
python3 -m pip install --user youtube_dl
which youtube-dl
```

如果命令不在 PATH 中，在 `.env.local` 中填写完整路径：

```env
YOUTUBE_DL_BIN=/Users/你的用户名/Library/Python/3.13/bin/youtube-dl
```

YouTube 站点变化可能导致旧版 `youtube-dl` 失效。生产环境建议评估 `yt-dlp`，并将 `YOUTUBE_DL_BIN` 指向经过验证的可执行文件。

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

最小配置：

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

AI_PROVIDER=openai
OPENAI_API_KEY=你的_OpenAI_Key
OPENAI_MODEL=gpt-4.1-mini

NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key

YOUTUBE_DL_BIN=youtube-dl
```

如果使用 Anthropic：

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=你的_Anthropic_Key
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

语音转写和 TTS 当前仍使用 OpenAI，因此即使文本分析使用 Anthropic，练习功能也需要 `OPENAI_API_KEY`。

### 4. 配置 Supabase

在 Supabase SQL Editor 中执行：

```text
supabase/schema.sql
```

如果之前执行过旧版本 schema，只执行：

```text
supabase/migrations/0002_learning_loop.sql
```

在 Supabase Auth 设置：

- Site URL：`http://localhost:3000`
- Redirect URL：`http://localhost:3000/auth/callback`

### 5. 启动 Web 服务和 worker

终端一：

```bash
npm run dev
```

终端二：

```bash
npm run worker
```

打开：[http://localhost:3000](http://localhost:3000)

检查 worker：

```bash
curl http://localhost:3000/api/health/worker
```

课程创建后，如果没有运行 worker，课程会停留在排队状态。生产环境必须把 worker 部署成独立的长期运行进程。

## 常用命令

```bash
npm run dev       # 开发服务器
npm run worker    # 后台课程处理 worker
npm test          # 自动化测试
npm run build     # 生产构建
npm run start     # 启动生产服务器
npm run lint      # ESLint
```

## 生产部署建议

Web 服务和 worker 应分开部署：

```text
Web 服务：Next.js host /api 和页面
后台服务：长期运行 npm run worker
数据库：Supabase PostgreSQL
文件和音频：按需配置私有对象存储
监控：定期检查 /api/health/worker
```

不要把 worker 放到一次性 Serverless 请求中，因为字幕获取和 AI 分析可能超过请求生命周期。生产环境还应配置进程自动重启、日志收集和 Supabase 数据备份。

## 故障排查

### 课程一直显示“排队中”

确认 worker 正在运行：

```bash
npm run worker
```

再检查：

```bash
curl http://localhost:3000/api/health/worker
```

### 找不到 youtube-dl

检查：

```bash
which youtube-dl
echo "$YOUTUBE_DL_BIN"
```

### 没有英文字幕

不是所有视频都有可访问的英文字幕。请更换视频，或在产品后续版本中接入用户授权的字幕/文本上传。

### Supabase 登录成功但页面没有数据

确认已经执行 schema 或 migration，并检查 Supabase Auth 的回调地址是否完全匹配当前域名。

## 隐私、版权和安全

- 不要将 `.env.local`、API key 或 Supabase service role key 提交到仓库。
- 只处理你有权访问和用于学习的字幕内容。
- 产品默认嵌入原平台视频，不重新分发第三方视频文件。
- 用户录音应设置保存期限和删除策略；当前 MVP 主要保存转写结果和练习成绩。
- 发布前应补充正式隐私政策、服务条款、版权投诉流程和每日用量限制。

## Releases 和 Packages

GitHub Releases 页面：[查看 Releases](https://github.com/ceyyy427/lingoframe/releases)

当前首个公开版本为 `v0.1.0`。本项目是一个网站应用，不是 npm package，因此 GitHub Packages 暂不发布内容。

## License

本项目使用 [MIT License](./LICENSE)。
