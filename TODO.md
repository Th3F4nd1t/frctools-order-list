# Must-do
- [ ] make WCP work (DPO)
- [x] Allow any vendor (not just those in the db) to be added
- [x] Clean up code for public release
    - [x] Orders page
    - [x] Org page
- [x] Set up db backup (go PlanetScale and workers, likely)
- [x] Fix product lookup not working bc cloudflare workers are getting blocked 

# Nice-to-haves
- [ ] Add custom organization-scoped order variables https://www.better-auth.com/docs/plugins/organization#customizing-the-schema
- [ ] Block member role from advancing orders - add org config for this behavior?
- [x] Allow filtering by order status in table view
- [ ] Allow importing and exporting orders via CSV
- [x] Fix SSR taking 2+ seconds (auth takes long?)
