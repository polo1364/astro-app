"""Real-browser checks against a running app, using an isolated browser profile.

Usage: python tests/ziwei/browser_check.py [base_url] [screenshot_directory]
AI generation endpoints are blocked; western calculations use the real backend.
"""
from pathlib import Path
import sys
import tempfile
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:9527"
output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(tempfile.gettempdir()) / "astro-ziwei-qa"
output.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 1050})
    blocked = []
    for pattern in ["**/interpret/**", "**/daily/public*", "**/personal-daily/**"]:
        context.route(pattern, lambda route: (blocked.append(route.request.url), route.abort()))
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base + "/natal", wait_until="networkidle")
    page.locator("#name").fill("共用資料驗證")
    page.locator("#date").fill("1990-12-31")
    page.locator("#time").fill("23:30")
    page.get_by_role("button", name="進階選項").click()
    page.locator("#house").select_option("Whole Sign")
    page.get_by_role("link", name="紫微斗數", exact=True).click()
    expect(page.locator("#ziwei-name")).to_have_value("共用資料驗證")
    expect(page.locator("#ziwei-date")).to_have_value("1990-12-31")
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.locator('aside [role="alert"]')).to_contain_text("請選擇紫微排盤性別")
    page.locator("#ziwei-ziwei-gender").select_option("female")
    page.get_by_text("排盤規則", exact=True).click()
    page.locator("#ziwei-leap").select_option("next-month")
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.get_by_role("heading", name="共用資料驗證的紫微命盤")).to_be_visible()
    expect(page.get_by_text("排盤日期 1991-01-01", exact=False)).to_be_visible()
    expect(page.locator("#ziwei-date")).to_have_value("1990-12-31")
    assert page.locator('button[aria-label^="查看"]:visible').count() == 12
    page.get_by_role("button", name="查看夫妻", exact=False).filter(visible=True).click()
    expect(page.locator('[aria-label="宮位詳情"]')).to_contain_text("夫妻")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path=str(output / "desktop.png"), full_page=True)

    page.get_by_role("button", name="儲存／帶入基本資料").click()
    dialog = page.get_by_role("dialog")
    expect(dialog.locator("#profile-name")).to_have_value("共用資料驗證")
    expect(dialog.locator("#profile-ziwei-gender")).to_have_value("female")
    dialog.locator("#profile-label").fill("共用測試資料")
    dialog.get_by_role("button", name="儲存基本資料", exact=True).click()
    expect(dialog.get_by_text("基本資料已儲存", exact=True)).to_be_visible()
    dialog.get_by_role("button", name="關閉", exact=True).click()

    page.get_by_role("link", name="本命盤", exact=True).click()
    expect(page.locator("#date")).to_have_value("1990-12-31")
    expect(page.locator("#time")).to_have_value("23:30")
    page.get_by_role("button", name="進階選項").click()
    expect(page.locator("#house")).to_have_value("Whole Sign")
    with page.expect_response(lambda response: response.url.endswith("/natal") and response.request.method == "POST") as natal:
        page.get_by_role("button", name="計算命盤", exact=True).click()
    assert natal.value.status == 200
    assert "ziwei" not in natal.value.request.post_data_json
    page.get_by_role("link", name="行運盤", exact=True).click()
    expect(page.locator("#name")).to_have_value("共用資料驗證")
    expect(page.locator("#time")).to_have_value("23:30")
    with page.expect_response(lambda response: response.url.endswith("/transit") and response.request.method == "POST", timeout=60000) as transit:
        page.get_by_role("button", name="計算行運", exact=True).click()
    assert transit.value.status == 200
    assert "ziwei" not in transit.value.request.post_data_json

    page.get_by_role("link", name="紫微斗數", exact=True).click()
    expect(page).to_have_url(base + "/ziwei")
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="儲存／帶入基本資料").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("button", name="帶入", exact=True).click()
    expect(dialog).not_to_be_visible()
    expect(page.locator("#ziwei-name")).to_have_value("共用資料驗證")
    expect(page.locator("#ziwei-ziwei-gender")).to_have_value("female")
    page.get_by_text("排盤規則", exact=True).click()
    expect(page.locator("#ziwei-leap")).to_have_value("next-month")
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.get_by_role("heading", name="共用資料驗證的紫微命盤")).to_be_visible()
    page.locator("#ziwei-time").fill("22:30")
    expect(page.get_by_text("出生資料或規則已變更", exact=False)).to_be_visible()
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.get_by_text("排盤日期 1990-12-31", exact=False)).to_be_visible()
    page.get_by_role("checkbox", name="出生時間不詳", exact=False).check()
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.locator('aside [role="alert"]')).to_contain_text("出生時間")
    expect(page.get_by_role("heading", name="共用資料驗證的紫微命盤")).not_to_be_visible()
    page.get_by_role("checkbox", name="出生時間不詳", exact=False).uncheck()
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.get_by_role("heading", name="共用資料驗證的紫微命盤")).to_be_visible()
    for width in [320, 390, 768]:
        page.set_viewport_size({"width": width, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
        assert page.locator('button[aria-label^="查看"]:visible').count() == 12
        page.get_by_role("button", name="查看夫妻", exact=False).filter(visible=True).click()
        expect(page.locator('[aria-label="宮位詳情"]')).to_contain_text("夫妻")
        page.screenshot(path=str(output / f"width-{width}.png"), full_page=True)

    # Seed an old-format record in this disposable browser only. No schema upgrade,
    # implicit gender assignment or rewrite of existing records should be needed.
    legacy = {"id": "legacy-profile", "label": "舊版資料", "savedAt": 1, "birthForm": {
        "name": "舊版人物", "date": "1988-02-29", "time": "08:10", "timezone": "Asia/Taipei",
        "city": "台北", "latitude": "25.0330", "longitude": "121.5654", "houseSystem": "Koch",
    }}
    page.evaluate("""record => new Promise((resolve, reject) => {
        const request = indexedDB.open('astro-app', 2);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('birth-profiles', 'readwrite');
            tx.objectStore('birth-profiles').put(record);
            tx.oncomplete = () => { db.close(); resolve(true); };
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    })""", legacy)
    page.reload(wait_until="networkidle")
    page.get_by_role("button", name="儲存／帶入基本資料").click()
    page.get_by_role("dialog").get_by_role("listitem").filter(has_text="舊版資料").get_by_role("button", name="帶入", exact=True).click()
    expect(page.locator("#ziwei-name")).to_have_value("舊版人物")
    expect(page.locator("#ziwei-ziwei-gender")).to_have_value("")
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.locator('aside [role="alert"]')).to_contain_text("請選擇紫微排盤性別")
    page.locator("#ziwei-ziwei-gender").select_option("male")
    page.get_by_role("button", name="排紫微命盤", exact=True).click()
    expect(page.get_by_role("heading", name="舊版人物的紫微命盤")).to_be_visible()
    stored = page.evaluate("""() => new Promise((resolve, reject) => {
        const request = indexedDB.open('astro-app', 2);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('birth-profiles', 'readonly');
            const get = tx.objectStore('birth-profiles').get('legacy-profile');
            get.onsuccess = () => resolve(get.result);
            tx.oncomplete = () => db.close();
            tx.onerror = () => reject(tx.error);
        };
    })""")
    assert stored == legacy
    assert not errors, errors
    assert not blocked, blocked
    browser.close()
    print("PASS: shared forms, saved-profile reload, late Zi, validation, 12 palaces, western API calculations, desktop/tablet/mobile; no AI requests or page errors")
