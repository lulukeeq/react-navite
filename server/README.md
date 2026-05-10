# 记账 App 后端 (NestJS + TypeORM + MySQL)

为前端记账 app 提供：手机号+密码鉴权、增量同步、WebSocket 实时通知。

## 目录结构

```
server/
├── docker-compose.yml             # MySQL 8.4 + Adminer
├── .env.example
├── src/
│   ├── main.ts                    # bootstrap
│   ├── app.module.ts              # 根模块（TypeORM + 各业务模块）
│   ├── config/configuration.ts
│   ├── common/                    # 通用：JWT 守卫、CurrentUser 装饰器、Decimal transformer
│   ├── entities/                  # User / Category / Transaction / Budget
│   ├── auth/                      # 注册 / 登录 / 刷新 / JWT
│   ├── sync/                      # /sync/pull · /sync/push
│   └── realtime/                  # WebSocket gateway + notifier
└── package.json
```

## 启动步骤

```powershell
# 1. 启动 MySQL（首次会拉镜像）
pnpm db:up

# 2. 配置环境变量
copy .env.example .env
# 然后用 openssl rand -hex 32 之类生成 JWT_ACCESS_SECRET / JWT_REFRESH_SECRET 替换

# 3. 启动 dev server（开启文件监听）
pnpm start:dev
```

服务起在 `http://localhost:3000`，WebSocket 命名空间 `/realtime`。

数据库管理面板：`http://localhost:8080`（Adminer，server=mysql, user=bookkeeping, pwd=bookkeeping, db=bookkeeping）。

## REST API

所有 token 通过 `Authorization: Bearer <accessToken>` 传递。除 `/auth/*` 外都需登录。

### 注册

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"hunter22"}'
```

返回：

```json
{
  "user": { "id": "uuid", "phone": "13800138000" },
  "accessToken": "...",
  "refreshToken": "..."
}
```

注册时自动给该用户复制 12 个默认分类（餐饮/交通/...）。

### 登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"hunter22"}'
```

### 刷新 access token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### 拉增量（pull）

```bash
curl "http://localhost:3000/sync/pull?since=2026-05-01T00:00:00.000Z" \
  -H "Authorization: Bearer <accessToken>"
```

不带 `since` 时返回全量。返回结构：

```json
{
  "serverTime": "2026-05-11T10:00:00.000Z",
  "transactions": [{ "id":"uuid","userId":"...","type":"expense","amount":12.5,"categoryId":"...","note":"...","date":"2026-05-10","createdAt":"...","updatedAt":"...","deletedAt":null }],
  "categories":   [{ "id":"...","userId":"...","name":"餐饮","type":"expense","isCustom":false,"createdAt":"...","updatedAt":"...","deletedAt":null }],
  "budgets":      []
}
```

`deletedAt` 非 null 表示已被删除，客户端应同步移除本地副本。

### 推变更（push，outbox 批量提交）

```bash
curl -X POST http://localhost:3000/sync/push \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": {
      "upserts": [
        {
          "id": "8b5c2a76-3a1b-4c5e-9f37-1234567890ab",
          "type": "expense",
          "amount": 28.5,
          "categoryId": "<categoryId>",
          "note": "外卖",
          "date": "2026-05-11"
        }
      ],
      "deletes": []
    },
    "categories": { "upserts": [], "deletes": [] },
    "budgets":    { "upserts": [], "deletes": [] }
  }'
```

返回：

```json
{
  "serverTime": "2026-05-11T10:00:00.000Z",
  "accepted": { "transactions": 1, "categories": 0, "budgets": 0 }
}
```

约束：每个 upsert 列表 / deletes 列表最多 500 条；id 必须是 UUIDv4。

## WebSocket 实时通知

客户端 socket.io 连 `ws://localhost:3000/realtime`，握手时通过 `auth.token` 传 access token：

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000/realtime', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
socket.on('hello', (m) => console.log('connected as', m.userId));
socket.on('changed', ({ since }) => {
  // 服务端通知"你的数据有更新，时间戳 since 之后"
  // 客户端立即调用 GET /sync/pull?since=<lastSyncedAt>
});
socket.on('error', (e) => console.warn(e));
```

服务端在 `/sync/push` 写完后会向该用户的所有连接推 `changed`。**注意推送只是"通知拉新"**，不携带变更内容；客户端收到后调用 `/sync/pull` 拿增量。这样设计的好处：单事件丢失也能被下一次拉取自愈。

## 安全要点

- `JWT_ACCESS_SECRET` 与 `JWT_REFRESH_SECRET` **必须**改成随机长串
- 生产环境 `DB_SYNCHRONIZE=false` 并用迁移
- 生产环境必须 HTTPS
- 客户端 token 存 `expo-secure-store`，不要放 AsyncStorage

## 已知开发期取舍

- 注册手机号未做 OTP 验证（按用户决定）
- 软删除策略：客户端必须遵守"先 push outbox，再 pull"的顺序，否则被自己尚未推送的删除覆盖
- 冲突解决：last-write-wins（按 `updatedAt`），无字段级合并
- `/sync/push` 是事务性的，但分辨率仍是单条记录粒度
