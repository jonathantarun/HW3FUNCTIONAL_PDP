import { startCLI } from './CLI.js';

const csvFilePath = process.argv[2];
if (!csvFilePath) {
  console.error('Please provide the path to the CSV file as a parameter.');
  process.exit(1);
}

startCLI(csvFilePath);
