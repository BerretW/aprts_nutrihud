local HUD_NAMESPACE = "aprts_nutrihud"
local SHOW_ON_START = true
local REFRESH_MS = 500 -- fallback refresh (když nepřijde event)

local hudVisible = SHOW_ON_START
local dragLocked = false

-- Uložení/načtení pozice
local function kvpGet(key, def)
    local v = GetResourceKvpString(key)
    if v == nil or v == "" then return def end
    return v
end

local function savePos(x, y)
    SetResourceKvp(HUD_NAMESPACE..":pos", string.format("%d,%d", math.floor(x), math.floor(y)))
end

local function loadPos()
    local s = kvpGet(HUD_NAMESPACE..":pos", "30,30")
    local x, y = s:match("^(%-?%d+),(%-?%d+)$")
    return tonumber(x) or 30, tonumber(y) or 30
end

-- Toggle
RegisterCommand("nutrihud", function()
    hudVisible = not hudVisible
    SetNuiFocus(false, false)
    SendNUIMessage({ action = "visible", visible = hudVisible })
end)

-- Zámek drag
RegisterCommand("nutrihud_lock", function()
    dragLocked = not dragLocked
    SendNUIMessage({ action = "lock", locked = dragLocked })
end)

-- Save pozice z NUI
RegisterNUICallback("savePos", function(data, cb)
    if data and data.x and data.y then
        savePos(data.x, data.y)
    end
    cb({ ok = true })
end)

-- Init
CreateThread(function()
    local x, y = loadPos()
    SendNUIMessage({ action = "init", x = x, y = y, visible = hudVisible, locked = dragLocked })
end)

-- Přímý příjem dat z tvého systému
-- Očekává payload z aprts_nutrition:effectsUpdated
-- RegisterNetEvent("aprts_nutrition:effectsUpdated", function(payload)
--     if not hudVisible or not payload then return end
--     local n = payload.state or {}
--     local tags = payload.tags or {}
--     local avg = payload.avg or math.floor(((n.protein or 0)+(n.fats or 0)+(n.carbs or 0)+(n.vitamins or 0))/4)
--     local balance = payload.score or 0
--     debugprint(("nutrihud: got nutrition update: p=%d f=%d c=%d v=%d avg=%d bal=%d tags=%s"):format(
--         n.protein or 0, n.fats or 0, n.carbs or 0, n.vitamins or 0, avg, balance, table.concat(tags, ",")
--     ))
--     SendNUIMessage({
--         action = "update",
--         protein = n.protein or 0,
--         fats    = n.fats or 0,
--         carbs   = n.carbs or 0,
--         vitamins= n.vitamins or 0,
--         avg     = avg,
--         balance = balance,
--         tags    = tags
--     })
-- end)

-- Fallback refresh – když by eventy nepřicházely (volitelně si napoj na exports z tvého nutrition resource)
CreateThread(function()
    while true do
        if hudVisible then
            local ok, n = pcall(function()
                if exports["aprts_consumable"] and exports["aprts_consumable"].getNutrition then
                    return exports["aprts_consumable"]:getNutrition()
                end
                return nil
            end)
            if ok and n then
                local avg = math.floor(((n.protein or 0)+(n.fats or 0)+(n.carbs or 0)+(n.vitamins or 0))/4)
                local score, tags = 0, {}
                if exports["aprts_consumable"] and exports["aprts_consumable"].getNutritionScore then
                    local s, t = exports["aprts_consumable"]:getNutritionScore()
                    if s then score = s end
                    if t then tags = t end
                end
                SendNUIMessage({
                    action = "update",
                    protein = n.protein or 0,
                    fats    = n.fats or 0,
                    carbs   = n.carbs or 0,
                    vitamins= n.vitamins or 0,
                    avg     = avg,
                    balance = score,
                    tags    = tags or {}
                })
            end
        end
        Wait(REFRESH_MS)
    end
end)

-- Bezpečná deaktivace při smrti (schovej HUD pokud chceš)
AddEventHandler('baseevents:onPlayerDied', function()
    SendNUIMessage({ action = "visible", visible = false })
end)
AddEventHandler('baseevents:onPlayerSpawned', function()
    SendNUIMessage({ action = "visible", visible = hudVisible })
end)
