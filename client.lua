-- ================================================
-- FILE: client.lua (ZJEDNODUŠENÁ VERZE BEZ PŘESOUVÁNÍ)
-- ================================================
local HUD_NAMESPACE = "aprts_nutrihud"
local SHOW_ON_START = true
local REFRESH_MS = 500

local hudVisible = SHOW_ON_START
local lastNutrition = { protein = -1, fats = -1, carbs = -1, vitamins = -1 }

-- [[ Funkce pro zaokrouhlení ]]
local function round(num)
    return math.floor(num + 0.5)
end

-- Toggle viditelnosti
RegisterCommand("nutrihud", function()
    hudVisible = not hudVisible
    SendNUIMessage({ action = "visible", visible = hudVisible })
end, false)

-- Init
CreateThread(function()
    -- Při startu jen pošleme, zda má být HUD viditelný
    SendNUIMessage({
        action = "init",
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
                n.protein = n.protein or 0
                n.fats = n.fats or 0
                n.carbs = n.carbs or 0
                n.vitamins = n.vitamins or 0
                
                if lastNutrition.protein == -1 then
                    lastNutrition = n
                end

                local payload = {
                    action   = "update",
                    protein  = n.protein,
                    fats     = n.fats,
                    carbs    = n.carbs,
                    vitamins = n.vitamins
                }

                local protein_delta = n.protein - lastNutrition.protein
                if math.abs(protein_delta) >= 1.0 then payload.protein_delta = round(protein_delta) end
                
                local fats_delta = n.fats - lastNutrition.fats
                if math.abs(fats_delta) >= 1.0 then payload.fats_delta = round(fats_delta) end

                local carbs_delta = n.carbs - lastNutrition.carbs
                if math.abs(carbs_delta) >= 1.0 then payload.carbs_delta = round(carbs_delta) end

                local vitamins_delta = n.vitamins - lastNutrition.vitamins
                if math.abs(vitamins_delta) >= 1.0 then payload.vitamins_delta = round(vitamins_delta) end
                
                SendNUIMessage(payload)
                
                lastNutrition = n
            end
        end
    end
end)

-- Deaktivace při smrti
AddEventHandler('baseevents:onPlayerDied', function() SendNUIMessage({ action = "visible", visible = false }) end)
AddEventHandler('baseevents:onPlayerSpawned', function() SendNUIMessage({ action = "visible", visible = hudVisible }) end)