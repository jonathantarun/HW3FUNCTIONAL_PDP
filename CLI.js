import readline from 'readline';
import { AirBnBDataHandler } from './AirBnBDataHandler.js';
import { promises as fs } from 'node:fs';
import { parse } from 'csv-parse/sync';

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
      console.log('5. Exit');
      const answer = await askQuestion('Select an option: ');

      switch (answer.trim()) {
        case '1': {
          const price = Number(await askQuestion('Max price (or leave blank): '));
          const rooms = Number(await askQuestion('Exact number of rooms (or leave blank): '));
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
