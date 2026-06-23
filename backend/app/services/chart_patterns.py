"""格局偵測與盤型判斷。"""

from app.data.astrology_kb import ASPECTS


def detect_patterns(aspects: list[dict]) -> list[dict]:
    patterns = []
    oppositions = [(a["planet_a"], a["planet_b"]) for a in aspects if a["type"] == "對分"]
    trines = [(a["planet_a"], a["planet_b"]) for a in aspects if a["type"] == "三分"]
    squares = [(a["planet_a"], a["planet_b"]) for a in aspects if a["type"] == "四分"]
    conjunctions = [(a["planet_a"], a["planet_b"]) for a in aspects if a["type"] == "合相"]

    if oppositions:
        a, b = oppositions[0]
        patterns.append({
            "name": "對分軸",
            "planets": [a, b],
            "description": f"{a}跟{b}像踩油門又踩煞車，要在兩頭找平衡",
        })

    if len(trines) >= 3:
        planets = list({p for pair in trines[:3] for p in pair})
        patterns.append({
            "name": "大三角",
            "planets": planets[:3],
            "description": "幾顆星互相很順，做起來比較省力",
        })

    if len(squares) >= 2:
        planets = list({p for pair in squares[:2] for p in pair})
        patterns.append({
            "name": "T三角",
            "planets": planets[:3],
            "description": "壓力三角：有摩擦，但也推你成長",
        })

    stellium = _find_stellium(conjunctions)
    if stellium:
        patterns.append({
            "name": "星群",
            "planets": stellium,
            "description": f"{'、'.join(stellium)}能量擠在一起，這個主題在人生特別醒目",
        })

    return patterns


def _find_stellium(conjunctions: list[tuple[str, str]]) -> list[str] | None:
    if not conjunctions:
        return None
    graph: dict[str, set[str]] = {}
    for a, b in conjunctions:
        graph.setdefault(a, set()).add(b)
        graph.setdefault(b, set()).add(a)
    visited: set[str] = set()
    best: list[str] = []
    for start in graph:
        if start in visited:
            continue
        cluster = _dfs(graph, start, visited)
        if len(cluster) >= 3 and len(cluster) > len(best):
            best = cluster
    return best if len(best) >= 3 else None


def _dfs(graph: dict[str, set[str]], node: str, visited: set[str]) -> list[str]:
    stack = [node]
    cluster = []
    local = set()
    while stack:
        n = stack.pop()
        if n in local:
            continue
        local.add(n)
        cluster.append(n)
        for nb in graph.get(n, []):
            if nb not in local:
                stack.append(nb)
    visited.update(local)
    return cluster


def detect_chart_shape(house_numbers: list[int]) -> str:
    """依行星落宮分布判斷盤型（簡化版）。"""
    if not house_numbers:
        return "未知"
    occupied = sorted(set(house_numbers))
    if len(occupied) <= 4:
        span = max(occupied) - min(occupied)
        if span <= 4:
            return "集中型"
        return "單邊型"
    gaps = [occupied[i + 1] - occupied[i] for i in range(len(occupied) - 1)]
    if gaps and max(gaps) >= 4:
        return "拉鍊型"
    if len(occupied) >= 8:
        return "散開型"
    return "標準"
