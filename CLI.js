import readline from 'readline';
import { AirBnBDataHandler } from './AirBnBDataHandler.js';
import { promises as fs } from 'node:fs';
import { parse } from 'csv-parse/sync';
import open from 'open';
import { writeFile } from 'node:fs/promises';

/**
 * Helper function to create an ASCII bar chart for top hosts.
 * Each bar is generated based on the host's average rating (scale 0-10).
 * @param {Array<Object>} hosts - Array of objects with { host, avgRating }.
 * @returns {string} ASCII bar chart.
 */
const visualizeTopHosts = (hosts) =>
  hosts
    .map(hostObj => {
      const rounded = hostObj.avgRating;
      const bar = '█'.repeat(rounded) + ' '.repeat(10 - rounded);
      return `${hostObj.host}: [${bar}] ${hostObj.avgRating.toFixed(2)}`;
    })
    .join('\n');

/**
 * Initializes the CLI.
 * @param {string} csvFilePath - Path to the CSV data file.
 */
export const startCLI = async (csvFilePath) => {
  try {
    console.log('Enter the CSV file path:');
    const fileContent = await fs.readFile(csvFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    console.log('Parsed Records:', records);

    // Create a handler with original data and current data set to the full CSV records.
    let handler = AirBnBDataHandler(records);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) =>
      new Promise((resolve) => rl.question(question, resolve));

    let exit = false;
    while (!exit) {
      console.log('\nOptions:');
      console.log('1. Filter listings');
      console.log('2. Compute statistics');
      console.log('3. Compute hosts ranking');
      console.log('4. Export current data');
      console.log('5. Reset filters');
      console.log('6. Compare two filters');
      console.log('7. Visualize top 10 hosts by average rating');
      console.log('8. Exit');
      const answer = await askQuestion('Select an option: ');

      switch (answer.trim()) {
        case '1': {
          const price = Number(await askQuestion('Max price (or leave blank): '));
          const rooms = Number(await askQuestion('Exact number of bedrooms (or leave blank): '));
          const reviewScore = Number(await askQuestion('Minimum review score (or leave blank): '));
          const criteria = {};
          if (!isNaN(price)) criteria.price = price;
          if (!isNaN(rooms)) criteria.bedrooms = rooms;
          if (!isNaN(reviewScore)) criteria.review_scores_rating = reviewScore;
          handler = handler.filter(criteria);
          console.log('Filter applied.');
          break;
        }
        case '2': {
          const stats = handler.computeStats();
          console.log('Statistics:', stats);
          break;
        }
        case '3': {
          const ranking = handler.computeHostsRanking();
          console.log('Hosts Ranking:', ranking);
          break;
        }
        case '4': {
          const filename = await askQuestion('Enter export filename: ');
          const exportData = {
            data: handler.getData(),
            stats: handler.computeStats(),
            ranking: handler.computeHostsRanking()
          };
          console.log('Export Data:', exportData);
          await handler.exportResults(filename.trim(), exportData);
          console.log(`Results exported to ${filename}`);
          break;
        }
        case '5': {
          handler = handler.resetFilters();
          console.log('Filters have been reset.');
          break;
        }
        case '6': {
          console.log("Comparing two filter sets:");
          console.log("First filter:");
          const price1 = Number(await askQuestion('Max price for first filter (or leave blank): '));
          const rooms1 = Number(await askQuestion('Exact number of bedrooms for first filter (or leave blank): '));
          const reviewScore1 = Number(await askQuestion('Minimum review score for first filter (or leave blank): '));
          const criteria1 = {};
          if (!isNaN(price1)) criteria1.price = price1;
          if (!isNaN(rooms1)) criteria1.bedrooms = rooms1;
          if (!isNaN(reviewScore1)) criteria1.review_scores_rating = reviewScore1;

          console.log("Second filter:");
          const price2 = Number(await askQuestion('Max price for second filter (or leave blank): '));
          const rooms2 = Number(await askQuestion('Exact number of bedrooms for second filter (or leave blank): '));
          const reviewScore2 = Number(await askQuestion('Minimum review score for second filter (or leave blank): '));
          const criteria2 = {};
          if (!isNaN(price2)) criteria2.price = price2;
          if (!isNaN(rooms2)) criteria2.bedrooms = rooms2;
          if (!isNaN(reviewScore2)) criteria2.review_scores_rating = reviewScore2;

          // Use the original dataset by resetting filters
          const originalHandler = handler.resetFilters();
          const handler1 = originalHandler.filter(criteria1);
          const handler2 = originalHandler.filter(criteria2);
          console.log("First Filter Statistics:", handler1.computeStats());
          console.log("Second Filter Statistics:", handler2.computeStats());
          break;
        }
        case '7': {
          const topHosts = handler.computeTopHostsByRating();
          console.log("Top 10 Hosts by Average Rating:");
          console.log(visualizeTopHosts(topHosts));
          // Generate Vega-Lite chart HTML and open in browser
          const spec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "description": "Top 10 Hosts by Average Rating",
            "data": { "values": topHosts },
            "mark": "bar",
            "encoding": {
              "y": {"field": "host","type": "nominal","axis": { "title": "Host" },"sort": { "field": "avgRating", "order": "descending" } },
              "x": { "field": "avgRating","type": "quantitative", "axis": { "title": "Average Rating" } }
            }
          };

          const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Top 10 Hosts by Average Rating</title>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
  </head>
  <body>
    <div id="vis"></div>
    <script type="text/javascript">
      const spec = ${JSON.stringify(spec, null, 2)};
      vegaEmbed('#vis', spec).then(result => {
        console.log("Visualization rendered successfully.");
      }).catch(console.error);
    </script>
  </body>
</html>
          `;
          const vizFilename = 'top_hosts.html';
          await writeFile(vizFilename, htmlContent, 'utf8');
          console.log(`Visualization saved to ${vizFilename}. Opening in browser...`);
          await open(vizFilename);
          break;
        }
        case '8': {
          exit = true;
          break;
        }
        default:
          console.log('Invalid option.');
      }
    }
    rl.close();
  } catch (err) {
    console.error('Error:', err);
  }
};
