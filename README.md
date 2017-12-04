# nano-patents
a small USPTO patent scraper turned quiz game with a focus on nanotechnology

**Demo**: https://f--f.github.io/nano-patents/ (note: not intended for mobile, best suited for widescreen displays)

### background:

This was a short "game" I had made for a university science outreach event promoting nanotechnology based on an initial Python script (`patent_search.py`) for scraping utility patents through USPTO's patent API with output to an SQLite database (`db.sqlite`). It involves trying to guess the origin of patents given their description by clicking on an interactive world map.

The "game" side of things was always meant to be open locally (reading an SQLite file from within the DOM isn't really ideal). Opening within Chrome requires the `--allow-file-access-from-files` flag to be turned on (if accessed locally) but it works fine in Firefox by default.

For the sake of proper attribution, any external scripts used are linked directly to their respective repositories (see `index.html`).

### screenshot:
![Screenshot](/screenshot.png?raw=true "Screenshot")
