#!/usr/bin/env python3
"""Build original, recipe-grounded micro-poems for the order menu."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parents[1]
RECIPES_PATH = ROOT / "data" / "recipes.json"
OUTPUT_PATH = ROOT / "data" / "order-poetry.json"
TO_TRADITIONAL = OpenCC("s2t")


MOTIONS = [
    ("落进", "settles into"),
    ("穿过", "passes through"),
    ("照亮", "lights"),
    ("贴近", "draws close to"),
    ("唤醒", "wakes"),
    ("藏进", "hides within"),
    ("划开", "cuts across"),
    ("绕过", "circles"),
]


PROFILES = {
    "hot": {
        "subjects": [("杯中的暖雾", "Warm mist in the cup"), ("一缕热香", "A warm ribbon of aroma"), ("升起的蒸汽", "Rising steam"), ("慢慢发亮的温度", "A slowly brightening warmth"), ("掌心收住的热意", "Warmth held in the palm"), ("夜里的一盏暖光", "A small warm light at night")],
        "objects": [("窗上的薄雾", "the mist on the window"), ("迟归人的掌心", "the palm of someone home late"), ("冬夜最安静的一刻", "winter's quietest moment"), ("杯口缓慢的呼吸", "the cup's unhurried breath"), ("雨声停下的地方", "the place where rain falls quiet"), ("尚未冷却的故事", "a story not yet cooled")],
    },
    "coffee": {
        "subjects": [("深焙的夜色", "The dark roast of night"), ("咖啡的苦香", "Coffee's bitter perfume"), ("一枚醒着的黑月", "A wakeful black moon"), ("烘焙后的微光", "A glow after roasting"), ("杯底低沉的香气", "The low aroma at the glass bottom"), ("午夜留下的浓影", "The dense shadow midnight leaves")],
        "objects": [("奶油柔软的边缘", "cream's soft edge"), ("烈酒醒着的心口", "the wakeful heart of the spirit"), ("凌晨尚亮的窗", "a window still lit before dawn"), ("冰块清脆的回声", "the clear echo of ice"), ("甜味退后的余韵", "the finish after sweetness recedes"), ("夜班最后一盏灯", "the last light of the night shift")],
    },
    "cocoa": {
        "subjects": [("可可色的暮云", "A cocoa-colored dusk cloud"), ("巧克力的暗潮", "Chocolate's dark tide"), ("一层柔苦的棕影", "A softly bitter brown shadow"), ("杯里的天鹅绒夜", "A velvet night in the cup"), ("烘烤后的甜黑", "Roasted sweetness in the dark"), ("可可缓慢的回声", "Cocoa's lingering echo")],
        "objects": [("奶香落下的地方", "the place where cream settles"), ("冰霜柔软的边缘", "frost's softened edge"), ("甜味最深的一层", "the deepest layer of sweetness"), ("夜色温厚的褶皱", "the warm folds of night"), ("杯底未说完的话", "the words unfinished at the bottom"), ("一口绵长的安静", "one long, quiet sip")],
    },
    "cream": {
        "subjects": [("奶油色的云", "A cream-colored cloud"), ("柔白的酒体", "The drink's soft white body"), ("一层丝滑月光", "A layer of silky moonlight"), ("杯中缓慢的雪", "Slow snow in the glass"), ("甜香织成的雾", "Mist woven from sweetness"), ("泡沫柔软的冠冕", "A soft crown of foam")],
        "objects": [("烈酒锋利的边角", "the spirit's sharp corners"), ("冰面安静的光", "the quiet light on ice"), ("甜点之后的夜", "the night after dessert"), ("杯壁细小的冷意", "the small chill of the glass"), ("舌尖短暂的冬天", "a brief winter on the tongue"), ("香气最圆润的地方", "the roundest part of the aroma")],
    },
    "tropical": {
        "subjects": [("热带果香的风", "A wind of tropical fruit"), ("菠萝色的日光", "Pineapple-colored sunlight"), ("椰林外的潮声", "The tide beyond the coconut palms"), ("一片成熟的夏天", "A slice of ripe summer"), ("果汁明亮的浪", "A bright wave of fruit"), ("岛屿吹来的甜风", "A sweet wind from the islands")],
        "objects": [("碎冰搭起的海岸", "a shore built of crushed ice"), ("朗姆醒着的午后", "rum's wakeful afternoon"), ("杯沿小小的落日", "the small sunset on the rim"), ("柑橘翻白的浪头", "a citrus wave turning white"), ("舞曲尚热的尾声", "the still-warm end of a dance"), ("棕榈影里的盐光", "salt light beneath palm shadows")],
    },
    "berry": {
        "subjects": [("莓果压低的红", "The low red of berries"), ("一束酸甜的绯光", "A crimson beam of tart sweetness"), ("果皮留下的晚霞", "Sunset left by berry skins"), ("杯中深红的雨", "Deep red rain in the glass"), ("浆果轻微的锋芒", "The small edge of berries"), ("一颗成熟的红星", "A ripe red star")],
        "objects": [("冰块透明的棱角", "the clear angles of ice"), ("甜味刚好的阴影", "sweetness's measured shadow"), ("柑橘明亮的酸意", "citrus's bright tartness"), ("杯壁渐冷的晚霞", "sunset cooling on the glass"), ("夜色最鲜艳的一笔", "the night's brightest stroke"), ("舌尖短促的花火", "a brief spark on the tongue")],
    },
    "herbal": {
        "subjects": [("新叶揉开的绿意", "Green fragrance released from fresh leaves"), ("薄荷醒来的风", "The wind when mint wakes"), ("草本清凉的影子", "The cool shadow of herbs"), ("一把刚摘的青绿", "A handful of freshly picked green"), ("叶脉里的清香", "Fresh aroma in the leaf veins"), ("花园最轻的呼吸", "The garden's lightest breath")],
        "objects": [("碎冰洁白的石径", "a white path of crushed ice"), ("柑橘打开的清晨", "the morning citrus opens"), ("杯口升起的小风", "the small breeze rising from the rim"), ("朗姆温热的影子", "rum's warm shadow"), ("夏夜尚湿的石阶", "the still-damp steps of summer night"), ("苏打明亮的气泡", "soda's bright bubbles")],
    },
    "bitter": {
        "subjects": [("苦味端正的红", "Bitterness in a composed red"), ("橙皮点亮的暗色", "Darkness lit by orange peel"), ("一笔克制的绯红", "A restrained stroke of crimson"), ("草本缓慢的苦香", "The slow bitter perfume of herbs"), ("杯底沉着的红光", "A steady red glow at the bottom"), ("黄昏收紧的味道", "The tightening taste of dusk")],
        "objects": [("甜味退后的一步", "the step behind sweetness"), ("冰块方正的沉默", "the square silence of ice"), ("夜色整齐的衣襟", "night's neatly folded lapel"), ("橙油短暂的火光", "orange oil's brief flame"), ("第一口之后的安静", "the quiet after the first sip"), ("杯中不偏不倚的平衡", "the glass's exact balance")],
    },
    "spice": {
        "subjects": [("香料细小的火", "The small fire of spice"), ("姜与胡椒的暖锋", "The warm edge of ginger and pepper"), ("肉桂写下的褐光", "Brown light written by cinnamon"), ("一粒辛香的星", "A small star of spice"), ("舌尖升起的暖意", "Warmth rising on the tongue"), ("香料在杯中醒来", "Spice waking in the glass")],
        "objects": [("柑橘清亮的背面", "the bright reverse of citrus"), ("冰冷酒体的中心", "the center of the chilled drink"), ("冬夜收紧的空气", "winter night's tightened air"), ("甜味缓慢的余烬", "sweetness's slow ember"), ("喉间短暂的火线", "a brief line of fire in the throat"), ("杯沿沾住的晚风", "the evening wind caught on the rim")],
    },
    "apple": {
        "subjects": [("青苹果清脆的光", "The crisp light of green apple"), ("果园吹来的凉风", "A cool wind from the orchard"), ("一片苹果色清晨", "A slice of apple-colored morning"), ("果皮明亮的酸香", "The bright tartness of apple skin"), ("杯中浅绿的回声", "A pale green echo in the glass"), ("梨与苹果的薄雾", "A fine mist of pear and apple")],
        "objects": [("冰面透明的秋天", "a transparent autumn on ice"), ("肉桂温暖的影子", "cinnamon's warm shadow"), ("果香刚落下的杯底", "the bottom where fruit aroma settles"), ("一口清脆的晚风", "one crisp sip of evening wind"), ("气泡轻快的脚步", "the quick steps of bubbles"), ("白兰地柔暖的余光", "brandy's gentle afterglow")],
    },
    "sparkling": {
        "subjects": [("气泡升起的星群", "A constellation of rising bubbles"), ("杯中轻快的银雨", "Quick silver rain in the glass"), ("一串清亮的呼吸", "A string of bright breaths"), ("酒体向上的光", "Light rising through the drink"), ("细小气泡的乐句", "A phrase played by tiny bubbles"), ("苏打写下的亮点", "Bright points written by soda")],
        "objects": [("高杯修长的天空", "the tall sky of the highball"), ("柑橘刚醒的清晨", "citrus's newly woken morning"), ("冰块之间的空隙", "the space between ice cubes"), ("庆祝尚未说出的名字", "a celebration not yet named"), ("杯沿轻薄的月色", "the thin moonlight on the rim"), ("第一声碰杯的回响", "the echo of the first toast")],
    },
    "citrus": {
        "subjects": [("柑橘切开的亮光", "The bright light cut from citrus"), ("一线清醒的酸香", "A clear line of tart aroma"), ("柠檬薄薄的锋芒", "The fine edge of lemon"), ("酸橙挤出的清晨", "Morning squeezed from lime"), ("果皮飞起的金光", "Gold light lifted from the peel"), ("一瓣明亮的风", "A bright wedge of wind")],
        "objects": [("杯沿细白的盐霜", "the fine salt frost on the rim"), ("烈酒透明的骨架", "the spirit's clear frame"), ("冰面安静的寒意", "the quiet chill on the ice"), ("糖浆柔软的尾音", "syrup's soft final note"), ("舌尖最清楚的一刻", "the tongue's clearest moment"), ("夜色尚未合拢的缝隙", "the gap before night closes")],
    },
    "layered": {
        "subjects": [("颜色各自站立", "Each color stands on its own"), ("一杯分开的夜色", "A night divided in the glass"), ("酒液叠起的地平线", "A horizon stacked from spirits"), ("明暗分层的光", "Light layered into bright and dark"), ("杯中缓慢的界线", "A slow boundary in the glass"), ("不同密度的梦", "Dreams of different densities")],
        "objects": [("彼此不惊动的边界", "a border left undisturbed"), ("杯壁垂直的风景", "the vertical landscape of the glass"), ("第一口到最后一口", "the path from first sip to last"), ("重力安静的秩序", "gravity's quiet order"), ("颜色相遇前的一寸", "the inch before colors meet"), ("灯下清楚的横线", "a clear line beneath the light")],
    },
    "shot": {
        "subjects": [("一小杯锋利的夜", "A small glass of sharpened night"), ("短促而亮的火花", "A brief, bright spark"), ("烈度收紧的一瞬", "An instant tightened by proof"), ("杯底蓄住的雷声", "Thunder held at the bottom"), ("一口大小的冒险", "An adventure the size of one sip"), ("极短的酒意", "A very short measure of spirit")],
        "objects": [("喉间干脆的回声", "the clean echo in the throat"), ("夜晚最直接的入口", "the night's most direct entrance"), ("冰冷之后的热意", "the heat after the chill"), ("碰杯落下的句点", "the full stop of a toast"), ("勇气刚亮起的一秒", "the second courage lights"), ("还来不及解释的笑声", "laughter too quick to explain")],
    },
    "gin": {
        "subjects": [("杜松清冷的香气", "Juniper's cool aroma"), ("透明酒体的松针", "Pine needles in a clear spirit"), ("一束克制的草木", "A restrained bouquet of botanicals"), ("杯中清瘦的森林", "A lean forest in the glass"), ("杜松写下的冷光", "Cool light written by juniper"), ("植物香气的细线", "A fine line of botanicals")],
        "objects": [("冰块清楚的棱角", "the clear angles of ice"), ("苦艾酒安静的阴影", "vermouth's quiet shadow"), ("柠檬皮短暂的金光", "lemon peel's brief gold"), ("夜色笔直的衣领", "night's straight collar"), ("杯口干净的风", "the clean wind at the rim"), ("搅拌留下的丝滑", "the silk left by stirring")],
    },
    "vodka": {
        "subjects": [("伏特加透明的冷", "Vodka's transparent chill"), ("一束无色的锋芒", "A colorless edge"), ("杯中洁净的夜", "A clean night in the glass"), ("冰点附近的微光", "A glint near freezing"), ("酒体笔直的清澈", "The spirit's upright clarity"), ("一层极薄的寒意", "A very thin layer of cold")],
        "objects": [("果汁鲜明的颜色", "the vivid color of juice"), ("咖啡深色的心口", "coffee's dark heart"), ("杯壁凝起的水珠", "condensation on the glass"), ("第一口清楚的边界", "the clear edge of the first sip"), ("气泡升起的方向", "the direction bubbles rise"), ("装饰留下的一点颜色", "the small color left by garnish")],
    },
    "rum": {
        "subjects": [("甘蔗留下的暖光", "Warm light left by sugarcane"), ("朗姆深处的海风", "Sea wind in the depth of rum"), ("一束棕榈色的甜", "A palm-colored sweetness"), ("木桶与海的余香", "The afterscent of oak and sea"), ("糖蜜缓慢的潮汐", "Molasses's slow tide"), ("岛屿酿出的夜色", "Night distilled by an island")],
        "objects": [("酸橙清醒的亮面", "lime's wakeful brightness"), ("碎冰堆起的白浪", "white surf built from crushed ice"), ("香料温热的岸边", "a warm shore of spice"), ("果香尚甜的晚风", "evening wind still sweet with fruit"), ("杯底深色的潮声", "the dark tide at the bottom"), ("舞曲最后一个节拍", "the last beat of the dance")],
    },
    "whiskey": {
        "subjects": [("橡木留下的琥珀", "Amber left by oak"), ("威士忌低沉的火", "Whiskey's low fire"), ("一段木桶色黄昏", "A barrel-colored dusk"), ("谷物与烟的余光", "The afterglow of grain and smoke"), ("杯中沉稳的金色", "Steady gold in the glass"), ("陈年酒体的暖影", "The warm shadow of age")],
        "objects": [("冰块缓慢的融化", "the slow melt of ice"), ("苦精微小的暗香", "bitters' small dark perfume"), ("壁炉尚红的余烬", "the hearth's still-red ember"), ("夜谈停顿的一刻", "the pause in a late conversation"), ("橙皮点亮的边缘", "the edge lit by orange peel"), ("第一口之后的沉默", "the silence after the first sip")],
    },
    "tequila": {
        "subjects": [("龙舌兰晒过的光", "Sunlight stored in agave"), ("高地植物的烈香", "The fierce aroma of highland agave"), ("一线沙漠的银白", "A silver line of desert"), ("烤熟龙舌兰的暖意", "Warmth from roasted agave"), ("杯中干燥的日光", "Dry sunlight in the glass"), ("盐与龙舌兰的风", "A wind of salt and agave")],
        "objects": [("杯沿洁白的盐线", "the white salt line on the rim"), ("青柠明亮的切口", "lime's bright cut"), ("正午尚热的石头", "stones still warm at noon"), ("葡萄柚微苦的晚霞", "grapefruit's bittersweet sunset"), ("冰面短暂的银光", "the brief silver on ice"), ("沙漠入夜前的风", "the wind before desert night")],
    },
    "brandy": {
        "subjects": [("果实蒸馏后的暖香", "Warm fruit after distillation"), ("白兰地柔暗的金", "Brandy's gentle dark gold"), ("果园在杯中入夜", "The orchard turning to night in the glass"), ("陈年水果的余光", "The afterglow of aged fruit"), ("一层温厚的琥珀", "A mellow layer of amber"), ("铜壶留下的暖影", "The warm shadow left by copper")],
        "objects": [("柑橘清亮的边缘", "citrus's bright edge"), ("杯壁缓慢的香气", "the aroma moving slowly along the glass"), ("餐后安静的灯影", "quiet light after dinner"), ("木桶收住的年月", "the years held by oak"), ("掌心渐暖的夜色", "night warming in the palm"), ("糖与酸之间的余韵", "the finish between sugar and acid")],
    },
    "wine": {
        "subjects": [("葡萄园迟到的风", "A late wind from the vineyard"), ("酒液里的一层暮色", "A layer of dusk in the wine"), ("成熟葡萄的余光", "The afterglow of ripe grapes"), ("一杯缓慢的季节", "A slowly passing season in the glass"), ("藤蔓写下的酸甜", "Sweetness and acid written by vines"), ("酒红色的远方", "A wine-red distance")],
        "objects": [("果皮与香料的晚宴", "a supper of fruit skin and spice"), ("气泡轻快的上升", "the light rise of bubbles"), ("长桌尚未散去的人声", "voices lingering at the long table"), ("杯壁薄薄的暮光", "the thin dusk on the glass"), ("收获之后的夜晚", "the night after harvest"), ("第一声碰杯的清响", "the clear sound of the first toast")],
    },
    "beer": {
        "subjects": [("麦芽温暖的金色", "The warm gold of malt"), ("泡沫升起的白岸", "A white shore of rising foam"), ("谷物酿出的晚风", "Evening wind brewed from grain"), ("一杯清脆的麦香", "A crisp glass of malt aroma"), ("啤酒花微苦的绿意", "The green bitterness of hops"), ("杯中明亮的泡沫", "Bright foam in the glass")],
        "objects": [("长杯清凉的河道", "the cool channel of the tall glass"), ("第一口解开的暑气", "the heat undone by the first sip"), ("咸味小食的香气", "the aroma of something salty"), ("傍晚露台的风", "the wind on an evening terrace"), ("碰杯之后的笑声", "laughter after the toast"), ("苦味干净的收尾", "bitterness's clean finish")],
    },
    "liqueur": {
        "subjects": [("利口酒浓缩的香", "The concentrated aroma of liqueur"), ("甜味折起的光", "Light folded by sweetness"), ("一滴草木与果实", "A drop of herbs and fruit"), ("杯中稠密的香气", "Dense aroma in the glass"), ("糖与香料的暗光", "The dim glow of sugar and spice"), ("一层颜色鲜明的甜", "A vividly colored sweetness")],
        "objects": [("烈酒留下的骨架", "the frame left by the spirit"), ("冰块透明的间隙", "the clear space between ice"), ("餐后缓慢的余韵", "the slow after-dinner finish"), ("果香最深的一层", "the deepest layer of fruit"), ("杯底尚亮的颜色", "the color still glowing at the bottom"), ("一小口满足的夜", "a night satisfied by one small sip")],
    },
    "non-alcoholic": {
        "subjects": [("果园与花园的清风", "A fresh wind from orchard and garden"), ("无酒精的一杯亮光", "A bright glass without spirits"), ("水果醒来的颜色", "The color of waking fruit"), ("苏打轻盈的呼吸", "Soda's weightless breath"), ("一杯清楚的清晨", "A clear morning in the glass"), ("草木与果汁的微光", "A glow of herbs and juice")],
        "objects": [("冰块洁白的边缘", "the white edge of ice"), ("甜酸恰好的平衡", "the measured balance of sweet and tart"), ("白日仍然清醒的风", "the fully awake wind of day"), ("杯口新鲜的果香", "fresh fruit at the rim"), ("气泡轻快的上升", "the quick rise of bubbles"), ("任何时候都合适的明亮", "brightness suited to any hour")],
    },
    "other": {
        "subjects": [("杯中未命名的光", "An unnamed light in the glass"), ("冰与香气的片刻", "A moment of ice and aroma"), ("一杯刚好的夜色", "Just enough night in one glass"), ("调酒留下的微光", "The glint left by mixing"), ("味道相遇的一刻", "The moment flavors meet"), ("杯壁收住的风", "Wind held by the glass")],
        "objects": [("第一口打开的故事", "the story opened by the first sip"), ("冰块缓慢的回声", "ice's slow echo"), ("甜与烈之间的距离", "the distance between sweet and strong"), ("夜晚尚空的一页", "the night's still-empty page"), ("杯沿短暂的停顿", "the brief pause at the rim"), ("配方没有说尽的地方", "what the recipe leaves unsaid")],
    },
}


PROFILE_LABELS = {
    "hot": ("热饮与蒸汽", "hot service and rising aroma"),
    "coffee": ("深焙咖啡", "dark-roasted coffee"),
    "cocoa": ("可可与柔苦", "cocoa and soft bitterness"),
    "cream": ("奶油与绵密口感", "cream and a velvety texture"),
    "tropical": ("热带果香", "tropical fruit"),
    "berry": ("莓果酸甜", "tart berry fruit"),
    "herbal": ("新鲜草本", "fresh herbs"),
    "bitter": ("苦味与草本轮廓", "a bitter botanical profile"),
    "spice": ("暖香料", "warming spice"),
    "apple": ("清脆果园香气", "crisp orchard fruit"),
    "sparkling": ("气泡与轻盈酒体", "bubbles and lift"),
    "citrus": ("明亮柑橘酸度", "bright citrus acidity"),
    "layered": ("分层结构", "a layered build"),
    "shot": ("短饮的直接烈度", "the direct intensity of a shot"),
    "gin": ("杜松与植物香气", "juniper and botanicals"),
    "vodka": ("伏特加的清澈冷感", "vodka's clean chill"),
    "rum": ("朗姆的甘蔗与岛屿气息", "rum, sugarcane, and island warmth"),
    "whiskey": ("威士忌的木桶与琥珀感", "whiskey, oak, and amber"),
    "tequila": ("龙舌兰的干燥日光感", "agave's dry sunlight"),
    "brandy": ("白兰地的蒸馏果香", "brandy's distilled fruit"),
    "wine": ("葡萄酒与成熟果香", "wine and ripe fruit"),
    "beer": ("麦芽、啤酒花与泡沫", "malt, hops, and foam"),
    "liqueur": ("利口酒的浓缩甜香", "liqueur's concentrated sweetness"),
    "non-alcoholic": ("无酒精果香与清爽感", "spirit-free fruit and freshness"),
    "other": ("配方的主体风味", "the recipe's central flavor"),
}


SIGNAL_LABELS_ZH = {
    "shake": "摇和",
    "stir": "搅拌",
    "build": "直调",
    "blend": "搅打",
    "muddle": "捣压",
    "layer": "分层",
    "other": "直接混合",
    "gin": "金酒",
    "vodka": "伏特加",
    "rum": "朗姆",
    "whiskey": "威士忌",
    "tequila": "龙舌兰",
    "brandy": "白兰地",
    "wine": "葡萄酒",
    "beer": "啤酒",
    "liqueur": "利口酒",
    "non-alcoholic": "无酒精",
}


FOREIGN_OVERRIDES = {
    "11003": ("it", "Tre parti uguali, e la notte trova il suo equilibrio.", "三份相等，夜色便找到平衡。", "Three equal parts, and the night finds its balance."),
    "11000": ("es", "La menta despierta cuando la lima toca el hielo.", "青柠触到冰时，薄荷便醒来。", "Mint wakes when lime touches the ice."),
    "11007": ("es", "Sal en el borde, sol de agave en el centro.", "杯沿是盐，杯心是龙舌兰的日光。", "Salt on the rim, agave sunlight at the center."),
    "11202": ("pt", "A lima abre caminho para o coração da cana.", "青柠为甘蔗的心打开道路。", "Lime opens a path to the heart of sugarcane."),
    "17197": ("fr", "Le citron frappe; les bulles répondent.", "柠檬发令，气泡回应。", "Lemon calls; the bubbles answer."),
    "17215": ("it", "Nel bicchiere, il tramonto sale in bollicine.", "杯中，落日化作气泡上升。", "In the glass, sunset rises as bubbles."),
    "13020": ("es", "La fruta guarda el verano dentro del vino.", "水果把夏天收藏在葡萄酒里。", "Fruit keeps summer inside the wine."),
    "17195": ("it", "La pesca dà al brindisi il colore dell'alba.", "蜜桃把黎明的颜色交给碰杯。", "Peach gives the toast the color of dawn."),
    "17253": ("es", "La uva burbujea junto al sol del agave.", "葡萄的气泡，依偎着龙舌兰的日光。", "Grape bubbles beside agave sunlight."),
    "11006": ("es", "Ron, lima y azúcar: el mar cabe en tres palabras.", "朗姆、青柠与糖：大海只需三个词。", "Rum, lime, and sugar: the sea fits in three words."),
    "11288": ("es", "La lima abre una ventana entre el ron y la cola.", "青柠在朗姆与可乐之间推开一扇窗。", "Lime opens a window between rum and cola."),
    "17203": ("fr", "Le cassis assombrit doucement la lumière du vin.", "黑醋栗温柔地加深葡萄酒的光。", "Blackcurrant gently deepens the wine's light."),
    "12196": ("fr", "Le cognac voyage; le citron tient la route.", "干邑远行，柠檬守住道路。", "Cognac travels; lemon holds the road."),
    "12127": ("fr", "Un parfum d'anis veille sur l'ambre de la nuit.", "一缕茴香守着夜里的琥珀。", "A trace of anise watches over the night's amber."),
}


FOREIGN_SIGNALS = {
    "11003": ("bitter", ["ingredient:Campari", "ingredient:Sweet Vermouth", "ingredient:Gin", "method:stir"]),
    "11000": ("herbal", ["ingredient:Mint", "ingredient:Lime", "ingredient:Soda water", "base:rum"]),
    "11007": ("citrus", ["ingredient:Salt", "ingredient:Lime juice", "base:tequila"]),
    "11202": ("citrus", ["ingredient:Lime", "ingredient:Sugar", "ingredient:Cachaca"]),
    "17197": ("sparkling", ["ingredient:Lemon juice", "ingredient:Champagne", "base:gin"]),
    "17215": ("sparkling", ["ingredient:Prosecco", "ingredient:Soda Water", "ingredient:Campari"]),
    "13020": ("wine", ["ingredient:Red wine", "ingredient:Orange juice", "ingredient:Cinnamon"]),
    "17195": ("sparkling", ["ingredient:Champagne", "ingredient:Peach schnapps"]),
    "17253": ("sparkling", ["ingredient:Grape Soda", "base:tequila"]),
    "11006": ("citrus", ["ingredient:Light rum", "ingredient:Lime", "ingredient:Powdered sugar"]),
    "11288": ("sparkling", ["ingredient:Light rum", "ingredient:Lime", "ingredient:Coca-Cola"]),
    "17203": ("sparkling", ["ingredient:Creme de Cassis", "ingredient:Champagne"]),
    "12196": ("citrus", ["ingredient:Cognac", "ingredient:Cointreau", "ingredient:Lemon juice"]),
    "12127": ("whiskey", ["ingredient:Ricard", "ingredient:Bourbon", "ingredient:Lemon peel"]),
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
    profile = base if base in PROFILES else "other"
    return profile, [f"base:{base}", f"method:{recipe.get('method', 'other')}"]


def rationale(profile: str, signals: list[str]) -> tuple[str, str]:
    raw_signals = [signal.split(":", 1)[1] for signal in signals]
    readable_zh = "、".join(SIGNAL_LABELS_ZH.get(signal, signal) for signal in raw_signals)
    profile_zh, profile_en = PROFILE_LABELS[profile]
    zh = f"原创短句；依据配方中的{readable_zh}，提炼{profile_zh}的味觉意象。"
    en = f"Original editorial line; grounded in {', '.join(raw_signals)} and shaped around {profile_en}."
    return zh, en


def generated_poem(recipe: dict, profile: str, used: set[str]) -> tuple[str, str]:
    subjects = PROFILES[profile]["subjects"]
    objects = PROFILES[profile]["objects"]
    total = len(subjects) * len(MOTIONS) * len(objects)
    seed = int(hashlib.sha256(f"{recipe['id']}:{recipe['name']}".encode()).hexdigest()[:12], 16)
    for attempt in range(total):
        index = (seed + attempt) % total
        subject = subjects[index % len(subjects)]
        index //= len(subjects)
        motion = MOTIONS[index % len(MOTIONS)]
        index //= len(MOTIONS)
        obj = objects[index % len(objects)]
        zh = f"{subject[0]}，{motion[0]}{obj[0]}。"
        en = f"{subject[1]} {motion[1]} {obj[1]}."
        if zh not in used:
            used.add(zh)
            return zh, en
    zh = f"{recipe.get('nameZh') or recipe['name']}，把这一杯留给尚未写完的夜。"
    en = f"{recipe['name']} leaves this glass to the night still being written."
    used.add(zh)
    return zh, en


def main() -> None:
    payload = json.loads(RECIPES_PATH.read_text())
    poems = []
    used = set()

    for recipe in payload["recipes"]:
        profile, signals = choose_profile(recipe)
        zh, en = generated_poem(recipe, profile, used)
        language = "zh-Hans"
        original = zh
        if recipe["id"] in FOREIGN_OVERRIDES:
            language, original, zh, en = FOREIGN_OVERRIDES[recipe["id"]]
            profile, signals = FOREIGN_SIGNALS[recipe["id"]]
        basis_zh, basis_en = rationale(profile, signals)
        poems.append({
            "id": recipe["id"],
            "language": language,
            "original": original,
            "translation": {"zhHans": zh, "zhHant": TO_TRADITIONAL.convert(zh), "en": en},
            "basis": {
                "type": "recipe-style",
                "profile": profile,
                "recipeSignals": signals,
                "zhHans": basis_zh,
                "zhHant": TO_TRADITIONAL.convert(basis_zh),
                "en": basis_en,
            },
        })

    output = {
        "meta": {
            "title": "Cocktail Atlas original order-menu poetry",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "recipeCount": len(poems),
            "contentPolicy": "Every line is original editorial copy generated from recipe characteristics; no third-party poem or lyric is reproduced.",
            "displayRule": "Foreign-language originals show a localized translation directly below.",
        },
        "poems": poems,
    }
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {len(poems)} original recipe-grounded poems to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
