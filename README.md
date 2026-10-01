# Sam-Landshaft Frontend

**Sam-Landshaft is an interactive landscape geoportal for the Samarkand region of Uzbekistan.** It brings environmental maps into one place so users can explore regional conditions, compare observations across years, and examine selected locations and areas.

The project supports landscape monitoring, research communication, and the presentation of spatial data. This repository contains the public map portal and its administration interface. The interface is primarily in Uzbek.

## Project purpose

Environmental indicators are easier to interpret when they can be viewed in their geographical context. Sam-Landshaft allows users to move between thematic maps, inspect local values, and follow changes over time through an interactive browser application.

The portal can help researchers, students, and specialists explore prepared landscape datasets and present their findings through maps, charts, and animations.

## Environmental indicators

The portal supports thematic categories such as:

- Soil salinity and soil moisture.
- Fractional vegetation cover (FVC) and vegetation indices.
- Land surface temperature (LST).
- Land cover and other landscape indicators.

Available indicators and observation years depend on the datasets added to the portal. Each layer can have its own description, measurement unit, value range, and colour legend.

## Main features

### Interactive maps

Users can select an indicator and year, switch between street, satellite, and dark basemaps, and adjust the visibility of the thematic layer. District labels and a region mask help orient the user within Samarkand.

Clicking a location displays its coordinates and the corresponding raster value. Colour legends explain how the values are represented on the map.

### Analysis of a selected area

Users can draw a rectangle on the map to examine a specific area. The detail panel presents summary statistics, a histogram, and class percentages where available.

For indicators with multiple observation years, a trend chart shows how the selected area's mean and minimum/maximum values change over time. The selected rectangle can also be shared through the page URL.

### Comparison and export

- Switch between available years to compare observations.
- Play yearly maps as an animation.
- Download GeoTIFF data for further GIS analysis.
- Download a cropped GeoTIFF for the selected area.
- Save the current map as a JPEG image.
- Export an animation as MP4 or WebM, depending on browser support.

### Content management

The administration interface allows authorized users to organize indicator groups, edit descriptions and legends, and upload georeferenced maps with their observation years. Existing files can be reviewed, updated, or removed.

## Typical workflow

1. Open the public map and choose an indicator group and category.
2. Select an available year and explore the thematic map.
3. Click a location to inspect its value, or draw a rectangle to analyse an area.
4. Review the statistics and compare the available years.
5. Download the data, save a map image, or export an animation.

To add a dataset, an administrator creates or selects a category, configures its unit and legend, and uploads a GeoTIFF with the corresponding year. Adding maps for more years enables temporal comparisons.

## About the data

Sam-Landshaft displays prepared geospatial datasets. The original satellite processing and calculation of environmental indices take place outside this frontend repository. Study rasters are supplied separately through the [companion backend](https://github.com/diyorbek0309/sam-landshaft-backend).

Statistics for large selections may use sampled raster values and should be treated as approximate summaries. Comparisons across years require consistent input data, measurement units, and classification thresholds.

Map images and videos are useful for presenting results. GeoTIFF downloads retain the geospatial data needed for further analysis in GIS software.

## Run locally

Requirements: Node.js 22.13 or a compatible newer version, npm, and a configured Sam-Landshaft backend with map data.

```bash
git clone https://github.com/diyorbek0309/sam-landshaft-frontend.git
cd sam-landshaft-frontend
npm ci
cp .env.example .env
npm run dev
```

Set the backend address in `.env` using `VITE_API_URL`. Open [http://localhost:5173](http://localhost:5173) for the public portal or `/admin/login` for the administration interface. Repository access is needed while the source repositories are private.

To build the frontend, run `npm run build`. Deployment instructions are in [`DEPLOY.md`](DEPLOY.md).

The frontend is built with React, TypeScript, Vite, Tailwind CSS, and Leaflet.

## Research and reproducibility

For a paper or review submission, provide a versioned release of the source code together with the matching datasets and their descriptions. Record the observation periods, preprocessing methods, units, classification thresholds, and software versions used. If a dataset cannot be shared publicly, explain how reviewers can obtain access.

A release can be archived with Zenodo to obtain a DOI for the exact version. See [GitHub's guidance on referencing and citing content](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content).

## License and attribution

This repository currently has no `LICENSE` file. Source-code and dataset reuse terms should be specified when distributing the project. The source and reuse terms of the supplied region boundary should also be documented. Basemap attribution must be preserved.
