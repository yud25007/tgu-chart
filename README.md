# 学分记录表自动生成器

一个本地/服务器均可运行的网页工具，用于从 Excel 名单或批量粘贴文本生成 Word 学分记录表。

## 功能

- 网页端填写活动名称、日期、学分类型、默认加分数量。
- 上传 `.xlsx` 名单或批量粘贴名单文本。
- 自动识别班级、姓名、学号、加分数量。
- 支持“思政学分记录表”和“实践学分记录表”标题切换。
- 自动按人数扩展 Word 表格行。
- SQLite 保存历史记录，支持载入、下载和删除。
- 管理后台可查看最近登录、在线人数和在线 IP。

## 本地启动

首次使用先准备本地环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env`，至少设置：

```text
AUTH_PASSWORD=your-login-password
```

然后启动：

```bash
python3 app.py
```

或双击：

```text
start_web.command
```

## Docker 部署

```bash
cp .env.example .env
docker compose up -d --build
```

健康检查：

```bash
curl http://127.0.0.1:18095/health
```

## Git 安全约定

仓库不会提交以下内容：

- `.env`
- `wrangler.toml`
- `.wrangler/`
- `data/`
- `output/`
- SQLite 数据库
- Playwright 临时截图与快照

公开部署配置请从 `wrangler.example.toml` 复制生成真实 `wrangler.toml`。
