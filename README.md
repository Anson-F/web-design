# 酒谱 · Cocktail Atlas

一个可直接发布在 GitHub Pages 的静态鸡尾酒配方档案。界面支持简体中文、台湾繁中和英文，可按酒名、原料、基酒、IBA 标记与调制技法检索。

网站支持简体中文、台湾繁中（`zh-TW`）与英文切换，并在浏览器中记忆语言偏好。中文模式将中文酒名作为主标题、英文原名作为小号副标题；英文模式仅显示英文酒名。`data/name-zh.json` 保存简体中文酒名映射，`data/instruction-zh.json` 保存经校订的简体中文步骤，`data/zh-hant.json` 保存 441 款酒名与步骤的台湾繁中版本。

中文配方使用当代中文酒吧语境，不采用逐词机翻：`shot` 保留英文，`shot glass` 写作“shot 杯”，`shaker` 写作“摇酒壶”，`rocks / old fashioned glass` 写作“古典杯”，`gin`、`tonic`、`lime` 分别使用“金酒”“汤力水”“青柠”。原料与用量的界面译名集中在 `cocktail-terms.js`，便于持续审校并保证详情、搜索、复制配方和点单卡片用词一致。

台湾繁中不是简体版本的逐字转码，而是独立的地区本地化层。酒名与材料采用台湾酒吧常用的「莫希托」「黛綺莉」「琴酒」「蘭姆酒」「萊姆」「通寧水」，酒具与技法采用「雪克杯」「吧叉匙」「可林杯」「搖盪」等用语，界面使用「搜尋」「資料」「儲存」等台湾产品语汇。共用规则在 `scripts/taiwan_localization.py`，会同时生成浏览器运行时词组表和 `data/zh-hant.json`；引文中的古典中文原诗不经过地区化转换，保持来源原文。

`order.html` 提供不含金额和付款环节的纯点单界面：选择酒款、调整数量、填写可选备注并生成可复制的点单纸。当前选择保存在浏览器本机。

配方目录的每一款酒都使用横向杂志跨页结构：酒名与英文原名置于 3:5 海报的上方留白，右侧展示材料与精确用量，底部保留技法、杯型和打开详情的箭头。手机端改为海报在上、配方在下；配方详情仍提供完整材料、步骤、复制和加入点单功能。

点单酒单改为可触控左右滑动的 3:5 酒卡：海报作为整张卡片的纸面，酒名、真实诗句、作者与作品、原料和“加入”按钮都排入海报留白。支持触摸滑动、触控板/鼠标滚轮、键盘方向键和前后按钮，并使用 CSS Scroll Snap 定位。

每款酒都匹配一条已出版且可追溯的公版诗句，数据记录在 `data/order-quotes.json`。匹配首先遵守地域规则：中国起源酒款只使用中国诗，其他国家和地区的酒款只使用非中国诗；酒款归属必须有来源或中国基酒证据，不能因为界面显示中文译名便算作中国酒。当前 441 款来源快照中没有一款具备可核验的中国起源或白酒、黄酒等中国基酒证据，因此全部进入外国诗池；中文诗仍保留在引文库中，供未来收录的中国酒使用。

当前引文库包含中文、英语、法语、西班牙语、意大利语和葡萄牙语原文；每条都有作者、作品、来源页、公版依据与核验日期。非中文原文会附本站编辑中文翻译；英文界面中的中文原诗会附本站编辑英文翻译。相近风格的酒可以共享同一句真实诗，真实性、地域和配方契合度优先于人为制造的唯一性。

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
python3 cocktail-atlas/scripts/localize-recipes-zh.py
python3 cocktail-atlas/scripts/build-traditional-localization.py
```

生成文件为 `cocktail-atlas/data/recipes.json`。同步脚本会优先复用已校订的 `instruction-zh.json`，避免第三方机翻覆盖中文文案；本地化脚本会统一酒名、步骤和术语，随后生成繁体资产。更新后请检查收录量、空字段和网页筛选行为再提交。

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
python3 cocktail-atlas/scripts/test-chinese-copy.py
python3 cocktail-atlas/scripts/test-taiwan-localization.py
python3 cocktail-atlas/scripts/test-recipe-spreads.py
python3 cocktail-atlas/scripts/test-order.py
python3 cocktail-atlas/scripts/test-order-quotes.py
```

配方快照更新后，可重新生成真实引文的配方匹配与繁体资产：

```sh
python3 cocktail-atlas/scripts/generate-order-quotes.py
python3 cocktail-atlas/scripts/build-traditional-localization.py
```
