#!/usr/bin/env python3
"""Curate contemporary Chinese cocktail copy without changing canonical English facts."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RECIPES_PATH = ROOT / "data" / "recipes.json"
NAMES_PATH = ROOT / "data" / "name-zh.json"
INSTRUCTIONS_PATH = ROOT / "data" / "instruction-zh.json"


NAME_OVERRIDES = {
    "747 Drink": "747 特调",
    "Affair": "绯闻",
    "Americano": "阿美利卡诺",
    "Aviation": "航空",
    "Boston Sour": "波士顿酸",
    "Brain Fart": "脑袋宕机",
    "Darkwood Sling": "暗木司令",
    "Drinking Chocolate": "热巧克力",
    "Duchamp's Punch": "杜尚潘趣",
    "English Highball": "英式高球",
    "Fruit Cooler": "水果酷乐",
    "Gin Cooler": "金酒酷乐",
    "Gin Lemon": "金酒柠檬",
    "Gin Sling": "金酒司令",
    "Gin Smash": "金酒史玛希",
    "Gin Squirt": "金酒 Squirt",
    "Gin Swizzle": "金酒斯威泽",
    "Gin Toddy": "金酒托迪",
    "Halloween Punch": "万圣节潘趣",
    "Holloween Punch": "万圣节潘趣",
    "Japanese Fizz": "日式菲士",
    "Jello shots": "果冻 shot",
    "Kool-Aid Shot": "Kool-Aid shot",
    "Lemon Elderflower Spritzer": "柠檬接骨木花斯普里泽",
    "Lemon Shot": "柠檬 shot",
    "Lone Tree Cooler": "孤树酷乐",
    "Mudslinger": "Mudslinger",
    "Orange Crush": "橙味 Crush",
    "Pornstar Martini": "艳星马天尼",
    "Pink Gin": "粉红金酒",
    "Raspberry Cooler": "覆盆子酷乐",
    "Royal Gin Fizz": "皇家金酒菲士",
    "Rum Cooler": "朗姆酷乐",
    "Spritz": "斯普里兹",
    "Tequila Fizz": "龙舌兰菲士",
    "Vodka Fizz": "伏特加菲士",
    "Wine Cooler": "葡萄酒酷乐",
    "Yoghurt Cooler": "酸奶酷乐",
}


ENGLISH_TEMPLATES = {
    "Shake all ingredients with ice, strain into a cocktail glass, and serve.": "所有材料加冰摇匀，滤入鸡尾酒杯。",
    "Shake ingredients with ice, strain into a cocktail glass, and serve.": "材料加冰摇匀，滤入鸡尾酒杯。",
    "Stir all ingredients with ice, strain into a cocktail glass, and serve.": "所有材料加冰搅拌，滤入鸡尾酒杯。",
    "Stir ingredients with ice, strain into a cocktail glass, and serve.": "材料加冰搅拌，滤入鸡尾酒杯。",
    "Shake all ingredients with ice, strain into a chilled cocktail glass, and serve.": "所有材料加冰摇匀，滤入冰镇鸡尾酒杯。",
    "Shake all ingredients (except carbonated water) with ice and strain into a highball glass over two ice cubes. Fill with carbonated water, stir, and serve.": "除气泡水外，所有材料加冰摇匀，滤入装有两块冰的高球杯；以气泡水补满并轻轻搅匀。",
    "Place all ingredients in the blender jar - cover and whiz on medium speed until well blended. Pour in one tall, 2 medium or 3 small glasses and drink up.": "所有材料倒入搅拌机，以中速打至顺滑；可分装为 1 大杯、2 中杯或 3 小杯。",
    "In a shaker half-filled with ice cubes, combine all of the ingredients. Shake well. Strain into a cocktail glass.": "摇酒壶加冰至半满，倒入所有材料充分摇匀，滤入鸡尾酒杯。",
    "In a shaker half-filled with ice cubes, combine all of the ingredients. Shake well. Strain into a sour glass.": "摇酒壶加冰至半满，倒入所有材料充分摇匀，滤入酸酒杯。",
    "In a mixing glass half-filled with ice cubes, combine all of the ingredients. Stir well. Strain into a cocktail glass.": "调酒杯加冰至半满，倒入所有材料搅匀，滤入鸡尾酒杯。",
    "Pour all ingredients directly into old fashioned glass filled with ice cubes. Stir gently.": "将所有材料直接倒入装有冰块的古典杯，轻轻搅匀。",
    "Throw everything into a blender and liquify.": "所有材料倒入搅拌机，打至顺滑。",
    "Mix together and enjoy!": "将所有材料混合均匀。",
    "Mix together and enjoy": "将所有材料混合均匀。",
    "Mix. Serve over ice.": "混合均匀，加冰饮用。",
    "Layered in a shot glass.": "将材料依次分层倒入 shot 杯。",
    "Pour ingredients into 1 ounce shot glass": "将材料倒入 1 oz shot 杯。",
    "Stir in mixing glass with ice and strain": "材料倒入调酒杯加冰搅拌，滤入成品杯。",
    "Shake and strain into a chilled cocktail glass": "加冰摇匀，滤入冰镇鸡尾酒杯。",
}


INSTRUCTION_OVERRIDES = {
    "110 in the shade": "将装有龙舌兰酒的 shot 杯沉入啤酒杯，再以拉格啤酒加满。",
    "151 Florida Bushwacker": "所有材料倒入搅拌机，打至顺滑；按需饰以巧克力屑。",
    "155 Belmont": "所有材料加冰搅打，倒入白葡萄酒杯，饰以胡萝卜。",
    "24k nightmare": "所有材料加冰摇匀，滤入 shot 杯。",
    "252": "将两种酒倒入 shot 杯，一口饮下。",
    "3 Wise Men": "将三种威士忌倒入杯中混合，以 shot 方式一口饮下。",
    "3-Mile Long Island Iced Tea": "在 14 oz 杯中加满冰，再加入各款烈酒；倒入可乐至杯子的三分之二，以酸甜预调液补满。最后滴入少量苦精，饰以柠檬角。",
    "50/50": "杯中加入碎冰，依次倒入伏特加和少量金万利橙酒，最后以橙汁加满。",
    "501 Blue": "杯中加冰，倒入等量的两种材料并混合均匀。",
    "57 Chevy with a White License Plate": "古典杯加满冰，加入白可可利口酒和伏特加，搅匀。",
    "69 Special": "杯中加入 2 oz 金酒、4 oz 七喜与少量柠檬汁；按口味以更多七喜补满。",
    "747 Drink": "柯林杯加满冰，依次倒入伏特加、青柠果露和蔓越莓汁，再以雪碧补满。饰以青柠片或蔓越莓。",
    "747": "依次倒入 Kahlúa、百利甜酒和 Frangelico 榛果利口酒；不冰镇，也不做分层。",
    "9 1/2 Weeks": "所有材料倒入调酒杯加冰搅拌至冰镇，滤入鸡尾酒杯，饰以草莓片。",
    "A1": "所有材料与冰倒入摇酒壶，摇匀后连冰倒入冰镇杯。",
    "ACID": "先倒入 151 proof 朗姆酒，再加入 Wild Turkey 101；另配可乐或胡椒博士汽水作为 chaser。",
    "Addington": "两款味美思加冰摇匀，滤入冰镇杯，再补少量苏打水。",
    "Acapulco": "除薄荷外，将所有材料加冰摇匀，滤入装有冰块的古典杯，饰以一枝薄荷。",
    "Affair": "高球杯加冰，依次加入施纳普斯、橙汁和蔓越莓汁，以苏打水补满。",
    "Alexander": "所有材料加冰摇匀，滤入鸡尾酒杯，撒少量肉豆蔻。",
    "Algonquin": "所有材料加冰摇匀，滤入鸡尾酒杯。",
    "Allegheny": "除柠檬皮外，所有材料加冰摇匀并滤入鸡尾酒杯，饰以柠檬皮卷。",
    "Americano": "古典杯加冰，倒入金巴利和甜味美思，加入少量苏打水，饰以半片橙子。",
    "Aviation": "所有材料倒入摇酒壶加冰摇匀，滤入鸡尾酒杯，饰以樱桃。",
    "Avalon": "高球杯加满冰，依次加入芬兰伏特加、柠檬汁、苹果汁和 Pisang Ambon 香蕉利口酒，以柠檬汽水补满。轻轻搅拌，饰以螺旋黄瓜皮与红樱桃。黄瓜带来清新气息，也让装饰更醒目。这杯酒由 Timo Haimi 创作，曾获 1991 年 Finlandia Vodka Long Drink Competition 冠军。",
    "B-52": "按顺序将材料分层倒入 shot 杯，配搅拌棒。",
    "B-53": "依次将 Kahlúa、Sambuca 和 Grand Marnier 分层倒入 shot 杯。",
    "Baby Eskimo": "冰淇淋在室温下放约 10 分钟，再按顺序加入其余材料，用筷子、餐刀或勺子搅匀后立即饮用。口感轻盈，适合接在酒体较厚重的饮品之后。",
    "Bahama Mama": "所有材料混合，按口味加入约 2 份苏打水，倒入装有大量冰块的杯中，配吸管。",
    "Barracuda": "除起泡酒外，所有材料加冰摇匀并滤入杯中，再以起泡酒补满。",
    "Bob Marley": "将材料倒入 2 oz shot 杯。",
    "Bumble Bee": "百利甜酒先倒入 shot 杯。将吧勺背面贴近杯壁，沿吧勺依次缓慢倒入 Kahlúa 和 Sambuca，使三层保持分明。",
    "Caipirinha": "将青柠块与糖放入古典杯，用捣棒或木勺压出汁液与精油。加满冰后倒入卡莎萨。",
    "Corn n Oil": "将半个青柠再切成两块，连同法勒南和苦精放入古典杯捣压。加入陈年朗姆酒和冰，搅匀；最后将黑糖蜜朗姆酒漂浮在酒面，配吸管。",
    "Cranberry Punch": "混合前四种材料并搅至糖完全溶解，冷藏。上桌前加入姜汁汽水，再放入冰环保持低温。",
    "Clover Club": "所有材料先不加冰干摇至蛋清乳化，再加冰摇匀，双重滤入鸡尾酒杯。",
    "Corpse Reviver": "以苦艾酒润洗鸡尾酒杯。其余材料加冰摇匀，双重滤入杯中。",
    "Cuba Libra": "高球杯加满冰，加入朗姆酒。用青柠切面擦拭杯口后将汁挤入杯中，以可口可乐补满，饰以青柠片。",
    "Darkwood Sling": "杯中加入一份樱桃利口酒和一份苏打水。若想做成偏酸版本，可加入汤力水；再加入冰块并以橙汁补满。",
    "Duchamp's Punch": "所有材料加冰摇匀，双重过滤至装有一块大冰的冰镇双份古典杯，饰以两枝薰衣草。",
    "Death in the Afternoon": "苦艾酒倒入冰镇杯，再以香槟补满。",
    "Empellón Cocina's Fat-Washed Mezcal": "先制作阿多波腌料：将安乔辣椒、瓜希略辣椒、墨西哥烟熏辣椒、烤蒜、苹果醋、墨西哥牛至、黑胡椒、丁香、肉桂和孜然打成细腻酱汁。按原配方将猪肋排冷熏、腌制并低温烤熟，冷却后收集猪油；也可用猪油加少量腌料加热替代。\n\n将等量梅斯卡尔和调味猪油倒入密封容器，充分摇匀后冷冻一夜。待油脂凝固分层，以细网筛过滤，再用纱布或咖啡滤纸滤净残余油脂。\n\n哈瓦那辣椒酊：辣椒切片后加入 2 oz 梅斯卡尔，浸泡一夜或至所需辣度。\n\n调酒：梅斯卡尔与巧克力利口酒在调酒杯中加冰搅拌 45 秒，滤入冰镇碟形香槟杯。借助吧勺沿杯壁缓慢沉入咖啡利口酒，最后滴入 5 滴辣椒酊。",
    "Figgy Thyme": "用刘易斯冰袋将冰块敲碎，倒入柯林杯。摇酒壶中放入无花果和百里香捣压，再加入蜂蜜伏特加、柠檬汁与一块大冰，摇至充分冰镇后滤入杯中。加入汤力水和 2 dash 安格仕芳香苦精，饰以无花果片与百里香。",
    "French Negroni": "将所有材料与冰倒入摇酒壶，用吧勺搅拌 40–45 圈，或至充分冰镇。滤入马天尼杯，亦可滤入装有冰块的古典杯；饰以橙皮卷。",
    "Gimlet": "所有材料倒入摇酒壶并加满冰，摇匀后滤入冰镇鸡尾酒杯；也可滤入装有新冰的古典杯。饰以青柠片。",
    "Gin Cooler": "在柯林杯中搅匀糖粉和 2 oz 气泡水，加满冰后倒入金酒，再以气泡水补满并搅匀。加入柠檬皮和螺旋橙皮，让橙皮一端垂在杯沿外。",
    "Gin Lemon": "高球杯加满冰，倒入金酒并以柠檬汽水补满，轻轻搅匀，饰以柠檬片；也可加几片薄荷叶。",
    "Gin Swizzle": "摇酒壶加冰至半满，倒入青柠汁、糖、金酒和苦精并摇匀。冰镇杯加满冰，将酒液滤入，再以苏打水补满；搅拌至杯壁挂霜。",
    "Halloween Punch": "将葡萄汁和苏打水、姜汁汽水或柠檬青柠汽水倒入潘趣碗混合。舀入橙味与青柠味雪葩，让表面稍微融化，同时保留完整的雪葩球。",
    "Holloween Punch": "将葡萄汁和苏打水、姜汁汽水或柠檬青柠汽水倒入潘趣碗混合。舀入橙味与青柠味雪葩，让表面稍微融化，同时保留完整的雪葩球。",
    "Jello shots": "将 3 杯水煮沸，加入果冻粉并搅至完全溶解。倒入 2 杯伏特加混匀，分装进塑料 shot 杯，冷藏至凝固后食用。",
    "Kool First Aid": "将 Kool-Aid 倒入双份 shot 杯，以朗姆酒补满，一口饮下。",
    "Lemon Shot": "将加利安奴与绝对伏特加柠檬味倒入 shot 杯混合，把撒糖的柠檬角放在杯口，沿柠檬淋少量朗姆酒。仅由专业调酒师点燃约 1 秒并彻底熄灭后，一口饮下并咬一口柠檬。",
    "Long vodka": "用冰块和安格仕芳香苦精摇洗高杯内壁，倒入伏特加。加入一片青柠，再挤入其余青柠汁，以汤力水补满并搅匀。",
    "Penicillin": "将调和苏格兰威士忌、柠檬汁、蜂蜜糖浆和姜糖浆加冰摇匀，滤入装有大冰块的冰镇古典杯。将烟熏型苏格兰威士忌漂浮在酒面，饰以糖渍姜。",
    "Pegu Club": "所有材料加冰摇匀，双重滤入鸡尾酒杯。",
    "Red Snapper": "每款材料各取 1 shot，加冰摇匀后滤入 shot 杯，一口饮下。",
    "Snowday": "所有材料加冰搅拌，滤入装有新冰的冰镇古典杯。挤压橙皮释放精油，并以橙皮装饰。",
    "Spritz": "杯中加冰，依次倒入材料，完成装饰。",
    "Stinger": "所有材料倒入调酒杯加冰搅拌，滤入鸡尾酒杯；也可滤入装有冰块的古典杯。",
    "Vampiro": "可使用高球杯或古典杯。先以青柠汁或水润湿杯口，蘸一圈犹太盐。杯中加冰至半满，倒入 1–2 shot 优质龙舌兰酒；挤入新鲜青柠汁，加入少量盐与柑橘汽水至约八分满，再加入 Viuda de Sanchez，或以橙汁、青柠汁和墨西哥辣酱替代。最后搅匀。",
    "Vodka Tonic": "切一角和一片青柠或柠檬。杯中加满新冰，倒入伏特加，再以汤力水补满。将果角挤汁入杯，饰以果片。",
    "Wine Cooler": "葡萄酒与柠檬青柠汽水混合，倒入杯中并加冰。",
    "Yoghurt Cooler": "酸奶和水果放入搅拌机，以中速打至顺滑。倒入 1 个大杯、2 个中杯或 3 个小杯。炎热天气可多加冰：搅拌机运转时从投料口逐次加入 3–4 块冰，打至完全碎化。",
    "Zinger": "shot 杯中倒入 4 shot 桃味施纳普斯，再加入 4 shot Surge 汽水，一口饮下。",
    "Zipperhead": "杯中加满冰，先放入吸管，再依次加入材料并尽量保持分层：香博覆盆子利口酒在底层，伏特加居中，苏打水在上层。",
    "Zoksel": "没有特别的调法：将所有材料依次倒入同一只杯中，配柠檬。",
}


REPLACEMENTS = (
    ("鸡尾酒调酒器", "摇酒壶"),
    ("玻璃搅拌器", "调酒杯"),
    ("玻璃混合器", "调酒杯"),
    ("调酒器", "摇酒壶"),
    ("双层老式玻璃杯", "双份古典杯"),
    ("老式玻璃杯", "古典杯"),
    ("岩石玻璃杯", "古典杯"),
    ("岩石杯", "古典杯"),
    ("柯林斯玻璃杯", "柯林杯"),
    ("高球玻璃杯", "高球杯"),
    ("高脚玻璃杯", "高球杯"),
    ("气球玻璃杯", "气球杯"),
    ("酸玻璃杯", "酸酒杯"),
    ("小玻璃杯", "shot 杯"),
    ("射手杯", "shot 杯"),
    ("射手", "shot"),
    ("射击", "一口饮下"),
    ("每人一枪", "每款各取 1 shot"),
    ("杜松子酒", "金酒"),
    ("苦味剂", "苦精"),
    ("苦味酒", "苦精"),
    ("干苦艾酒", "干味美思"),
    ("甜苦艾酒", "甜味美思"),
    ("三秒酒", "白橙皮利口酒"),
    ("酸橙", "青柠"),
    ("石灰轮", "青柠片"),
    ("青柠轮", "青柠片"),
    ("石灰", "青柠"),
    ("滋补品", "汤力水"),
    ("补品", "汤力水"),
    ("糖醋", "酸甜预调液"),
    ("简单糖浆", "糖浆"),
    ("酸果蔓", "蔓越莓"),
    ("楔形物", "果角"),
    ("橙色麻花", "橙皮卷"),
    ("冷玻璃杯", "冰镇杯"),
    ("冰镇的玻璃杯", "冰镇杯"),
    ("冰镇的杯", "冰镇杯"),
    ("搅拌杯", "调酒杯"),
    ("鸡尾酒搅拌器", "吧勺"),
    ("轿跑车杯", "碟形香槟杯"),
    ("摇床", "摇酒壶"),
    ("稻草", "吸管"),
    ("玻璃杯", "杯"),
    ("冷却杯", "冰镇杯"),
    ("玻璃结霜", "杯壁挂霜"),
    ("成分", "材料"),
    ("配料", "材料"),
    ("内容物", "酒液"),
    ("添加", "加入"),
    ("填充", "加满"),
    ("分层放入", "依次分层倒入"),
    ("即可食用", "即可"),
    ("即可享用", "即可"),
    ("加冰食用", "加冰饮用"),
    ("食用", "饮用"),
    ("服务。", "完成。"),
    ("上菜", "完成"),
    ("上桌", "完成"),
    ("享受！", "即可。"),
    ("享用！", "即可。"),
    ("在上面撒上", "撒上"),
    ("上面撒上", "撒上"),
    ("剧烈摇晃", "充分摇匀"),
    ("猛击它", "一口饮下"),
    ("镜头", "shot"),
    ("冲床", "潘趣"),
    ("搅打至光滑", "打至顺滑"),
    ("搅拌直至光滑", "打至顺滑"),
    ("混乱", "捣压"),
    ("薄荷枝", "薄荷枝"),
    ("鸡尾酒振动筛", "摇酒壶"),
)


def clean_instruction(name: str, value: str, english: str) -> str:
    if name in INSTRUCTION_OVERRIDES:
        return INSTRUCTION_OVERRIDES[name]
    if english in ENGLISH_TEMPLATES:
        return ENGLISH_TEMPLATES[english]
    result = value.replace("\u200b", "").replace("\u200a", "").replace("\u2060", "")
    for source, target in REPLACEMENTS:
        result = result.replace(source, target)
    result = re.sub(r"[ \t]+", " ", result)
    result = re.sub(r" *\n *", "\n", result)
    result = re.sub(r"\n{3,}", "\n\n", result)
    result = re.sub(r" +([，。；：！？])", r"\1", result)
    return result.strip()


def clean_name(name: str, value: str) -> str:
    result = NAME_OVERRIDES.get(name, value)
    result = result.replace("菲兹", "菲士").replace("宾治", "潘趣")
    result = result.replace("戴吉利", "代基里").replace("代基里酒", "代基里")
    return result


def main() -> None:
    payload = json.loads(RECIPES_PATH.read_text())
    names = json.loads(NAMES_PATH.read_text())
    instructions = {}

    for recipe in payload["recipes"]:
        recipe["nameZh"] = clean_name(recipe["name"], names.get(recipe["name"], recipe.get("nameZh") or recipe["name"]))
        recipe["instructions"]["zh"] = clean_instruction(
            recipe["name"],
            recipe["instructions"].get("zh", ""),
            recipe["instructions"].get("en", ""),
        )
        names[recipe["name"]] = recipe["nameZh"]
        instructions[recipe["id"]] = recipe["instructions"]["zh"]

    ordered_names = {key: names[key] for key in sorted(names, key=str.casefold)}
    ordered_instructions = {key: instructions[key] for key in sorted(instructions)}
    RECIPES_PATH.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    NAMES_PATH.write_text(json.dumps(ordered_names, ensure_ascii=False, indent=2) + "\n")
    INSTRUCTIONS_PATH.write_text(json.dumps(ordered_instructions, ensure_ascii=False, indent=2) + "\n")
    print(f"Localized {len(instructions)} instructions and {len(ordered_names)} names")


if __name__ == "__main__":
    main()
