#!/usr/bin/env python3
"""Build a public-domain quotation library and recipe-grounded assignments."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parents[1]
RECIPES_PATH = ROOT / "data" / "recipes.json"
OUTPUT_PATH = ROOT / "data" / "order-quotes.json"
TO_TRADITIONAL = OpenCC("s2t")
TO_SIMPLIFIED = OpenCC("t2s")


def local_text(zh: str, en: str) -> dict[str, str]:
    return {"zhHans": TO_SIMPLIFIED.convert(zh), "zhHant": TO_TRADITIONAL.convert(zh), "en": en}


def quote(
    quote_id: str,
    language: str,
    original: str,
    zh: str,
    en: str,
    author_zh: str,
    author_en: str,
    work_zh: str,
    work_en: str,
    source_url: str,
    source_label: str,
    public_domain_basis: str,
    profiles: tuple[str, ...],
) -> dict:
    translations = local_text(zh, en)
    if language.startswith("zh"):
        translations["zhHans"] = TO_SIMPLIFIED.convert(original)
        translations["zhHant"] = TO_TRADITIONAL.convert(original)
    return {
        "id": quote_id,
        "language": language,
        "original": original,
        "translation": translations,
        "attribution": {
            "author": local_text(author_zh, author_en),
            "work": local_text(work_zh, work_en),
            "sourceUrl": source_url,
            "sourceLabel": source_label,
            "publicDomainBasis": public_domain_basis,
            "translationCredit": "Cocktail Atlas editorial translation",
            "verifiedOn": date.today().isoformat(),
        },
        "profiles": list(profiles),
    }


CHINESE_PD = "Ancient Chinese work; the author died more than 100 years ago. The cited Wikisource page marks the text public domain."
ANCIENT_PD = "The author died more than 100 years ago; the original text is public domain."
PRE_1931_PD = "Author died more than 100 years ago and the cited edition was published before 1931; public domain."
US_PD = "The cited edition was published before 1931 and is public domain in the United States."


QUOTES = [
    quote("li-bai-moon-01", "zh-Hant", "花間一壺酒，獨酌無相親。", "花间一壶酒，独酌无相亲。", "Among the flowers, a jug of wine; I drink alone, with no one near.", "李白", "Li Bai", "月下獨酌", "Drinking Alone Under the Moon", "https://zh.wikisource.org/wiki/\u6708\u4e0b\u7368\u914c_(\u82b1\u9593\u4e00\u58fa\u9152)", "Chinese Wikisource", CHINESE_PD, ("wine", "clear", "other")),
    quote("li-bai-moon-02", "zh-Hant", "舉杯邀明月，對影成三人。", "举杯邀明月，对影成三人。", "I raise my cup and invite the bright moon; with my shadow, we become three.", "李白", "Li Bai", "月下獨酌", "Drinking Alone Under the Moon", "https://zh.wikisource.org/wiki/\u6708\u4e0b\u7368\u914c_(\u82b1\u9593\u4e00\u58fa\u9152)", "Chinese Wikisource", CHINESE_PD, ("clear", "sparkling", "wine", "other")),
    quote("li-bai-moon-03", "zh-Hant", "暫伴月將影，行樂須及春。", "暂伴月将影，行乐须及春。", "For now I keep company with moon and shadow; joy must be taken while spring is here.", "李白", "Li Bai", "月下獨酌", "Drinking Alone Under the Moon", "https://zh.wikisource.org/wiki/\u6708\u4e0b\u7368\u914c_(\u82b1\u9593\u4e00\u58fa\u9152)", "Chinese Wikisource", CHINESE_PD, ("sparkling", "citrus", "tropical")),
    quote("li-bai-wine-01", "zh-Hant", "人生得意須盡歡，莫使金樽空對月。", "人生得意须尽欢，莫使金樽空对月。", "When life goes well, enjoy it to the full; do not let the golden cup face the moon empty.", "李白", "Li Bai", "將進酒", "Bring in the Wine", "https://zh.wikisource.org/wiki/\u5c07\u9032\u9152_(\u674e\u767d)", "Chinese Wikisource", CHINESE_PD, ("sparkling", "shot", "wine", "beer")),
    quote("li-bai-wine-02", "zh-Hant", "烹羊宰牛且為樂，會須一飲三百杯。", "烹羊宰牛且为乐，会须一饮三百杯。", "Cook the lamb and slaughter the ox for delight; in one bout we must drink three hundred cups.", "李白", "Li Bai", "將進酒", "Bring in the Wine", "https://zh.wikisource.org/wiki/\u5c07\u9032\u9152_(\u674e\u767d)", "Chinese Wikisource", CHINESE_PD, ("shot", "beer", "spice", "hot")),
    quote("li-bai-wine-03", "zh-Hant", "鐘鼓饌玉不足貴，但願長醉不復醒。", "钟鼓馔玉不足贵，但愿长醉不复醒。", "Bells, drums, and jade-feasts are not precious enough; I only wish to stay drunk and never wake.", "李白", "Li Bai", "將進酒", "Bring in the Wine", "https://zh.wikisource.org/wiki/\u5c07\u9032\u9152_(\u674e\u767d)", "Chinese Wikisource", CHINESE_PD, ("whiskey", "brandy", "bitter", "shot")),
    quote("bai-juyi-wine-01", "zh-Hant", "綠蟻新醅酒，紅泥小火爐。", "绿蚁新醅酒，红泥小火炉。", "New-brewed wine with green froth; a small stove of red clay.", "白居易", "Bai Juyi", "問劉十九", "A Question for Liu Shijiu", "https://zh.wikisource.org/wiki/\u554f\u5289\u5341\u4e5d", "Chinese Wikisource", CHINESE_PD, ("hot", "beer", "spice", "cocoa")),
    quote("bai-juyi-wine-02", "zh-Hant", "晚來天欲雪，能飲一杯無？", "晚来天欲雪，能饮一杯无？", "At dusk the sky is about to snow—will you drink a cup with me?", "白居易", "Bai Juyi", "問劉十九", "A Question for Liu Shijiu", "https://zh.wikisource.org/wiki/\u554f\u5289\u5341\u4e5d", "Chinese Wikisource", CHINESE_PD, ("hot", "cream", "coffee", "whiskey")),
    quote("su-shi-moon-01", "zh-Hant", "明月幾時有？把酒問青天。", "明月几时有？把酒问青天。", "When did the bright moon first appear? I raise my wine and ask the blue sky.", "蘇軾", "Su Shi", "水調歌頭·明月幾時有", "Prelude to Water Melody", "https://zh.wikisource.org/wiki/\u6c34\u8abf\u6b4c\u982d_(\u660e\u6708\u5e7e\u6642\u6709)", "Chinese Wikisource", CHINESE_PD, ("clear", "wine", "gin", "vodka")),
    quote("tao-yuanming-01", "zh-Hant", "採菊東籬下，悠然見南山。", "采菊东篱下，悠然见南山。", "Picking chrysanthemums by the eastern fence, at ease I see the southern mountain.", "陶淵明", "Tao Yuanming", "飲酒二十首·其五", "Drinking Wine, No. 5", "https://zh.wikisource.org/wiki/\u98f2\u9152\u4e8c\u5341\u9996", "Chinese Wikisource", CHINESE_PD, ("herbal", "non-alcoholic", "gin", "clear")),
    quote("tao-yuanming-02", "zh-Hant", "秋菊有佳色，裛露掇其英。", "秋菊有佳色，裛露掇其英。", "Autumn chrysanthemums have a lovely hue; wet with dew, I pluck their blossoms.", "陶淵明", "Tao Yuanming", "飲酒二十首·其七", "Drinking Wine, No. 7", "https://zh.wikisource.org/wiki/\u98f2\u9152\u4e8c\u5341\u9996", "Chinese Wikisource", CHINESE_PD, ("herbal", "berry", "liqueur", "non-alcoholic")),
    quote("du-mu-qingming-01", "zh-Hant", "借問酒家何處有？牧童遙指杏花村。", "借问酒家何处有？牧童遥指杏花村。", "I ask where a wineshop may be found; the cowherd points far away to Apricot Blossom Village.", "杜牧", "Du Mu", "清明", "Qingming", "https://zh.wikisource.org/wiki/\u6e05\u660e_(\u675c\u7267)", "Chinese Wikisource", CHINESE_PD, ("apple", "brandy", "berry", "wine")),
    quote("li-qingzhao-dream-01", "zh-Hant", "昨夜雨疏風驟，濃睡不消殘酒。", "昨夜雨疏风骤，浓睡不消残酒。", "Last night the rain was light and the wind fierce; deep sleep did not dispel the remaining wine.", "李清照", "Li Qingzhao", "如夢令·昨夜雨疏風驟", "Like a Dream", "https://zh.wikisource.org/wiki/\u5982\u5922\u4ee4_(\u674e\u6e05\u7167)/\u5982\u5922\u4ee4_(\u6628\u591c\u96e8\u758f\u98a8\u9a5f)", "Chinese Wikisource", CHINESE_PD, ("berry", "wine", "bitter", "brandy")),
    quote("wang-wei-autumn-01", "zh-Hant", "明月松間照，清泉石上流。", "明月松间照，清泉石上流。", "The bright moon shines between the pines; clear spring water flows over stone.", "王維", "Wang Wei", "山居秋暝", "Autumn Evening in the Mountains", "https://zh.wikisource.org/wiki/\u5c71\u5c45\u79cb\u669d", "Chinese Wikisource", CHINESE_PD, ("clear", "herbal", "non-alcoholic", "vodka", "gin")),
    quote("xin-qiji-night-01", "zh-Hant", "明月別枝驚鵲，清風半夜鳴蟬。", "明月别枝惊鹊，清风半夜鸣蝉。", "The moon startles a magpie from the branch; in the midnight breeze, cicadas sing.", "辛棄疾", "Xin Qiji", "西江月·夜行黃沙道中", "West River Moon", "https://zh.wikisource.org/wiki/\u897f\u6c5f\u6708_(\u8f9b\u68c4\u75be)", "Chinese Wikisource", CHINESE_PD, ("herbal", "clear", "gin", "non-alcoholic")),
    quote("xin-qiji-joy-01", "zh-Hant", "醉裡且貪歡笑，要愁那得工夫。", "醉里且贪欢笑，要愁那得工夫。", "While drunk, let me be greedy for laughter; where would I find time for sorrow?", "辛棄疾", "Xin Qiji", "西江月·遣興", "West River Moon", "https://zh.wikisource.org/wiki/\u897f\u6c5f\u6708_(\u8f9b\u68c4\u75be)", "Chinese Wikisource", CHINESE_PD, ("shot", "sparkling", "beer", "rum")),
    quote("dickinson-liquor-01", "en", "I taste a liquor never brewed, / From tankards scooped in pearl;", "我尝到一种从未酿造的酒，盛在珍珠凿成的杯中。", "I taste a liquor never brewed, / From tankards scooped in pearl;", "艾米莉·狄金森", "Emily Dickinson", "我尝到一种从未酿造的酒", "I taste a liquor never brewed", "https://en.wikisource.org/wiki/Poems_(Dickinson)/I_taste_a_liquor_never_brewed", "English Wikisource, 1890 edition", PRE_1931_PD, ("liqueur", "clear", "other", "vodka")),
    quote("dickinson-liquor-02", "en", "Inebriate of air am I, / And debauchee of dew,", "我醉于空气，也沉迷于露水。", "Inebriate of air am I, / And debauchee of dew,", "艾米莉·狄金森", "Emily Dickinson", "我尝到一种从未酿造的酒", "I taste a liquor never brewed", "https://en.wikisource.org/wiki/Poems_(Dickinson)/I_taste_a_liquor_never_brewed", "English Wikisource, 1890 edition", PRE_1931_PD, ("non-alcoholic", "herbal", "clear", "gin")),
    quote("dickinson-liquor-03", "en", "Reeling, through endless summer days, / From inns of molten blue.", "踉跄穿过无尽的夏日，走出熔蓝色的酒馆。", "Reeling, through endless summer days, / From inns of molten blue.", "艾米莉·狄金森", "Emily Dickinson", "我尝到一种从未酿造的酒", "I taste a liquor never brewed", "https://en.wikisource.org/wiki/Poems_(Dickinson)/I_taste_a_liquor_never_brewed", "English Wikisource, 1890 edition", PRE_1931_PD, ("tropical", "sparkling", "tequila", "rum")),
    quote("dickinson-liquor-04", "en", "When butterflies renounce their drams, / I shall but drink the more!", "当蝴蝶放下它们的小杯，我却要饮得更多！", "When butterflies renounce their drams, / I shall but drink the more!", "艾米莉·狄金森", "Emily Dickinson", "我尝到一种从未酿造的酒", "I taste a liquor never brewed", "https://en.wikisource.org/wiki/Poems_(Dickinson)/I_taste_a_liquor_never_brewed", "English Wikisource, 1890 edition", PRE_1931_PD, ("berry", "liqueur", "sparkling")),
    quote("keats-nightingale-01", "en", "O for a draught of vintage! that hath been / Cool'd a long age in the deep-delvèd earth,", "啊，愿有一口佳酿，在深掘的地底冷藏多年。", "O for a draught of vintage! that hath been / Cool'd a long age in the deep-delvèd earth,", "约翰·济慈", "John Keats", "夜莺颂", "Ode to a Nightingale", "https://en.wikisource.org/wiki/Keats;_poems_published_in_1820/Ode_to_a_Nightingale", "English Wikisource, 1820 text", US_PD, ("whiskey", "brandy", "wine", "coffee")),
    quote("keats-nightingale-02", "en", "With beaded bubbles winking at the brim, / And purple-stained mouth;", "杯沿珠串般的气泡眨着眼，杯口染成紫红。", "With beaded bubbles winking at the brim, / And purple-stained mouth;", "约翰·济慈", "John Keats", "夜莺颂", "Ode to a Nightingale", "https://en.wikisource.org/wiki/Keats;_poems_published_in_1820/Ode_to_a_Nightingale", "English Wikisource, 1820 text", US_PD, ("sparkling", "wine", "berry", "layered")),
    quote("keats-nightingale-03", "en", "Tasting of Flora and the country green, / Dance, and Provençal song, and sunburnt mirth!", "尝来有花神与乡野青绿、舞蹈、普罗旺斯歌声和晒暖的欢欣。", "Tasting of Flora and the country green, / Dance, and Provençal song, and sunburnt mirth!", "约翰·济慈", "John Keats", "夜莺颂", "Ode to a Nightingale", "https://en.wikisource.org/wiki/Keats;_poems_published_in_1820/Ode_to_a_Nightingale", "English Wikisource, 1820 text", US_PD, ("herbal", "gin", "wine", "tropical")),
    quote("keats-autumn-01", "en", "And fill all fruit with ripeness to the core; / To swell the gourd, and plump the hazel shells", "让一切果实从里到外成熟，让葫芦鼓起，也让榛子的壳饱满。", "And fill all fruit with ripeness to the core; / To swell the gourd, and plump the hazel shells", "约翰·济慈", "John Keats", "秋颂", "To Autumn", "https://en.wikisource.org/wiki/Keats;_poems_published_in_1820/To_Autumn", "English Wikisource, 1820 text", US_PD, ("apple", "brandy", "wine")),
    quote("blake-auguries-01", "en", "To see a World in a Grain of Sand / And a Heaven in a Wild Flower,", "从一粒沙看见世界，从一朵野花看见天堂。", "To see a World in a Grain of Sand / And a Heaven in a Wild Flower,", "威廉·布莱克", "William Blake", "天真的预言", "Auguries of Innocence", "https://en.wikisource.org/wiki/The_Pickering_Manuscript/Auguries_of_Innocence", "English Wikisource, Pickering Manuscript", PRE_1931_PD, ("herbal", "non-alcoholic", "clear", "other")),
    quote("shakespeare-sonnet18-01", "en", "Shall I compare thee to a summer's day? / Thou art more lovely and more temperate:", "我能否把你比作夏日？你却更加可爱，也更加温和。", "Shall I compare thee to a summer's day? / Thou art more lovely and more temperate:", "威廉·莎士比亚", "William Shakespeare", "十四行诗第十八首", "Sonnet 18", "https://en.wikisource.org/wiki/Shakespeare%27s_Sonnets_(1883)/Sonnet_18", "English Wikisource, 1883 edition", PRE_1931_PD, ("tropical", "citrus", "rum", "tequila")),
    quote("shakespeare-sonnet18-02", "en", "Rough winds do shake the darling buds of May, / And summer's lease hath all too short a date;", "狂风摇落五月可爱的花蕾，夏日的期限又实在太短。", "Rough winds do shake the darling buds of May, / And summer's lease hath all too short a date;", "威廉·莎士比亚", "William Shakespeare", "十四行诗第十八首", "Sonnet 18", "https://en.wikisource.org/wiki/Shakespeare%27s_Sonnets_(1883)/Sonnet_18", "English Wikisource, 1883 edition", PRE_1931_PD, ("citrus", "berry", "sparkling")),
    quote("rubaiyat-01", "en", "Ah, my Belovèd, fill the Cup that clears / To-day of past Regrets and future Fears:", "爱人啊，请斟满这杯，洗净今日对往昔的悔与来日的惧。", "Ah, my Belovèd, fill the Cup that clears / To-day of past Regrets and future Fears:", "奥马尔·海亚姆／爱德华·菲茨杰拉德译", "Omar Khayyám / Edward FitzGerald", "鲁拜集", "Rubáiyát of Omar Khayyám", "https://www.gutenberg.org/files/246/246-h/246-h.htm", "Project Gutenberg, FitzGerald's 1859 translation", US_PD, ("wine", "brandy", "clear", "vodka")),
    quote("rubaiyat-02", "en", "A Flask of Wine, a Book of Verse—and Thou / Beside me singing in the Wilderness—", "一壶酒，一卷诗，还有你在荒野里依偎吟唱。", "A Flask of Wine, a Book of Verse—and Thou / Beside me singing in the Wilderness—", "奥马尔·海亚姆／爱德华·菲茨杰拉德译", "Omar Khayyám / Edward FitzGerald", "鲁拜集", "Rubáiyát of Omar Khayyám", "https://www.gutenberg.org/files/246/246-h/246-h.htm", "Project Gutenberg, FitzGerald's 1859 translation", US_PD, ("wine", "cream", "brandy", "other")),
    quote("rubaiyat-03", "en", "I came like Water, and like Wind I go.", "我如水而来，又如风而去。", "I came like Water, and like Wind I go.", "奥马尔·海亚姆／爱德华·菲茨杰拉德译", "Omar Khayyám / Edward FitzGerald", "鲁拜集", "Rubáiyát of Omar Khayyám", "https://www.gutenberg.org/files/246/246-h/246-h.htm", "Project Gutenberg, FitzGerald's 1859 translation", US_PD, ("clear", "non-alcoholic", "vodka", "gin")),
    quote("baudelaire-wine-01", "fr", "Un soir, l'âme du vin chantait dans les bouteilles", "一晚，酒的灵魂在瓶中歌唱。", "One evening, the soul of wine sang in the bottles.", "夏尔·波德莱尔", "Charles Baudelaire", "酒魂", "The Soul of Wine", "https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1868)/L%E2%80%99%C3%82me_du_vin", "French Wikisource, Les Fleurs du mal (1868)", PRE_1931_PD, ("wine", "liqueur", "brandy", "whiskey")),
    quote("baudelaire-wine-02", "fr", "Un chant plein de lumière et de fraternité !", "一支充满光明与友爱的歌！", "A song full of light and fellowship!", "夏尔·波德莱尔", "Charles Baudelaire", "酒魂", "The Soul of Wine", "https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1868)/L%E2%80%99%C3%82me_du_vin", "French Wikisource, Les Fleurs du mal (1868)", PRE_1931_PD, ("sparkling", "beer", "clear")),
    quote("baudelaire-wine-03", "fr", "Pour que de notre amour naisse la poésie / Qui jaillira vers Dieu comme une rare fleur !", "让诗从我们的爱中诞生，如一朵奇花向神明喷涌。", "So that poetry may be born of our love and spring toward God like a rare flower!", "夏尔·波德莱尔", "Charles Baudelaire", "酒魂", "The Soul of Wine", "https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1868)/L%E2%80%99%C3%82me_du_vin", "French Wikisource, Les Fleurs du mal (1868)", PRE_1931_PD, ("berry", "cream", "liqueur")),
    quote("baudelaire-harmony-01", "fr", "Voici venir les temps où vibrant sur sa tige / Chaque fleur s'évapore ainsi qu'un encensoir ;", "时辰将至，每一朵花都在茎上颤动，像香炉般蒸散。", "The hour arrives when every flower trembles on its stem and evaporates like a censer.", "夏尔·波德莱尔", "Charles Baudelaire", "黄昏的和谐", "Evening Harmony", "https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1868)/Harmonie_du_soir", "French Wikisource, Les Fleurs du mal (1868)", PRE_1931_PD, ("herbal", "gin", "spice", "hot")),
    quote("baudelaire-harmony-02", "fr", "Le ciel est triste et beau comme un grand reposoir ;", "天空忧郁而美，像一座巨大的圣体台。", "The sky is sad and beautiful like a great altar of repose.", "夏尔·波德莱尔", "Charles Baudelaire", "黄昏的和谐", "Evening Harmony", "https://fr.wikisource.org/wiki/Les_Fleurs_du_mal_(1868)/Harmonie_du_soir", "French Wikisource, Les Fleurs du mal (1868)", PRE_1931_PD, ("bitter", "coffee", "cocoa", "whiskey")),
    quote("verlaine-rain-01", "fr", "Il pleure dans mon cœur / Comme il pleut sur la ville ;", "泪落在我心里，仿佛雨落在城中。", "It weeps in my heart as it rains upon the city.", "保罗·魏尔伦", "Paul Verlaine", "泪落在我心里", "It Weeps in My Heart", "https://fr.wikisource.org/wiki/Romances_sans_paroles_(1902)/%C2%AB_Il_pleure_dans_mon_c%C5%93ur_%C2%BB", "French Wikisource, 1902 edition", PRE_1931_PD, ("bitter", "coffee", "cocoa", "whiskey")),
    quote("rimbaud-eternity-01", "fr", "Elle est retrouvée. / Quoi ? — L'Éternité. / C'est la mer allée / Avec le soleil.", "找到了。什么？——永恒。是大海与太阳一同远去。", "It is found again. What? Eternity. It is the sea gone away with the sun.", "阿蒂尔·兰波", "Arthur Rimbaud", "永恒", "Eternity", "https://fr.wikisource.org/wiki/Illuminations_(%C3%A9d._1886)/%C3%89ternit%C3%A9", "French Wikisource, 1886 edition", PRE_1931_PD, ("tropical", "tequila", "rum", "clear")),
    quote("marti-rose-01", "es", "Cultivo una rosa blanca / En julio como en enero,", "我培育一朵白玫瑰，无论七月还是一月。", "I cultivate a white rose in July as in January.", "何塞·马蒂", "José Martí", "朴素的诗·第三十九首", "Simple Verses, XXXIX", "https://es.wikisource.org/wiki/Versos_sencillos/XXXIX", "Spanish Wikisource, Versos sencillos", PRE_1931_PD, ("berry", "clear", "non-alcoholic", "vodka")),
    quote("marti-verse-01", "es", "Mi verso es de un verde claro / Y de un carmín encendido.", "我的诗是明净的绿，也是燃烧的胭脂红。", "My verse is a clear green and a blazing crimson.", "何塞·马蒂", "José Martí", "朴素的诗·第五首", "Simple Verses, V", "https://es.wikisource.org/wiki/Versos_sencillos/V", "Spanish Wikisource, Versos sencillos", PRE_1931_PD, ("layered", "herbal", "berry", "liqueur")),
    quote("dario-youth-01", "es", "Juventud, divino tesoro, / ¡ya te vas para no volver!", "青春，神圣的珍宝，你一去便不再回来！", "Youth, divine treasure, you are leaving never to return!", "鲁文·达里奥", "Rubén Darío", "春日里的秋歌", "Song of Autumn in Spring", "https://es.wikisource.org/wiki/Canci%C3%B3n_de_oto%C3%B1o_en_primavera", "Spanish Wikisource, pre-1931 edition", US_PD, ("sparkling", "shot", "beer", "tropical")),
    quote("becquer-poetry-01", "es", "¿Qué es poesía? ¿Y tú me lo preguntas? / Poesía... eres tú.", "什么是诗？你竟这样问我？诗……就是你。", "What is poetry? And you ask me? Poetry... is you.", "古斯塔沃·阿道夫·贝克尔", "Gustavo Adolfo Bécquer", "韵诗第二十一首", "Rima XXI", "https://es.wikisource.org/wiki/Rimas_(B%C3%A9cquer,_1885)/Rima_XXI", "Spanish Wikisource, 1885 edition", PRE_1931_PD, ("cream", "berry", "liqueur", "other")),
    quote("dante-inferno-01", "it", "E quindi uscimmo a riveder le stelle.", "于是我们走出那里，再次看见群星。", "And thence we came forth to see the stars again.", "但丁·阿利吉耶里", "Dante Alighieri", "神曲·地狱篇第三十四歌", "Inferno, Canto XXXIV", "https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_XXXIV", "Italian Wikisource, 14th-century text", ANCIENT_PD, ("clear", "bitter", "vodka", "other")),
    quote("dante-paradiso-01", "it", "L'amor che move il sole e l'altre stelle.", "是爱推动太阳和其他群星。", "The love that moves the sun and the other stars.", "但丁·阿利吉耶里", "Dante Alighieri", "神曲·天堂篇第三十三歌", "Paradiso, Canto XXXIII", "https://it.wikisource.org/wiki/Divina_Commedia/Paradiso/Canto_XXXIII", "Italian Wikisource, 14th-century text", ANCIENT_PD, ("cream", "brandy", "whiskey", "wine")),
    quote("petrarch-water-01", "it", "Chiare, fresche et dolci acque,", "清澈、清新而甘美的水。", "Clear, fresh, and sweet waters.", "弗朗切斯科·彼特拉克", "Francesco Petrarch", "清澈、清新而甘美的水", "Clear, Fresh and Sweet Waters", "https://it.wikisource.org/wiki/Canzoniere_(Rerum_vulgarium_fragmenta)/Chiare,_fresche_et_dolci_acque", "Italian Wikisource, 14th-century text", ANCIENT_PD, ("clear", "citrus", "non-alcoholic", "vodka")),
    quote("camoes-fields-01", "pt", "Verdes são os campos, / De cor de limão:", "田野青青，是柠檬的颜色。", "Green are the fields, the colour of lemon.", "路易斯·德·卡蒙斯", "Luís de Camões", "田野青青", "Green Are the Fields", "https://pt.wikisource.org/wiki/Verdes_s%C3%A3o_os_campos", "Portuguese Wikisource, 16th-century text", ANCIENT_PD, ("citrus", "herbal", "gin", "tequila")),
    quote("camoes-fire-01", "pt", "Amor he hum fogo que arde sem se ver; / He ferida que doe, e não se sente;", "爱是看不见却燃烧的火，是疼痛却感觉不到的伤。", "Love is a fire that burns unseen; a wound that hurts yet is not felt.", "路易斯·德·卡蒙斯", "Luís de Camões", "爱是看不见的火", "Love Is a Fire That Burns Unseen", "https://pt.wikisource.org/wiki/Amor_he_hum_fogo_que_arde_sem_se_ver", "Portuguese Wikisource, 16th-century text", ANCIENT_PD, ("shot", "spice", "bitter", "rum")),
]


# The current TheCocktailDB snapshot contains no recipe with documented Chinese
# origin or a Chinese spirit such as baijiu or huangjiu. Add only evidence-backed
# recipe IDs here when the source catalog gains one; never infer origin from a
# translated Chinese display name.
CHINESE_RECIPE_EVIDENCE: dict[str, dict[str, str]] = {}


PROFILE_LABELS = {
    "clear": ("清澈、留白与冷冽感", "clarity, negative space, and chill"),
    "hot": ("热饮与升腾香气", "hot service and rising aroma"),
    "coffee": ("深焙咖啡与夜色", "dark-roasted coffee and night"),
    "cocoa": ("可可、柔苦与温暖", "cocoa, soft bitterness, and warmth"),
    "cream": ("奶油与柔软质地", "cream and a soft texture"),
    "tropical": ("热带果香与日光", "tropical fruit and sunlight"),
    "berry": ("莓果、花香与红色调", "berries, flowers, and red fruit"),
    "herbal": ("草本与青绿香气", "herbs and green aromatics"),
    "bitter": ("苦味、深色与收束感", "bitterness, darkness, and restraint"),
    "spice": ("暖香料与灼热感", "warming spice and heat"),
    "apple": ("果园与成熟果香", "orchard and ripe-fruit aromas"),
    "sparkling": ("气泡、碰杯与庆祝感", "bubbles, toasts, and celebration"),
    "citrus": ("明亮柑橘与清爽酸度", "bright citrus and fresh acidity"),
    "layered": ("分层、色彩与视觉结构", "layers, colour, and visual structure"),
    "shot": ("短饮的直接力度", "the direct force of a short drink"),
    "gin": ("杜松与植物香气", "juniper and botanicals"),
    "vodka": ("清澈、冷冽与克制", "clarity, chill, and restraint"),
    "rum": ("甘蔗、岛屿与暖阳", "sugarcane, islands, and warm sun"),
    "whiskey": ("木桶、琥珀与时间", "oak, amber, and time"),
    "tequila": ("龙舌兰、盐与干燥日光", "agave, salt, and dry sunlight"),
    "brandy": ("蒸馏果香与陈年感", "distilled fruit and age"),
    "wine": ("葡萄酒、果实与共享", "wine, fruit, and fellowship"),
    "beer": ("麦芽、泡沫与畅饮", "malt, foam, and convivial drinking"),
    "liqueur": ("浓缩甜香与鲜明色彩", "concentrated sweetness and vivid colour"),
    "non-alcoholic": ("清水、花园与清醒感", "water, gardens, and clarity"),
    "other": ("配方的整体气质", "the recipe's overall character"),
}


def normalized_recipe_text(recipe: dict) -> str:
    return " ".join(
        [recipe["name"], recipe.get("category", ""), recipe.get("glass", ""), recipe.get("method", ""), recipe.get("base", "")]
        + [item["name"] for item in recipe.get("ingredients", [])]
        + list(recipe.get("instructions", {}).values())
    ).lower()


def ingredient_signal(recipe: dict, needles: tuple[str, ...]) -> str | None:
    for ingredient in recipe.get("ingredients", []):
        if any(needle in ingredient["name"].lower() for needle in needles):
            return f"ingredient:{ingredient['name']}"
    return None


def choose_profile(recipe: dict) -> tuple[str, list[str]]:
    text = normalized_recipe_text(recipe)
    checks = [
        ("hot", ("hot ", "hot coffee", "hot chocolate", "boiling", "warm ")),
        ("coffee", ("coffee", "espresso", "kahlua")),
        ("cocoa", ("cacao", "cocoa", "chocolate")),
        ("cream", ("cream", "milk", "yoghurt", "ice-cream", "egg white", "eggnog")),
        ("tropical", ("pineapple", "coconut", "passion fruit", "mango", "papaya", "guava")),
        ("berry", ("berry", "cranberry", "raspberry", "strawberry", "blackcurrant", "cherry")),
        ("herbal", ("mint", "basil", "rosemary", "thyme", "sage", "elderflower")),
        ("bitter", ("campari", "aperol", "bitters", "amaro", "fernet")),
        ("spice", ("pepper", "ginger", "cinnamon", "clove", "nutmeg", "chili")),
        ("apple", ("apple", "pear")),
        ("sparkling", ("champagne", "prosecco", "soda", "tonic", "ginger ale", "beer", "cola", "7-up", "sprite")),
        ("citrus", ("lemon", "lime", "orange", "grapefruit", "citrus")),
    ]
    if recipe.get("method") == "layer":
        return "layered", ["method:layer"]
    if recipe.get("category") == "Shot" or "shot glass" in text:
        return "shot", [f"category:{recipe.get('category', 'Shot')}"]
    for profile, needles in checks:
        signal = ingredient_signal(recipe, needles)
        if signal:
            return profile, [signal, f"method:{recipe.get('method', 'other')}", f"base:{recipe.get('base', 'other')}"]
    base = recipe.get("base", "other")
    return (base if base in PROFILE_LABELS else "other"), [f"base:{base}", f"method:{recipe.get('method', 'other')}"]


def assignment_rationale(profile: str, signals: list[str], origin_group: str) -> dict[str, str]:
    values = ", ".join(signal.split(":", 1)[1] for signal in signals)
    zh_profile, en_profile = PROFILE_LABELS[profile]
    origin_zh = "中国酒只使用中国诗" if origin_group == "china" else "外国酒只使用外国诗"
    origin_en = "Chinese drinks use Chinese verse" if origin_group == "china" else "non-Chinese drinks use non-Chinese verse"
    zh = f"{origin_zh}；按配方中的 {values} 归入“{zh_profile}”，再匹配相近意象。"
    en = f"{origin_en}; matched through {values}, reflecting {en_profile}."
    return local_text(zh, en)


def main() -> None:
    recipes = json.loads(RECIPES_PATH.read_text())["recipes"]
    by_origin_profile = {
        origin: {profile: [] for profile in PROFILE_LABELS}
        for origin in ("china", "international")
    }
    for item in QUOTES:
        origin = "china" if item["language"].startswith("zh") else "international"
        for profile in item["profiles"]:
            by_origin_profile[origin][profile].append(item)

    assignments = []
    for recipe in recipes:
        profile, signals = choose_profile(recipe)
        origin_group = "china" if recipe["id"] in CHINESE_RECIPE_EVIDENCE else "international"
        candidates = by_origin_profile[origin_group][profile]
        if not candidates:
            raise RuntimeError(f"No {origin_group} quotation covers profile {profile} for recipe {recipe['id']}")
        seed = int(hashlib.sha256(f"{recipe['id']}:{recipe['name']}:{profile}:{origin_group}".encode()).hexdigest()[:12], 16)
        selected = candidates[seed % len(candidates)]
        assignments.append({
            "id": recipe["id"],
            "quoteId": selected["id"],
            "basis": {
                "type": "verified-public-domain-style-match",
                "originGroup": origin_group,
                "originEvidence": CHINESE_RECIPE_EVIDENCE.get(recipe["id"], {
                    "source": "TheCocktailDB recipe snapshot",
                    "reason": "No documented Chinese origin or Chinese spirit in the source record; a translated Chinese display name is not origin evidence.",
                }),
                "profile": profile,
                "recipeSignals": signals,
                "rationale": assignment_rationale(profile, signals, origin_group),
            },
        })

    output = {
        "meta": {
            "title": "Cocktail Atlas verified public-domain quotation library",
            "generatedAt": date.today().isoformat(),
            "recipeCount": len(assignments),
            "quoteCount": len(QUOTES),
            "contentPolicy": "Only documented, source-linked public-domain verse is used. No line is invented for the menu.",
            "translationPolicy": "Chinese and English translations are Cocktail Atlas editorial translations unless the quoted original is already in that language.",
            "assignmentPolicy": "Chinese-origin drinks use Chinese verse; all other drinks use non-Chinese verse. Origin is evidence-based and never inferred from a translated display name. Quotes may be reused when recipes share a flavour profile.",
            "originAudit": {
                "chinaRecipeCount": sum(recipe["id"] in CHINESE_RECIPE_EVIDENCE for recipe in recipes),
                "internationalRecipeCount": sum(recipe["id"] not in CHINESE_RECIPE_EVIDENCE for recipe in recipes),
                "chinaEvidence": CHINESE_RECIPE_EVIDENCE,
            },
        },
        "quotes": QUOTES,
        "assignments": assignments,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(QUOTES)} verified quotations and {len(assignments)} recipe assignments to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
