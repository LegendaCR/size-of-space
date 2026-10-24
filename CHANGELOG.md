# Changelog

## v1.0.0: first release

An interactive journey through the scale of the cosmos: scroll from a 490-metre asteroid to the edge of the observable universe.

**Live demo:** https://legendacr.github.io/size-of-space/

### Highlights

- **79 objects across 24 orders of magnitude**: asteroids, comets, moons, planets, stars, black holes, nebulae, star clusters, galaxies and the largest structures in the universe.
- **Real surfaces**: planets and moons use spacecraft maps (NASA, JPL, USGS, Solar System Scope) on 3D spheres with relief, atmospheres and physically based lighting. Earth has moving clouds with shadows, ocean glint and city lights.
- **Ray-traced rings** for Saturn and Uranus with mutual shadows, and **ray-marched 3D asteroids and comets** with self-shadowing.
- **Procedural deep space**: stars, black holes with accretion disks, nebulae, galaxies and the cosmic web, all rendered by custom GLSL shaders.
- **Compare mode**: put any two objects side by side at true scale, with diameter and volume ratios, a magnifier for tiny objects and shareable links like `#compare=earth,sun`.
- **A generative soundtrack** that grows with the scale: pad, bass, arpeggio, choir, strings, timpani and bells.
- **Info cards** with sizes, distances and facts for every object, with unit explanations for astronomical units and light-years.
- **English and Russian**, keyboard, mouse, trackpad and touch navigation, and a link for every object.

### Run locally

```bash
git clone https://github.com/LegendaCR/size-of-space.git
cd size-of-space
npm install
npm run dev
```
