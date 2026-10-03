# Outpost — Browser Arena

A free, lightweight 3D arena game for Chrome and other modern browsers, with first-person controls on desktop and third-person controls on phones. The maps and low-poly character models are generated in the browser. The 3D renderer is Three.js, loaded from cdnjs; an internet connection is needed when the page first loads.

## Play

Run the included web server, then open `http://localhost:3000` in your browser:

```text
node server.js
```

Do not open `index.html` as a `file://` page. The account cookies and multiplayer connection need a web address.

Choose a mode:

- **Free for All** — fight the bots and rack up eliminations.
- **Survival** — survive endless, increasingly large bot waves.
- **Waves** — clear ten progressively tougher waves to win.
- **Territory War** — capture and hold zones for your team.

The game is playable solo against AI opponents or with other players who open the same server address and turn on **ONLINE**. The local server is self-contained: it does not require `npm install`.

Wave mode pays 10 credits for every cleared wave. Free-for-all and Territory War pay 100 credits for a victory. Spend credits in the Command Hub's Armory on primary and secondary weapons, or open the Operative Bay to preview, buy, and equip an avatar look. Your equipped appearance is sent with you into the online lobby.

Matches now include limited rifle magazines, manual or automatic reloads, sprint energy, and health/ammo drops from defeated bots. Collect the glowing drops by walking over them. The expanded arena has more cover and space to explore.

Bots now steer around trees, walls, and furniture, keep a more useful fighting distance, lead moving targets slightly, and only fire when they have a clear shot. They reload and can scavenge useful health or ammunition drops; bot eliminations can also leave loot behind. Projectiles have detailed brass-and-copper bullet shapes and travel at three times their previous speed; hit checks account for their full movement each frame.

## Controls

- **Desktop:** First-person view. Move with W/A/S/D or arrow keys, hold Shift to sprint, and use the mouse to look/aim. Click or hold Space to fire; press R to reload. The mouse is captured and hidden during a match; press Escape or P to pause and release it.
- **Phone/tablet:** Third-person view. Drag on the left side to move; push farther to sprint. Touch and hold on the right side to aim at the nearest opponent and fire. Use the small Reload button when needed.
- Movement supports both straight and diagonal directions.

## Performance and compatibility

Characters use 26 individually named, animated body parts, with visible hands positioned on their 21-part rifles. The larger 3D arena includes four enterable, open-roof buildings with doorways, window openings, interior floors, furniture, and cover. Arena props, buildings, terrain details, and effects are procedurally generated; there are no separate model or texture downloads. The visual pass includes high-resolution desktop terrain textures, soft directional shadows, ACES filmic colour, a sun glow, atmospheric dust, and dense grass detail. Desktop rendering uses a 2.2× device-pixel-ratio cap with a 2048px shadow map; touch devices use a 1.25× cap and 1024px shadow map to protect performance. These settings increase rendering/GPU resource use, not a guaranteed amount of browser JavaScript RAM; actual memory use and frame rate vary by browser and device. WebGL and an internet connection to load Three.js are required.

## Publishing online

For a public game, deploy this whole folder to a Node.js-compatible host that supports WebSockets, then use its HTTPS address. GitHub Pages can host the solo page, but it cannot run this multiplayer server. A public HTTPS address is the right final choice; `file://` is not.
