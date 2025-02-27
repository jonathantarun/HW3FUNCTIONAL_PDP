import { promises as fs } from 'node:fs';

/**
 * Creates an AirBnBDataHandler instance.
 * @param {Array<Object>} originalData - The original unfiltered listings.
 * @param {Array<Object>} [currentData=originalData] - The current (possibly filtered) listings.
 * @returns {Object} The handler with chained methods.
 */
export const AirBnBDataHandler = (originalData, currentData = originalData) => {
  return {
    /**
     * Filters listings by given criteria.
     * @param {Object} criteria - Filter criteria (e.g., { price: 150, bedrooms: 2, review_scores_rating: 4 }).
     * @returns {Object} A new AirBnBDataHandler instance with filtered data.
     */
    filter(criteria = {}) {
      const filteredData = currentData.filter((listing) => {
        let valid = true;
        if (criteria.price !== undefined) {
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
      return AirBnBDataHandler(originalData, filteredData);
    },

    /**
     * Resets all filters and returns a new instance with the original data.
     * @returns {Object} A new AirBnBDataHandler instance with unfiltered data.
     */
    resetFilters() {
      return AirBnBDataHandler(originalData);
    },

    /**
     * Computes statistics: total count and average price,
     * and groups average price per number of rooms.
     * @returns {Object} An object with the computed statistics.
     */
    computeStats() {
      const count = currentData.length;
      const totalPrice = currentData.reduce((acc, listing) => {
        const cleanPrice = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
        return acc + (isNaN(cleanPrice) ? 0 : cleanPrice);
      }, 0);
      const avgPrice = count > 0 ? totalPrice / count : 0;

      const roomGroups = currentData.reduce((groups, listing) => {
        const rooms = listing.bedrooms || listing.rooms;
        if (rooms === undefined) return groups;
        if (!groups[rooms]) groups[rooms] = [];
        const cleanPrice = parseFloat(listing.price.replace(/[^0-9.]/g, ''));
        if (!isNaN(cleanPrice)) {
          groups[rooms].push(cleanPrice);
        }
        return groups;
      }, {});

      const avgPricePerRoom = {};
      for (const rooms in roomGroups) {
        const prices = roomGroups[rooms];
        if (prices.length > 0) {
          avgPricePerRoom[rooms] = prices.reduce((a, b) => a + b, 0) / (prices.length * rooms);
        } else {
          avgPricePerRoom[rooms] = 0;
        }
      }
      return { count, avgPrice, avgPricePerRoom };
    },

    /**
     * Computes the number of listings per host and ranks them.
     * @returns {Array<Object>} Ranking of hosts by number of listings.
     */
    computeHostsRanking() {
      const hosts = currentData.reduce((acc, listing) => {
        const hostId = listing.host_id;
        if (!hostId) return acc;
        acc[hostId] = (acc[hostId] || 0) + 1;
        return acc;
      }, {});
      return Object.entries(hosts)
        .map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count);
    },

    /**
     * Computes the top ten hosts by average review rating.
     * @returns {Array<Object>} Top ten hosts with highest average ratings.
     */
    computeTopHostsByRating() {
      // Filter out listings where the host has fewer than 3 listings
      const filteredData = currentData.filter(listing => {
        const listingsCount = parseInt(listing.host_listings_count, 10);
        return listingsCount >=3;
      });
    
      // Initialize an object to store total ratings and counts for each host
      const hostRatings = filteredData.reduce((acc, listing) => {
        const hostId = listing.host_name;
        const rating = parseFloat(listing.review_scores_rating);
    
        // Validate hostId and rating to ensure no errors during calculation
        if (!hostId || isNaN(rating)) return acc;
    
        // Accumulate total ratings and counts
        if (!acc[hostId]) {
          acc[hostId] = { totalRating: rating, count: 1 };
        } else {
          acc[hostId].totalRating += rating;
          acc[hostId].count++;
        }
        return acc;
      }, {});
    
      // Calculate average ratings for each host
      const averages = Object.entries(hostRatings).map(([host, { totalRating, count }]) => ({
        host,
        avgRating: totalRating / count,
        count
      }));
    
      // Sort hosts by average rating in descending order
      averages.sort((a, b) => b.avgRating - a.avgRating);
    
      // Return the top 10 hosts
      return averages.slice(0, 10);
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
      return currentData;
    }
  };
};
