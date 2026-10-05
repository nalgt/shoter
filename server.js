:root {
  color-scheme: dark;
  --ink: #101721;
  --panel: rgba(17, 25, 35, .94);
  --text: #f0f2ee;
  --muted: #929ba3;
  --lime: #d8ff57;
  --line: rgba(226, 234, 229, .13);
  --cyan: #6fe7ff;
  --red: #ff7a6d;
  font-family: Inter, sans-serif;
}

* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--ink); }
body { color: var(--text); }
button { font: inherit; }
button:focus-visible, input:focus-visible { outline: 2px solid rgba(111, 231, 255, .8); outline-offset: 2px; }
.game-shell { position: relative; width: 100%; height: 100%; min-height: 420px; overflow: hidden; isolation: isolate; background: #17222a; }
#game { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
.game-shell.playing.first-person { cursor: none; }
.game-shell.first-person:not(.playing) { cursor: default; }

.topbar { position: absolute; z-index: 2; inset: 0 0 auto; height: 74px; padding: 0 4.3%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,.08); background: linear-gradient(180deg, rgba(8, 13, 18, .72), rgba(8, 13, 18, 0)); }
.brand { display: flex; gap: 11px; align-items: center; color: var(--text); font-size: 17px; font-weight: 800; letter-spacing: .11em; text-decoration: none; }
.brand-mark { width: 33px; height: 33px; display: grid; place-items: center; border: 2px solid var(--lime); color: var(--lime); font: 800 21px "Barlow Condensed", sans-serif; transform: skew(-7deg); }
.brand small { display: block; margin-top: 2px; color: #929ba3; font: 9px "DM Mono", monospace; letter-spacing: .16em; }
.topbar-right { display: flex; align-items: center; gap: 20px; }
.online-indicator, .eyebrow, .bottom-hint, .fine-print, .panel-kicker, .screen-aside { font: 10px "DM Mono", monospace; letter-spacing: .12em; }
.online-indicator { color: #c1c9c6; }
.online-indicator i, .panel-kicker span { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 12px rgba(216,255,87,.65); }
.icon-button { width: 36px; height: 36px; border: 1px solid var(--line); background: rgba(20,29,38,.65); color: var(--text); cursor: pointer; font-size: 15px; }

.hud { position: absolute; z-index: 2; top: 100px; left: 3.5%; right: 3.5%; display: flex; align-items: flex-start; justify-content: space-between; pointer-events: none; }
.hud-card { min-width: 185px; padding: 15px 18px; background: rgba(17,25,35,.78); border: 1px solid var(--line); backdrop-filter: blur(10px); }
.eyebrow { display: block; color: #9da7a8; font-size: 9px; }
.health-line { margin: 5px 0 8px; font: 800 22px "Barlow Condensed", sans-serif; }
.health-line span { color: var(--muted); font-size: 14px; }
.meter { height: 3px; background: rgba(255,255,255,.13); }
.meter i { display: block; width: 100%; height: 100%; background: var(--lime); transition: width .15s ease; }
.objective-card { min-width: 240px; text-align: center; }
.objective-card strong { display: block; margin-top: 7px; font: 700 20px "Barlow Condensed", sans-serif; letter-spacing: .05em; }
.objective-card strong b { color: var(--lime); }
.objective-card > span:last-child { display: block; margin-top: 3px; color: var(--muted); font-size: 10px; }
.clock-card { min-width: 145px; text-align: right; }
.clock-card strong { display: block; margin-top: 5px; font: 700 25px "DM Mono", monospace; }

.screen { position: absolute; z-index: 4; inset: 0; display: grid; place-items: center; padding: 85px 18px 60px; background: linear-gradient(90deg, rgba(10,16,21,.88) 0%, rgba(10,16,21,.73) 39%, rgba(10,16,21,.96)); }
.screen.hidden { display: none; }
.onboarding-screen { background: radial-gradient(circle at 72% 28%, rgba(216,255,87,.14), transparent 27%), linear-gradient(120deg, rgba(8,14,19,.96), rgba(14,23,29,.76)); }
.onboarding-panel { width: min(460px, 100%); }
.human-check { width: 100%; min-height: 92px; display: flex; align-items: center; gap: 17px; padding: 16px 18px; border: 1px solid rgba(216,255,87,.62); background: rgba(216,255,87,.07); color: var(--text); cursor: pointer; transition: transform .15s ease, background .15s ease; }
.human-check:hover { transform: translateY(-2px); background: rgba(216,255,87,.14); }
.human-check.verified { border-color: var(--lime); background: rgba(216,255,87,.19); }
.human-core { width: 46px; height: 46px; flex: 0 0 auto; border: 2px solid var(--lime); border-radius: 50%; background: radial-gradient(circle, var(--lime) 0 22%, transparent 25%); box-shadow: 0 0 18px rgba(216,255,87,.5); }
.human-check strong, .human-check small { display: block; }
.human-check strong { font: 800 16px "DM Mono", monospace; letter-spacing: .07em; }
.human-check small { margin-top: 5px; color: var(--muted); font-size: 11px; }

.panel { width: min(500px, 100%); padding: 29px 39px 31px; background: var(--panel); border: 1px solid rgba(228,237,226,.16); box-shadow: 0 22px 80px rgba(0,0,0,.32); backdrop-filter: blur(18px); }
.panel-kicker { color: var(--lime); font-size: 9px; }
.panel-kicker span { width: 6px; height: 6px; }
h1, h2 { margin: 17px 0 10px; font: 900 68px/.83 "Barlow Condensed", sans-serif; letter-spacing: -.015em; }
h1 em, h2 em { color: var(--lime); font-style: normal; }
h2 { font-size: 52px; }
.intro { max-width: 350px; margin: 15px 0 23px; color: #aab3b6; font-size: 14px; line-height: 1.6; }

.map-selector, .mode-list { display: grid; gap: 7px; }
.map-selector { margin-bottom: 10px; }
.map-option, .mode-option { width: 100%; min-height: 68px; display: flex; align-items: center; gap: 14px; padding: 11px 14px; border: 1px solid rgba(230,240,232,.1); background: rgba(255,255,255,.025); color: var(--text); cursor: pointer; text-align: left; transition: transform .15s ease, border-color .15s ease, background .15s ease; }
.map-option:hover, .mode-option:hover { transform: translateX(2px); border-color: rgba(216,255,87,.55); }
.map-option.selected, .mode-option.selected { border-color: var(--lime); background: rgba(216,255,87,.075); }
.map-code, .mode-number { width: 22px; color: var(--lime); font: 12px "DM Mono", monospace; }
.map-copy, .mode-copy { flex: 1; }
.map-copy strong, .mode-copy strong { display: block; font: 700 16px "Barlow Condensed", sans-serif; letter-spacing: .07em; }
.map-copy small, .mode-copy small { display: block; margin-top: 4px; color: #98a1a4; font-size: 11px; line-height: 1.4; }
.mode-arrow { color: var(--lime); font-size: 15px; }

.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 46px; margin-top: 14px; padding: 0 20px; border: 1px solid var(--lime); background: rgba(216,255,87,.1); color: var(--text); font: 11px "DM Mono", monospace; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
.primary-button span { color: var(--lime); }

.hub-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.hub-action { min-height: 42px; padding: 7px 10px; border: 1px solid var(--line); background: rgba(255,255,255,.035); color: var(--text); font: 10px "DM Mono", monospace; letter-spacing: .07em; cursor: pointer; }
.hub-action span { display: block; margin-top: 3px; color: var(--lime); font-size: 9px; }
.hub-action.selected { border-color: var(--lime); background: rgba(216,255,87,.1); }

.callsign-label { display: block; margin: 10px 0 4px; color: var(--muted); font: 9px "DM Mono", monospace; letter-spacing: .12em; }
.callsign-input { width: 100%; height: 35px; padding: 0 10px; border: 1px solid var(--line); outline: 0; background: rgba(255,255,255,.045); color: var(--text); }
.callsign-input:focus { border-color: var(--lime); }
.online-status { min-height: 14px; margin: 6px 0 0; color: #9da7a8; font: 10px "DM Mono", monospace; }

.shop-panel, .avatar-panel { width: min(690px, 100%); max-height: min(86vh, 900px); overflow-y: auto; }
.shop-heading, .avatar-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; }
.shop-heading h2, .avatar-heading h2 { margin-bottom: 0; }
.shop-heading > strong, .avatar-heading > strong { color: var(--lime); font: 12px "DM Mono", monospace; white-space: nowrap; }
.shop-section-title { margin: 17px 0 7px; color: var(--lime); font: 11px "DM Mono", monospace; letter-spacing: .13em; }
.shop-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.shop-card { min-width: 0; padding: 12px; border: 1px solid var(--line); background: rgba(255,255,255,.035); }
.shop-card.equipped { border-color: rgba(216,255,87,.72); background: rgba(216,255,87,.07); }
.shop-card h4 { margin: 0; font: 700 15px "Barlow Condensed", sans-serif; letter-spacing: .04em; }
.shop-card p { min-height: 32px; margin: 6px 0; color: var(--muted); font-size: 10px; line-height: 1.5; }
.shop-card .weapon-stats { color: #c4ccc8; font: 9px "DM Mono", monospace; }
.shop-card button { width: 100%; min-height: 32px; margin-top: 9px; border: 1px solid rgba(216,255,87,.5); background: transparent; color: var(--lime); font: 9px "DM Mono", monospace; cursor: pointer; }
.shop-card button:disabled { border-color: var(--line); color: var(--muted); cursor: default; }

.avatar-layout { display: grid; grid-template-columns: 165px 1fr; align-items: center; gap: 22px; margin: 12px 0 17px; padding: 16px; border: 1px solid var(--line); background: radial-gradient(circle at 30% 20%, rgba(111,231,255,.12), transparent 38%), rgba(16,23,29,.7); }
.avatar-preview { --armor: #536d52; --dark: #263127; position: relative; width: 126px; height: 188px; margin: 0 auto; filter: drop-shadow(0 14px 12px rgba(0,0,0,.35)); }
.avatar-preview[data-skin="arctic"] { --armor: #8aaab5; --dark: #374a55; }
.avatar-preview[data-skin="crimson"] { --armor: #b5564d; --dark: #542d2b; }
.avatar-preview span { position: absolute; display: block; }
.avatar-helmet { z-index: 2; top: 7px; left: 38px; width: 50px; height: 41px; border: 4px solid var(--armor); border-radius: 50% 50% 38% 38%; background: var(--dark); }
.avatar-head { z-index: 1; top: 27px; left: 47px; width: 32px; height: 30px; border-radius: 0 0 44% 44%; background: #c5a98a; }
.avatar-visor { z-index: 3; top: 30px; left: 48px; width: 28px; height: 9px; border-radius: 12px; background: var(--dark); }
.avatar-body { z-index: 1; top: 57px; left: 42px; width: 42px; height: 54px; border-radius: 10px 10px 12px 12px; background: var(--armor); }
.avatar-arm { z-index: 0; top: 65px; width: 12px; height: 45px; border-radius: 12px; background: var(--armor); }
.avatar-arm-left { left: 28px; transform: rotate(18deg); }
.avatar-arm-right { right: 28px; transform: rotate(-18deg); }
.avatar-leg { z-index: 0; bottom: 0; width: 14px; height: 44px; border-radius: 12px; background: var(--dark); }
.avatar-leg-left { left: 44px; }
.avatar-leg-right { right: 44px; }
.avatar-rifle { z-index: 4; left: 58px; top: 83px; width: 56px; height: 12px; border-radius: 18px; background: linear-gradient(90deg, #4a4e4d, #6a7a73); transform: rotate(-28deg); }
.avatar-summary { display: flex; flex-direction: column; gap: 8px; }
.avatar-summary strong { font: 700 30px "Barlow Condensed", sans-serif; letter-spacing: .05em; }
.avatar-summary small { color: var(--muted); font-size: 11px; }
.skin-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.skin-choice { display: flex; flex-direction: column; gap: 4px; width: 100%; min-height: 58px; padding: 8px 10px; border: 1px solid var(--line); background: rgba(255,255,255,.025); color: var(--text); cursor: pointer; }
.skin-choice.selected { border-color: var(--lime); background: rgba(216,255,87,.08); }
.skin-choice strong { font: 700 15px "Barlow Condensed", sans-serif; }
.skin-choice small { color: var(--muted); font-size: 10px; }

.compact-panel { width: min(440px, 100%); }
.text-button { display: block; margin: 8px auto 0; border: 0; background: transparent; color: var(--muted); font: 9px "DM Mono", monospace; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }

.crosshair { position: absolute; z-index: 3; left: 50%; top: 50%; width: 24px; height: 24px; transform: translate(-50%, -50%); border: 1px solid rgba(216,255,87,.9); border-radius: 50%; box-shadow: 0 0 12px rgba(216,255,87,.26); }
.crosshair::before, .crosshair::after { content: ""; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: rgba(216,255,87,.8); }
.crosshair::before { width: 1px; height: 30px; }
.crosshair::after { width: 30px; height: 1px; }

.combat-hud { position: absolute; right: 28px; bottom: 80px; z-index: 3; display: flex; flex-direction: column; gap: 10px; min-width: 200px; padding: 14px 18px; background: rgba(16,24,29,.76); border: 1px solid rgba(255,255,255,.08); backdrop-filter: blur(8px); }
.ammo-readout, .stamina-readout { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ammo-readout strong { font: 700 20px "DM Mono", monospace; color: var(--lime); }
.reserve-count { color: var(--muted); font: 12px "DM Mono", monospace; }
.stamina-readout { justify-content: space-between; }
.stamina-readout .meter { width: 110px; }
.stamina-readout .meter i { background: linear-gradient(90deg, #7ef0ff, #d8ff57); }

.status-panel { position: absolute; right: 28px; top: 112px; z-index: 3; min-width: 190px; padding: 12px 14px; border: 1px solid rgba(255,255,255,.1); background: rgba(17,25,35,.66); backdrop-filter: blur(10px); }
.status-row { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; font: 9px "DM Mono", monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.status-row strong { color: var(--text); }

.bottom-hint { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); color: rgba(224,239,255,.82); letter-spacing: .15em; text-transform: uppercase; font-size: 10px; background: rgba(13,22,27,.48); border: 1px solid rgba(112,171,198,.2); border-radius: 999px; padding: 8px 16px; z-index: 3; }

.mobile-controls { position: absolute; z-index: 4; inset: auto 0 0 0; display: none; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 18px 18px; background: linear-gradient(180deg, rgba(9, 15, 22, 0), rgba(9,15,22,.82)); }
.mobile-controls.active { display: flex; }
.mobile-controls span { color: rgba(255,255,255,.82); font: 9px "DM Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.mobile-controls i { display: block; width: 1px; height: 22px; background: rgba(255,255,255,.25); }
.reload-button { min-width: 82px; padding: 8px 12px; border: 1px solid var(--line); background: rgba(255,255,255,.04); color: var(--text); font: 9px "DM Mono", monospace; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }

@media (max-width: 820px) {
  .hud { left: 2%; right: 2%; top: 80px; }
  .hud-card { min-width: 0; padding: 10px 12px; }
  .objective-card { min-width: 0; }
  .screen { padding-top: 70px; }
  .shop-grid, .skin-choices { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .brand span:nth-child(2) { font-size: 13px; letter-spacing: .08em; }
  .brand small { letter-spacing: .08em; }
  .topbar-right { gap: 10px; }
  .hub-actions { grid-template-columns: 1fr; }
  .status-panel { display: none; }
  .screen-aside { display: none; }
  .bottom-hint { width: calc(100% - 18px); text-align: center; font-size: 8px; }
  .combat-hud { right: 12px; bottom: 74px; min-width: 160px; }
}
