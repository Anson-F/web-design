# 酒谱 · Cocktail Atlas

一个可直接发布在 GitHub Pages 的静态鸡尾酒配方档案。界面为中文，支持按酒名、原料、基酒、IBA 标记与调制技法检索。

`order.html` 提供不含金额和付款环节的纯点单界面：选择酒款、调整数量、填写可选备注并生成可复制的点单纸。当前选择保存在浏览器本机。

## 数据来源

- [TheCocktailDB](https://www.thecocktaildb.com/)：公开 API 可读取的 A–Z / 0–9 配方、材料、用量、杯型、调制说明与更新时间。
- [International Bartenders Association](https://iba-world.com/cocktails/)：用于解释和核验 IBA 官方清单标记。

当前快照包含 441 款配方。它是公开来源在同步时刻可读取的集合，不宣称覆盖互联网上每一种自创或地区变体。每条详情保留原始记录入口。

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
