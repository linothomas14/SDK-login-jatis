const HOST = "http://localhost:8080";
// const fetch = require('jest-fetch-mock');
const { fetchAccessToken, login, logout, fungsiTambah } = require('./auth');
// const fetch = require('jest-fetch-mock').enableFetchMocks;

describe('auth module', () => {
    beforeEach(() => {
        fetch.resetMocks()
    })

    describe('fetchAccessToken', () => {
        it('should return token data when the response is ok', async () => {
            const mockToken = { access_token: '12345' };
            fetch.mockResponseOnce(JSON.stringify(mockToken), { status: 200 });

            const result = await fetchAccessToken('clientId', 'session');

            expect(result).toEqual(mockToken);
            expect(fetch).toHaveBeenCalledWith(
                `${HOST}/get-access-token?client_id=clientId&session=session`
            );
        });

        it('should return null when the response status is 404', async () => {
            fetch.mockResponseOnce('', { status: 404 });

            const result = await fetchAccessToken('clientId', 'session');

            expect(result).toBeNull();
            expect(fetch).toHaveBeenCalledWith(
                `${HOST}/get-access-token?client_id=clientId&session=session`
            );
        });

        it('should throw an error for unexpected response status', async () => {
            var statusCode = 500
            fetch.mockResponseOnce('', { status: statusCode });

            await expect(fetchAccessToken('clientId', 'session')).rejects.toThrow(
                `Unexpected response status: ${statusCode}`
            );
            expect(fetch).toHaveBeenCalledWith(
                `${HOST}/get-access-token?client_id=clientId&session=session`
            );
        });



    });

});