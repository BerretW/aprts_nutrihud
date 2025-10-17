-- ================================================
-- FILE: client.lua (FINÁLNÍ VERZE)
-- ================================================
local HUD_NAMESPACE = "aprts_nutrihud"
local SHOW_ON_START = true
local REFRESH_MS = 500

local hudVisible = SHOW_ON_START
local isMoveMode = false

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
    setMoveMode(false) -- Po uložení automaticky vypneme režim úprav
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

-- Fallback refresh
CreateThread(function()
    while true do
        Wait(REFRESH_MS)
        if hudVisible then
            local n = exports["aprts_consumable"] and exports["aprts_consumable"]:getNutrition()
            if n then
                SendNUIMessage({
                    action = "update",
                    protein = n.protein or 0,
                    fats    = n.fats or 0,
                    carbs   = n.carbs or 0,
                    vitamins= n.vitamins or 0
                })
            end
        end
    end
end)

-- Deaktivace při smrti
AddEventHandler('baseevents:onPlayerDied', function() SendNUIMessage({ action = "visible", visible = false }) end)
AddEventHandler('baseevents:onPlayerSpawned', function() SendNUIMessage({ action = "visible", visible = hudVisible }) end)