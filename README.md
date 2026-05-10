# 记账 App (React Native + Expo)

一个学习用的简单记账 app，支持记录收入/支出、按分类统计、本地持久化。

## 技术栈

- **Expo (SDK 54)** + **TypeScript** — 跨平台开发，Windows 上无需 Android Studio 即可调试
- **React Navigation** — Bottom Tabs（账单 / 统计）+ Native Stack（记一笔模态页）
- **Zustand** — 轻量状态管理
- **AsyncStorage** — 本地持久化
- **react-native-safe-area-context** — 安全区适配

## 目录结构

```
.
├── App.tsx                       # 入口：导航容器 + 路由表
├── index.ts                      # Expo 启动入口
├── src/
│   ├── types.ts                  # Transaction / Category 类型 + 默认分类
│   ├── store.ts                  # Zustand store（含 hydrate / add / remove）
│   ├── utils.ts                  # 金额、日期格式化
│   ├── components/
│   │   ├── SummaryCard.tsx       # 月度汇总卡片
│   │   └── TransactionItem.tsx   # 单条交易行（长按删除）
│   └── screens/
│       ├── HomeScreen.tsx        # 账单列表 + 月汇总 + FAB
│       ├── AddScreen.tsx         # 记一笔（金额/分类/备注）
│       └── StatsScreen.tsx       # 按分类的支出占比
└── tsconfig.json
```

## 启动

```bash
npm install        # 首次运行
npm start          # 启动 Metro bundler
# 或
npm run android    # 启动并连接 Android 模拟器/真机
npm run web        # 浏览器预览
```

启动后用手机的 **Expo Go** app 扫描二维码即可在真机上预览。

## 数据模型

```ts
type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;          // 元
  categoryId: string;
  note: string;
  date: string;            // ISO 字符串
};
```

所有交易记录序列化后存在 AsyncStorage 的 `@bookkeeping/transactions` key 下。
App 启动时通过 `useStore.hydrate()` 恢复。

## 后续可扩展

- 编辑/筛选交易、按月切换
- 自定义分类（增删改）
- 预算 & 提醒
- 图表（victory-native / react-native-svg-charts）
- 导出 CSV / 云同步（Supabase / Firebase）
- 切换到 expo-sqlite 以支持更大数据量与查询
