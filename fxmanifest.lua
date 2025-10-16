fx_version 'cerulean'
game 'rdr3'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

name 'aprts_nutrihud'
author 'aprt'
description 'Minimal NUI HUD for nutrition (protein/fats/carbs/vitamins + avg/balance/tags)'
version '1.0.0'

ui_page 'html/index.html'

files {
  'html/index.html',
  'html/style.css',
  'html/script.js'
}

client_scripts {
  'client.lua'
}

lua54 'yes'
