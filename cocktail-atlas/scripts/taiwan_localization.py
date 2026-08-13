#!/usr/bin/env python3
"""Taiwan Traditional Chinese terminology shared by generated site assets."""

from __future__ import annotations

import re

from opencc import OpenCC


TO_TAIWAN = OpenCC("s2twp")

# These are locale choices, not generic Simplified-to-Traditional character
# substitutions. Longer phrases are matched first so a drink name such as
# 「金湯力」 is localized as a whole before the generic 「金酒」 rule applies.
TAIWAN_PHRASES: dict[str, str] = {
    # Canonical cocktail names used by Taiwan menus and cocktail publications.
    "拉莫斯金菲士": "拉莫斯琴費士",
    "皇家金酒菲士": "皇家琴酒費士",
    "干马天尼": "乾馬丁尼",
    "汤姆柯林斯": "湯姆可林斯",
    "约翰柯林斯": "約翰可林斯",
    "胜利柯林斯": "勝利可林斯",
    "金汤力": "琴通寧",
    "金菲士": "琴費士",
    "莫吉托": "莫希托",
    "代基里": "黛綺莉",
    "马天尼": "馬丁尼",
    "柯林斯": "可林斯",
    "菲士": "費士",
    # Spirits, modifiers, produce, and soft drinks.
    "151 proof 朗姆酒": "151 proof 蘭姆酒",
    "黑糖蜜朗姆酒": "黑糖蜜蘭姆酒",
    "马利宝椰子朗姆酒": "Malibu 椰香蘭姆酒",
    "百加得柠檬朗姆酒": "Bacardí 檸檬蘭姆酒",
    "金朗姆酒": "金色蘭姆酒",
    "白朗姆酒": "白蘭姆酒",
    "深色朗姆酒": "深色蘭姆酒",
    "香料朗姆酒": "香料蘭姆酒",
    "陈年朗姆酒": "陳年蘭姆酒",
    "朗姆酒": "蘭姆酒",
    "朗姆": "蘭姆",
    "黑刺李金酒": "黑刺李琴酒",
    "金酒": "琴酒",
    "龙舌兰酒": "龍舌蘭",
    "龙舌兰": "龍舌蘭",
    "干味美思": "不甜苦艾酒",
    "甜味美思": "甜苦艾酒",
    "红味美思": "紅苦艾酒",
    "味美思": "苦艾酒",
    "蓝橙力娇酒": "藍柑橘香甜酒",
    "蓝柑橘": "藍柑橘",
    "力娇酒": "香甜酒",
    "利口酒": "香甜酒",
    "金万利橙酒": "Grand Marnier 柑曼怡香橙酒",
    "黑加仑": "黑醋栗",
    "青柠": "萊姆",
    "西柚": "葡萄柚",
    "菠萝": "鳳梨",
    "番石榴": "芭樂",
    "奇异果": "奇異果",
    "橙汁": "柳橙汁",
    "橙子": "柳橙",
    "橙片": "柳橙片",
    "橙皮": "柳橙皮",
    "橙味": "柳橙風味",
    "黄瓜": "小黃瓜",
    "红糖": "黑糖",
    "蛋清": "蛋白",
    "浓缩咖啡": "義式濃縮咖啡",
    "黄油": "奶油",
    "打发奶油": "打發鮮奶油",
    "淡奶油": "鮮奶油",
    "浓奶油": "鮮奶油",
    "酸奶": "優格",
    "汤力水": "通寧水",
    "汤力": "通寧",
    "柠檬青柠汽水": "檸檬萊姆汽水",
    "鲜榨": "現榨",
    # Barware and techniques used in Taiwan vocational and cocktail sources.
    "碟形香槟杯": "飛碟香檳杯",
    "笛形香槟杯": "香檳杯",
    "柯林杯": "可林杯",
    "摇酒壶": "雪克杯",
    "摇酒器": "雪克杯",
    "吧勺": "吧叉匙",
    "调酒杯": "攪拌杯",
    "鸡尾酒杯": "雞尾酒杯",
    "鸡尾酒": "調酒",
    "马天尼杯": "馬丁尼杯",
    "香槟": "香檳",
    # Taiwan product and interface vocabulary.
    "当前": "目前",
    "原料": "材料",
    "配方": "酒譜",
    "搜索": "搜尋",
    "数据": "資料",
    "信息": "資訊",
    "质量": "品質",
    "网络": "網路",
    "打印": "列印",
    "加载": "載入",
    "保存": "儲存",
    "设置": "設定",
    "链接": "連結",
    "反馈": "回饋",
    "鼠标": "滑鼠",
    "程序": "程式",
    "软饮": "無酒精飲料",
    "混合饮品": "一般調酒",
    "开启摇酒器": "打開雪克杯",
    "吧台": "吧檯",
    "柜台": "吧檯",
    "还可输入": "尚可輸入",
}

# OpenCC correctly handles general Taiwan vocabulary but cannot know that 托 is
# phonetic in Mojito. These narrow post-conversion repairs protect canonical
# names without changing the character everywhere else.
TAIWAN_POST_PHRASES: dict[str, str] = {
    "莫希託": "莫希托",
}

_PHRASE_PATTERN = re.compile(
    "|".join(re.escape(phrase) for phrase in sorted(TAIWAN_PHRASES, key=len, reverse=True))
)


def to_taiwan(value: str) -> str:
    """Convert site-authored Simplified Chinese into Taiwan Traditional Chinese."""

    localized = _PHRASE_PATTERN.sub(lambda match: TAIWAN_PHRASES[match.group(0)], str(value))
    localized = TO_TAIWAN.convert(localized)
    for source, target in TAIWAN_POST_PHRASES.items():
        localized = localized.replace(source, target)
    return localized
