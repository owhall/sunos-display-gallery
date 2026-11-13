# SunOS Display Programs — Browser Recreations

A build-free HTML/CSS/JavaScript gallery inspired by animation, graphics demonstration, and workstation-locking programs documented in SunOS 4.x manuals.

## Included programs

- `life` — Conway's Game of Life
- `rain` — viewer-facing terminal raindrops that expand into ASCII splashes
- `worms` — crawling terminal worms
- `snake` — an interactive chase game
- `rotobj` — rotating 3D object demonstration
- `flight` — graphics/flight demonstration
- `bsuncube` — three-dimensional Sun-style cube
- `brotcube` — rotating cube
- `lockscreen_default` — a sequence of Life patterns
- `lockscreen` — a launcher/lock-screen simulation for the graphics programs

## Run locally

This project has no dependencies or build step. From the repository root, serve the static directory:

```powershell
python -m http.server 8080 --directory docs
```

Then open <http://localhost:8080>.

You can also open `docs/index.html` directly, although a local HTTP server is recommended.

## Controls

- Pick a program from the left-hand gallery.
- Use **Pause/Resume**, **Restart**, **Slower/Faster**, and **Fullscreen** in the control bar.
- `snake` starts in a self-playing, screensaver-style attract mode. Press an arrow key, vi-style `hjkl`, or the original `sefc` directional pad to take control of `I`. Collect `$`, avoid the `Ssssss` pursuer, and reach `#` to bank the score. Uppercase `ATPB` jump to the four field edges, uppercase `W` performs a space warp with a 10% penalty, and `p` or `d` gives a direction hint. Restart restores automatic mode.
- In `flight`, pointer movement controls pitch and bank. Left click slows, right click accelerates, middle click restarts, and right-drag rolls without banking.
- In `bsuncube`, right click switches between `DisplayObject` and `SelectView`. In the front diagram, left click sets x and middle click sets y; in the top diagram, middle click sets z.
- Click or drag in `life` to toggle cells; **Restart** creates a new seeded field.
- In `lockscreen`, choose the simulated graphics program and select **Engage lock**. Any key or pointer action exits the simulation; no real authentication or workstation locking occurs.

## Historical scope and caveats

This is a clean-room visual recreation, not a source port or emulator. The program names and broad purposes are documented in SunOS 4.x references, but surviving manual descriptions do not fully specify frame timing, palettes, geometry, physics, random seeds, input behavior, or hardware-specific rendering. Those details are intentionally labeled **interpretive** in the gallery.

In particular:

- `rain` follows the surviving Berkeley-era impact sequence: `.`, `o`, `O`, a small `|.|` splash, and a larger five-line splash. SunOS documents it as modeled after the VAX/VMS program; typography, density, color, and timing remain browser approximations.
- `worms` now follows the surviving 4.3BSD implementation’s defaults: three worms, length 16, glyphs `O`, `*`, and `#`, eight possible headings, 45-degree turn choices, boundary-constrained motion, and a shared lower-left start. Canvas typography and timing remain adaptations. `life` still follows its documented concept without claiming an exact source port.
- `snake` now follows the surviving 4.3BSD implementation’s key data and behavior: `I`, an `S` head with five `s` tail segments, `$`, `#`, eight-direction weighted pursuit, `$25` treasure increments at the gallery’s standard field scale, a 10% space-warp penalty, the original movement sets, and `p`/`d` direction hints. Its automatic player is a reconstruction based on recollection of the screensaver/display version; its strategy is not claimed to come from the Berkeley game source. Field dimensions, timing, the caught-player bonus game, and terminal-specific presentation remain adapted or omitted.
- `flight` follows the documented mouse mapping for dive, climb, bank, roll, speed, and restart. Its terrain, cockpit, physics, and graphics remain interpretive.
- `bsuncube` follows the documented `DisplayObject`/`SelectView` workflow, hidden-face display, and mouse mapping. Its projection math and procedural Sun emblems are original.
- `brotcube` follows the manual’s unusually specific 14-vector skeleton and 100-view rotation cycle. `rotobj` and both cube programs are still Canvas projections, not hardware-accurate SunCore emulation.
- `lockscreen_default` uses a curated sequence of common Life patterns; the exact original pattern set and order are uncertain.
- `lockscreen` demonstrates the historical role of a user-supplied graphics program while locked. It deliberately does **not** lock the browser or collect a password.

