"""繁中占星知識庫：技術名稱 + 白話說明（plain_zh）。"""

PLANETS = {
    "sun": {"zh": "太陽", "plain_zh": "代表核心自我、生命力與人生方向"},
    "moon": {"zh": "月亮", "plain_zh": "代表情緒、安全感與內在需求"},
    "mercury": {"zh": "水星", "plain_zh": "代表思考、溝通與學習方式"},
    "venus": {"zh": "金星", "plain_zh": "代表感情、美感與價值觀"},
    "mars": {"zh": "火星", "plain_zh": "代表行動力、慾望與衝突模式"},
    "jupiter": {"zh": "木星", "plain_zh": "代表成長、機會與樂觀傾向"},
    "saturn": {"zh": "土星", "plain_zh": "代表責任、限制與長期課題"},
    "uranus": {"zh": "天王星", "plain_zh": "代表突變、獨立與革新"},
    "neptune": {"zh": "海王星", "plain_zh": "代表夢想、直覺與模糊地帶"},
    "pluto": {"zh": "冥王星", "plain_zh": "代表深層轉化與執著"},
}

SIGNS = {
    "牡羊": {"plain_zh": "直接、主動、喜歡開創"},
    "金牛": {"plain_zh": "務實、穩定、重視安全感"},
    "雙子": {"plain_zh": "好奇、靈活、善於溝通"},
    "巨蟹": {"plain_zh": "敏感、重情、需要歸屬感"},
    "獅子": {"plain_zh": "自信、表現欲、需要被看見"},
    "處女": {"plain_zh": "細心、分析、追求完美"},
    "天秤": {"plain_zh": "重視關係、平衡與美感"},
    "天蠍": {"plain_zh": "深刻、專注、情感強烈"},
    "射手": {"plain_zh": "自由、樂觀、追求意義"},
    "摩羯": {"plain_zh": "務實、有野心、重責任"},
    "水瓶": {"plain_zh": "獨特、理性、關心理想"},
    "雙魚": {"plain_zh": "感性、包容、富想像力"},
}

HOUSES = {
    1: {"plain_zh": "自我形象與人生起點"},
    2: {"plain_zh": "金錢、資源與價值感"},
    3: {"plain_zh": "溝通、學習與日常交流"},
    4: {"plain_zh": "家庭、根基與內在安全感"},
    5: {"plain_zh": "戀愛、創作與玩樂"},
    6: {"plain_zh": "工作、健康與日常事務"},
    7: {"plain_zh": "伴侶、合作與一對一關係"},
    8: {"plain_zh": "親密、共享資源與轉化"},
    9: {"plain_zh": "信念、旅行與高等學習"},
    10: {"plain_zh": "事業、社會角色與成就"},
    11: {"plain_zh": "朋友、社群與未來願景"},
    12: {"plain_zh": "潛意識、休息與隱藏課題"},
}

ASPECTS = {
    "合相": {"plain_zh": "兩股能量緊密結合，互相強化"},
    "六分": {"plain_zh": "和諧角度，帶來機會與順暢配合"},
    "四分": {"plain_zh": "緊張角度，需要調適與行動"},
    "三分": {"plain_zh": "流暢角度，天賦較易發揮"},
    "對分": {"plain_zh": "拉扯角度，需在兩端找平衡"},
}

ANGLES = {
    "ascendant": {"zh": "上升", "plain_zh": "別人第一眼對你的印象與外在風格"},
    "mc": {"zh": "天頂", "plain_zh": "事業方向與社會形象"},
    "dc": {"zh": "下降", "plain_zh": "伴侶與合作對象的投射"},
    "ic": {"zh": "天底", "plain_zh": "家庭根基與內在歸屬"},
}

CHART_RULER = {
    "牡羊": "火星", "金牛": "金星", "雙子": "水星", "巨蟹": "月亮",
    "獅子": "太陽", "處女": "水星", "天秤": "金星", "天蠍": "火星",
    "射手": "木星", "摩羯": "土星", "水瓶": "土星", "雙魚": "木星",
}

SIGN_EN = {
    "牡羊": "Aries", "金牛": "Taurus", "雙子": "Gemini", "巨蟹": "Cancer",
    "獅子": "Leo", "處女": "Virgo", "天秤": "Libra", "天蠍": "Scorpio",
    "射手": "Sagittarius", "摩羯": "Capricorn", "水瓶": "Aquarius", "雙魚": "Pisces",
}

PLANET_ZH_TO_KEY = {v["zh"]: k for k, v in PLANETS.items()}
PLANET_KEY_TO_ZH = {k: v["zh"] for k, v in PLANETS.items()}

CANNOT_ANALYZE_LABELS = {
    "ascendant": "上升星座（需出生時間）",
    "houses": "十二宮位（需出生時間與地點）",
    "chart_ruler": "命主星（需上升星座）",
    "mc": "天頂 MC（需出生時間與地點）",
    "ic": "天底 IC（需出生時間與地點）",
    "dc": "下降 DC（需出生時間與地點）",
    "planet_houses": "行星落宮（需出生時間）",
    "house_rulers": "宮主星（需宮位）",
    "relationship_7th": "第七宮伴侶模式（需宮位）",
    "career_10th": "第十宮事業方向（需宮位）",
}

CAN_ANALYZE_LABELS = {
    "sun_sign": "太陽星座（核心自我）",
    "moon_sign": "月亮星座（情緒需求，無時間時可能不準）",
    "mercury_sign": "水星星座（思考溝通）",
    "venus_sign": "金星星座（感情價值）",
    "mars_sign": "火星星座（行動模式）",
    "jupiter_sign": "木星星座（成長機會）",
    "saturn_sign": "土星星座（責任課題）",
    "outer_planets": "外行星星座（世代特質）",
    "aspects": "行星相位（無時間時月亮相位可能不準）",
    "ascendant": "上升星座",
    "houses": "十二宮位",
    "chart_ruler": "命主星",
    "angles": "四軸（上升/天頂/下降/天底）",
    "planet_houses": "行星落宮",
    "element_balance": "元素分布",
    "modality_balance": "模式分布",
}
