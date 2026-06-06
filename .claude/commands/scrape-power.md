Scrape a single psionic power from the provided URL and import it into the compendium.

Steps:
1. Run the powers scraper: `cd tools/scrapers && node powers-scraper.mjs "$ARGUMENTS"`
2. Check the output for errors
3. Review the generated YAML file in `packs-source/powers/` by reading it
4. Verify the YAML has correct fields: name, discipline, description, actions (with range, duration, save, etc.)
5. Compile the packs: `npm run packs:compile`
6. Report the result and any issues found in the scraped data
