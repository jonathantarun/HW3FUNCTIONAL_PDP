# AirBnB Data Handler - HW3 Functional Programming:

## Author
Jonathan Tarun Rajasekaran

## Data
Check out the original dataset [here.](https://data.insideairbnb.com/united-states/ca/oakland/2024-12-22/data/listings.csv.gz)

## YouTube Video


## About
This is an assignment for my class in Programming Design Paradigms at Northeastern University under Professor John Alexis Guerra Gomez. The goal was to create an AirBnBDataHandler to do some functions such as filter, computing stats and ranking hosts by number of listings. The assignment was done with the functional programming paradigm, using only pure and higher order functions. 

## Pure Function

**Example:**
```js
/**
 * Returns the current data.
 * @returns {Array<Object>} The current list of listings.
 */
getData() {
  return data;
}
``` 

This is a pure function because:

- Returns the same output for the same input every time 
- It has no side effects (doesn't modify external state)

**Counter Example:**

```js
/**
 * @returns {Array<Object>} The modified list of listings.
 */
getData() {
  data.forEach(listing => {
    listing.retrievedAt = new Date().toISOString();
    
    // Modifying existing data
    if (listing.price) {
      listing.price = Number(listing.price) * currentExchangeRate; // Using an external variable
    }
  });
  
  console.log(`Data retrieved at ${new Date()}`);
  fs.writeFileSync('last_access.log', new Date().toISOString());
  
  return data;
}
```

Why is this an Impure function:

- The existing data is modified
- Causes side effects (Logging on console, modifying an existing attribute using an external variable)
- Breaks the rule of immutability
- Depends on external state (`currentExchangeRate`)


## Higher order functions

**Example:**

```js
export const AirBnBDataHandler = (data) => {
  return {
    /**
     * Filters listings by given criteria.
     * @param {Object} criteria - Filter criteria (e.g., { price: 150, rooms: 2, reviewScore: 4 }).
     * @returns {Object} A new AirBnBDataHandler instance with filtered data.
     */
    filter(criteria = {}) {
        const filteredData = data.filter((listing) => {
          let valid = true;
          if (criteria.price !== undefined) {
            // Clean the price value from the CSV (e.g. "$160.00" becomes 160.00)
            const cleanPrice = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
            valid = valid && cleanPrice <= criteria.price;
          }
          if (criteria.bedrooms !== undefined) {
            valid = valid && Number(listing.bedrooms) === criteria.bedrooms;
          }
          if (criteria.review_scores_rating !== undefined) {
            valid = valid && Number(listing.review_scores_rating) >= criteria.review_scores_rating;
          }
          return valid;
        });
        return AirBnBDataHandler(filteredData);
      },
```
**The entire AirBnBDataHandler function is a higher order function since it returns multiple functions (filter(), computeStats(),etc)**

Why is it a higher order function:

- Because it returs one or more functions

**Counter Example:**

```js
export const AirBnBDataHandler = (data) => {
  let filteredData = [...data];
  let currentCriteria = {};
  
  console.log(`Loaded ${data.length} listings`);
  
  // Return data directly instead of functions
  return filteredData;
};
```

Why it breaks the principle:

- It does not take any function as input nor does it return a function.

## AI Usage:

- I used AI for all the data processing related to CSVs:

Prompt: *csv file*  this is a dataset of airbnb listings in Oakland, I am doing an assignment which requires me to parse this csv to perform some useful functions such as computing stats, ranking hosts and filtering data. The user needs to access these functions via the command line using readLine, I should also be able to chain these functions (eg: data.filter(...).rank()) Could you show me how the filter function would be written so that I can get a better idea.

Model: ChatGPT - o3 mini

Response:
```js
import { promises as fs } from 'node:fs';
import csvParse from 'csv-parse/lib/sync';

/**
 * Creates an AirBnBDataHandler instance.
 * @param {Array<Object>} data - The list of AirBnB listings.
 * @returns {Object} The handler with chained methods.
 */
export const AirBnBDataHandler = (data) => {
  return {
    /**
     * Filters listings by given criteria.
     * @param {Object} criteria - Filter criteria (e.g., { price: 150, rooms: 2, reviewScore: 4 }).
     * @returns {Object} A new AirBnBDataHandler instance with filtered data.
     */
    filter(criteria = {}) {
      const filteredData = data.filter((listing) => {
        let valid = true;
        if (criteria.price !== undefined) {
          valid = valid && Number(listing.price) <= criteria.price;
        }
        if (criteria.rooms !== undefined) {
          valid = valid && Number(listing.rooms) === criteria.rooms;
        }
        if (criteria.reviewScore !== undefined) {
          valid = valid && Number(listing.review_score) >= criteria.reviewScore;
        }
        return valid;
      });
      return AirBnBDataHandler(filteredData);
    }
  }
}
```

```js
import readline from 'readline';
import { AirBnBDataHandler } from './AirBnBDataHandler.js';
import { promises as fs } from 'node:fs';
import csvParse from 'csv-parse/lib/sync';

/**
 * Initializes the CLI.
 * @param {string} csvFilePath - Path to the CSV data file.
 */
export const startCLI = async (csvFilePath) => {
  try {
    const fileContent = await fs.readFile(csvFilePath, 'utf8');
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    let handler = AirBnBDataHandler(records);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
```

This was the code snippet I got from AI, however It did not work for a few obvious reasons and some not so obvious. The major issue was that the column names were not the same as in the dataset, then the second issue was that csvParse was not working for me. VSC suggested that I use `parse` instead- which is what I did and it ended up working.