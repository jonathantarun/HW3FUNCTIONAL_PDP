// AirBnBDataHandler.js
import { promises as fs } from 'node:fs';

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
      

    /**
     * Computes statistics: total count and average price,
     * and groups average price per number of rooms.
     * @returns {Object} An object with the computed statistics.
     */
    computeStats() {
      const count = data.length;
      const totalPrice = data.reduce((acc, listing) => {
        const cleanPrice = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
        return acc + (isNaN(cleanPrice) ? 0 : cleanPrice);
      }, 0);
      const avgPrice = count > 0 ? totalPrice / count : 0; // making sure that the filtered data is not empty

      const roomGroups = data.reduce((groups, listing) => {
        // Make sure you're using the correct property name
        const rooms = listing.bedrooms || listing.rooms; // Use whichever exists
        if (rooms === undefined) return groups; // Skip if no room information
        if (!groups[rooms]) groups[rooms] = [];
        // Clean and parse the price consistently
        const cleanPrice = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanPrice)) {
          groups[rooms].push(cleanPrice); // Only add valid prices
        }
        return groups;
      }, {});
      
      const avgPricePerRoom = {};
      for (const rooms in roomGroups) {
        const prices = roomGroups[rooms];
        // Only calculate average if we have prices
        if (prices.length > 0) {
          avgPricePerRoom[rooms] = prices.reduce((a, b) => a + b, 0) / (prices.length * rooms);
        } else {
          avgPricePerRoom[rooms] = 0; // Default value for empty categories
        }
      }
      return { count, avgPrice, avgPricePerRoom };
    },

    /**
     * Computes the number of listings per host and ranks them.
     * @returns {Array<Object>} Ranking of hosts by number of listings.
     */
    computeHostsRanking() {
      const hosts = data.reduce((acc, listing) => {
        acc[listing.host_listings_count] = (acc[listing.host_listings_count] || 0) + 1;
        return acc;
      }, {});
      const ranking = Object.entries(hosts)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([host, count]) => ({ host, count }));
      return ranking;
    },

    /**
     * Exports results to a specified file.
     * @param {string} filename - The file path to write the results to.
     * @param {Object|Array} results - The results to be exported.
     * @returns {Promise<void>} A promise that resolves when the file is written.
     */
    exportResults(filename, results) {
      return fs.writeFile(filename, JSON.stringify(results, null, 2));
    },

    /**
     * Returns the current data.
     * @returns {Array<Object>} The current list of listings.
     */
    getData() {
      return data;
    }
  };
};
