module.exports = {
    testMatch: ['**.test.js'], // Atur pola pencarian untuk file tes
    setupFiles: ['./setupJest.js'], // Atur untuk menggunakan jest-fetch-mock jika diperlukan
    testEnvironment: "jsdom"
};