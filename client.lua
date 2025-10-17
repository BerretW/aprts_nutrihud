-- ================================================
-- FILE: client.lua (VERZE S PLOVOUCÍM TEXTEM)
-- ================================================
local HUD_NAMESPACE = "aprts_nutrihud"
local SHOW_ON_START = true
local REFRESH_MS = 500

local hudVisible = SHOW_ON_START
local isMoveMode = false
-- Uložíme si poslední stav, abychom mohli detekovat změny
local lastNutrition = { protein = -1, fats = -1, carbs = -1, vitamins = -1 } -- Startujeme s -1 pro jistotu prvního updatu

-- [[ Funkce pro zaokrouhlení ]]
local function round(num)
    return math.floor(num + 0.5)
end

-- Ukládá pozici i velikost
local function saveSettings(x, y, width, height)
    SetResourceKvp(HUD_NAMESPACE..":settings:x", x)
    SetResourceKvp(HUD_NAMESPACE..":settings:y", y)
    SetResourceKvp(HUD_NAMESPACE..":settings:width", width)
    SetResourceKvp(HUD_NAMESPACE..":settings:height", height)
end

-- Načítá pozici i velikost
local function loadSettings()
    local x = tonumber(GetResourceKvpString(HUD_NAMESPACE..":settings:x")) or 0.8
    local y = tonumber(GetResourceKvpString(HUD_NAMESPACE..":settings:y")) or 0.1
    local width = tonumber(GetResourceKvpString(HUD_NAMESPACE..":settings:width")) or 0.15
    local height = tonumber(GetResourceKvpString(HUD_NAMESPACE..":settings:height")) or 0.25
    return x, y, width, height
end

-- Funkce pro přepnutí režimu přesunu
local function setMoveMode(state)
    isMoveMode = state
    SetNuiFocus(isMoveMode, isMoveMode)
    SendNUIMessage({ action = "toggleMoveControls", show = isMoveMode })
end

-- Toggle viditelnosti
RegisterCommand("nutrihud", function()
    hudVisible = not hudVisible
    SendNUIMessage({ action = "visible", visible = hudVisible })
end, false)

-- Přepínání režimu pro přesun/zrušení
RegisterCommand("nutrihud_move", function()
    setMoveMode(not isMoveMode)
end, false)

-- Uložení pozice a velikosti z NUI (voláno z JS)
RegisterNUICallback("saveSettings", function(data, cb)
    print("Ukládání nastavení:", json.encode(data))
    if data and data.x and data.y and data.width and data.height then
        saveSettings(data.x, data.y, data.width, data.height)
    end
    setMoveMode(false)
    cb({ ok = true })
end)

-- Init
CreateThread(function()
    local x, y, width, height = loadSettings()
    SendNUIMessage({
        action = "init",
        x = x,
        y = y,
        width = width,
        height = height,
        visible = hudVisible
    })
end)

-- Hlavní smyčka pro aktualizaci
CreateThread(function()
    while true do
        Wait(REFRESH_MS)
        if hudVisible then
            local n = exports["aprts_consumable"] and exports["aprts_consumable"]:getNutrition()
            if n then
                -- Zajistíme, že hodnoty nejsou nil
                n.protein = n.protein or 0
                n.fats = n.fats or 0
                n.carbs = n.carbs or 0
                n.vitamins = n.vitamins or 0
                
                -- Inicializace, pokud ještě neproběhla
                if lastNutrition.protein == -1 then
                    lastNutrition = n
                end

                -- Vytvoříme payload s aktuálními hodnotami
                local payload = {
                    action   = "update",
                    protein  = n.protein,
                    fats     = n.fats,
                    carbs    = n.carbs,
                    vitamins = n.vitamins
                }

                -- [[ NOVÉ: Výpočet rozdílu (delty) a přidání do payloadu ]]
                local protein_delta = n.protein - lastNutrition.protein
                if math.abs(protein_delta) >= 1.0 then payload.protein_delta = round(protein_delta) end
                
                local fats_delta = n.fats - lastNutrition.fats
                if math.abs(fats_delta) >= 1.0 then payload.fats_delta = round(fats_delta) end

                local carbs_delta = n.carbs - lastNutrition.carbs
                if math.abs(carbs_delta) >= 1.0 then payload.carbs_delta = round(carbs_delta) end

                local vitamins_delta = n.vitamins - lastNutrition.vitamins
                if math.abs(vitamins_delta) >= 1.0 then payload.vitamins_delta = round(vitamins_delta) end
                
                SendNUIMessage(payload)
                
                -- Aktualizujeme poslední známé hodnoty
                lastNutrition = n
            end
        end
    end
end)

-- Deaktivace při smrti
AddEventHandler('baseevents:onPlayerDied', function() SendNUIMessage({ action = "visible", visible = false }) end)
AddEventHandler('baseevents:onPlayerSpawned', function() SendNUIMessage({ action = "visible", visible = hudVisible }) end)