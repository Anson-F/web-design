# 酒谱 · Cocktail Atlas

一个可直接发布在 GitHub Pages 的静态鸡尾酒配方档案。界面支持中文和英文，可按酒名、原料、基酒、IBA 标记与调制技法检索。

网站支持中文与英文切换，并在浏览器中记忆语言偏好。中文模式将中文酒名作为主标题、英文原名作为小号副标题；英文模式仅显示英文酒名。`data/name-zh.json` 保存中文酒名映射，同步配方时会自动合并。

`order.html` 提供不含金额和付款环节的纯点单界面：选择酒款、调整数量、填写可选备注并生成可复制的点单纸。当前选择保存在浏览器本机。

每一款配方都有一张独立的 3:5 竖版海报，保存在 `assets/posters/`。海报使用 `gc-minimal-zine-poster-v0-1` 的 Standard Mode 生成：大面积旧纸留白、微型代表性酒体、稀疏排版与单一高彩度点色。生成前会根据原始配方核对杯型、酒体颜色、冰型、泡沫与装饰；原型照片只作造型证据，不会复制或随站点重新发布。

## 数据来源

- [TheCocktailDB](https://www.thecocktaildb.com/)：公开 API 可读取的 A–Z / 0–9 配方、材料、用量、杯型、调制说明与更新时间。
- [International Bartenders Association](https://iba-world.com/cocktails/)：用于解释和核验 IBA 官方清单标记。

当前快照包含 441 款配方。它是公开来源在同步时刻可读取的集合，不宣称覆盖互联网上每一种自创或地区变体。每条详情保留原始记录入口。

`data/visual-manifest.json` 记录每张海报的来源证据、配方视觉推断、生成提示词、资产路径和人工 QA 状态。当前 441 张海报均已逐张检查；不符合杯型、单杯数量或代表性特征的版本会用更严格的提示词重做。

## 本地预览

在仓库根目录启动静态服务器，然后访问 `/cocktail-atlas/`：

```sh
python3 -m http.server 8000
```

## 更新配方快照

Node.js 18+：

```sh
node cocktail-atlas/scripts/sync-recipes.mjs
```

生成文件为 `cocktail-atlas/data/recipes.json`。更新后请检查收录量、空字段和网页筛选行为再提交。

## 更新视觉证据与检查海报

同步配方后，可重新建立视觉清单：

```sh
node cocktail-atlas/scripts/build-visual-manifest.mjs
```

该命令会访问 TheCocktailDB 官方 API；生成图片本身仍需通过图像生成工具逐张完成。海报写入后运行完整性检查：

```sh
python3 cocktail-atlas/scripts/test-posters.py
```

浏览器回归测试需要 Python Playwright 与 Chromium，并要求先从仓库根目录在 `8765` 端口启动静态服务器：

```sh
python3 cocktail-atlas/scripts/test-ui.py
python3 cocktail-atlas/scripts/test-localization.py
python3 cocktail-atlas/scripts/test-order.py
```
