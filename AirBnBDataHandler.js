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
      const totalPrice = data.reduce((acc, listing) => acc + Number(listing.price), 0);
      const avgPrice = count > 0 ? totalPrice / count : 0;

      const roomGroups = data.reduce((groups, listing) => {
        const rooms = listing.rooms;
        if (!groups[rooms]) groups[rooms] = [];
        groups[rooms].push(Number(listing.price));
        return groups;
      }, {});
      const avgPricePerRoom = {};
      for (const rooms in roomGroups) {
        const prices = roomGroups[rooms];
        avgPricePerRoom[rooms] = prices.reduce((a, b) => a + b, 0) / prices.length;
      }
      return { count, avgPrice, avgPricePerRoom };
    },

    /**
     * Computes the number of listings per host and ranks them.
     * @returns {Array<Object>} Ranking of hosts by number of listings.
     */
    computeHostsRanking() {
      const hosts = data.reduce((acc, listing) => {
        acc[listing.host_id] = (acc[listing.host_id] || 0) + 1;
        return acc;
      }, {});
      const ranking = Object.entries(hosts)
        .sort(([, a], [, b]) => b - a)
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