Primary reference starting points:

- [SunOS 4.1.1 `lockscreen(1)`](https://www.typewritten.org/Manual/Sun/SunOS/4.1.1/man1/lockscreen.html)
- [SunOS 4.1.1 `graphics_demos(6)`](https://www.typewritten.org/Manual/Sun/SunOS/4.1.1/man6/graphics_demos.html)
- [SunOS 4.1.3 `gp_demos(6)`](https://man.freebsd.org/cgi/man.cgi?manpath=SunOS+4.1.3&query=gp_demos&sektion=6)
- [SunOS 3.0 `snake(6)`](https://www.typewritten.org/Manual/Sun/SunOS/3.0/man6/snscore.html)
- [SunOS 3.0 `bsuncube(6)`](https://www.typewritten.org/Manual/Sun/SunOS/3.0/man6/bsuncube.html)
- [4.3BSD `rain.c` source listing](https://retro11.de/ouxr/43bsd/usr/src/games/rain.c.html)
- [4.3BSD `worms.c` source listing](https://retro11.de/ouxr/43bsd/usr/src/games/worms.c.html)
- [4.3BSD `snake.c` source listing](https://retro11.de/ouxr/43bsd/usr/src/games/snake/snake.c.html) and [movement code](https://retro11.de/ouxr/43bsd/usr/src/games/snake/move.c.html)
- [SunOS 3.0 `brotcube(6)`](https://www.typewritten.org/Manual/Sun/SunOS/3.0/man6/brotcube.html)
- [Sun Release 2.3 media manifest](https://vtda.org/docs/computing/Sun/software/800-1380-04%20-%20Release%202.3%20Manual%20for%20the%20Sun%20Workstation.pdf), which lists `flight.c`, `flight_dat.h`, and `rotobj.c`
- [SunOS 3.2 Source Installation Guide](https://www.bitsavers.org/pdf/sun/sunos/3.2/800-1490-01A_3.2_Source_Installation_Guide_198610.pdf), documenting the six SUNSRC and two WINSRC tapes
- [SunOS 4.1 Reference Manual, Volume 1](https://www.bitsavers.org/pdf/sun/sunos/4.1/800-3827-10A_SunOS_Reference_Manual_Vol1_199003.pdf)

### Source-recovery status

The Berkeley game sources are available as readable listings, so `rain`, `worms`, and the core of `snake` can be checked directly. Sun’s Release 2.3 manifest confirms that `flight.c`, `flight_dat.h`, and `rotobj.c` were distributed as demonstration source, and the SunOS 3.2 source guide describes the relevant source-tape sets. The archive pages located during this project expose media inventories and, in some cases, installation images, but not a small independently verifiable copy of those individual files; this repository therefore does not claim a source-level recreation of `flight` or `rotobj`.

No source listings for `bsuncube.c` or `brotcube.c` were located. Their implementations are based on the surviving manual pages instead. The `brotcube(6)` page specifies a 14-vector cube and a 100-view rotation; `bsuncube(6)` specifies hidden-face removal, the two operating modes, and the mouse-to-viewpoint mapping. Those statements are treated as source-backed behavior only at the manual level.

## Publish on GitHub Pages

The ready-to-publish site is in `docs/`, so GitHub Pages can serve it directly without a build workflow.

1. Create an empty GitHub repository.
2. Add it as this project's `origin`, then push the `main` branch.
3. In the GitHub repository, open **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Select the **main** branch and the **/docs** folder, then save.

The site will appear at `https://YOUR-USER.github.io/YOUR-REPOSITORY/`. All asset links are relative, so project pages and custom domains both work without changes.

The same `docs/` directory can also be published with Netlify, Cloudflare Pages, or another static provider.

## License

The original implementation in this repository is provided under the MIT License. Sun, SunOS, and related marks belong to their respective owners. No original SunOS code or assets are included.
