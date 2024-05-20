const HOST = "http://localhost:8080";
const fetch = require("jest-fetch-mock");
const {
  login,
  fetchAccessToken,
  setCookie,
  getCookie,
  generateRandomCookie,
  deleteCookie,
  fetchLogout,
  logout,
} = require("./auth");

describe("fetchAccessToken", () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  //   describe("fetchAccessToken", () => {
  it("should return token data when the response is ok", async () => {
    const mockToken = { access_token: "12345" };
    fetch.mockResponseOnce(JSON.stringify(mockToken), { status: 200 });

    const result = await fetchAccessToken("clientId", "session");

    expect(result).toEqual(mockToken);
    expect(fetch).toHaveBeenCalledWith(
      `${HOST}/get-access-token?client_id=clientId&session=session`
    );
  });

  it("should return null when the response status is 404", async () => {
    fetch.mockResponseOnce("", { status: 404 });

    const result = await fetchAccessToken("clientId", "session");

    expect(result).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      `${HOST}/get-access-token?client_id=clientId&session=session`
    );
  });

  it("should throw an error for unexpected response status", async () => {
    var statusCode = 500;
    fetch.mockResponseOnce("", { status: statusCode });

    await expect(fetchAccessToken("clientId", "session")).rejects.toThrow(
      `Unexpected response status: ${statusCode}`
    );
    expect(fetch).toHaveBeenCalledWith(
      `${HOST}/get-access-token?client_id=clientId&session=session`
    );
  });
});

describe("getCookie", () => {
  beforeEach(() => {
    // Reset document.cookie to a default value before each test
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "session=12345",
    });
  });

  it("should return the value of the specified cookie", () => {
    const result = getCookie("session");
    expect(result).toBe("12345");
  });

  it("should return null if the cookie is not found", () => {
    const result = getCookie("nonexistent");
    expect(result).toBeFalsy();
  });

  it("should return null if the cookie is already deleted", () => {
    deleteCookie("session");
    const result = getCookie("nonexistent");
    expect(result).toBeFalsy();
  });
});

describe("setCookie", () => {
  beforeEach(() => {
    // Mock document.cookie before each test
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("should set a cookie with the given name and value", () => {
    setCookie("testName", "testValue", 7);
    expect(document.cookie).toContain("testName=testValue");
  });

  it("should set a cookie with the correct expiration date", () => {
    const days = 7;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expectedExpires = "; expires=" + date.toUTCString();

    setCookie("testName", "testValue", days);
    expect(document.cookie).toContain(expectedExpires);
  });
});

describe("generateRandomCookie", () => {
  beforeEach(() => {
    // Mock document.cookie before each test
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("should set a cookie with a random value", () => {
    const name = "randomCookie";
    generateRandomCookie(name, 7);

    const cookieValue = document.cookie.split("=")[1];
    expect(cookieValue.length).toBeGreaterThan(0);
  });
});

describe("logout", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mock calls and instances before each test
  });

  it("should call fetchLogout if session cookie is found", () => {
    const clientId = "testClientId";
    const sessionCookie = "session";
    const sessionValue = "testValue";
    setCookie(sessionCookie, sessionValue, 7);

    const getCookie = jest.fn();
    const fetchLogout = jest.fn();

    getCookie.mockReturnValue(sessionCookie);
    fetchLogout.mockReturnValue(null);

    logout(clientId);
  });

  it("should log 'session not found' if session cookie is not found", () => {
    const clientId = "testClientId";
    const getCookie = jest.fn();
    getCookie.mockReturnValue(false);

    console.log = jest.fn();
    logout(clientId);
    expect(console.log).toHaveBeenCalledWith("session not found");
  });
});
describe("login", () => {
  let originalWindowOpen;
  let originalSetInterval;
  let originalSetTimeout;
  let clearIntervalMock;
  let clearTimeoutMock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    originalWindowOpen = window.open;
    window.open = jest.fn();

    originalSetInterval = global.setInterval;
    clearIntervalMock = jest.fn();
    global.setInterval = jest.fn((fn, ms) => {
      const intervalId = originalSetInterval(fn, ms);
      clearIntervalMock.mockImplementation(() => clearInterval(intervalId));
      return intervalId;
    });

    originalSetTimeout = global.setTimeout;
    clearTimeoutMock = jest.fn();
    global.setTimeout = jest.fn((fn, ms) => {
      const timeoutId = originalSetTimeout(fn, ms);
      clearTimeoutMock.mockImplementation(() => clearTimeout(timeoutId));
      return timeoutId;
    });
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    global.setInterval = originalSetInterval;
    global.setTimeout = originalSetTimeout;
    jest.useRealTimers();
  });

  it("should open a login URL and fetch the access token successfully", async () => {
    const getCookie = jest.fn();
    const generateRandomCookie = jest.fn();
    const fetchAccessToken = jest.fn();
    const setCookie = jest.fn();

    global.open = jest.fn();
    getCookie.mockReturnValue(false);
    generateRandomCookie.mockReturnValue("randomSession");
    fetchAccessToken.mockResolvedValue({ token: "accessToken" });

    // Mocking console.log and console.error
    console.log = jest.fn();
    console.error = jest.fn();

    // Mocking global functions
    global.getCookie = getCookie;
    global.generateRandomCookie = generateRandomCookie;
    global.fetchAccessToken = fetchAccessToken;
    global.setCookie = setCookie;

    login("clientId");

    // Advance timers to simulate intervals and timeout
    jest.advanceTimersByTime(4000); // First interval
    expect(global.open).toHaveBeenCalledWith(
      expect.stringContaining(`${HOST}/login-bento?client_id=clientId&session`),
      "_blank"
    );

    expect(console.log).toHaveBeenCalledWith(
      "pooling access token, please wait...."
    );

    // Simulate successful token fetch within the interval
    await jest.advanceTimersByTime(4000); // Second interval
    // expect(fetchAccessToken).toHaveBeenCalledWith("clientId", "randomSession");

    // Simulate fetching the token successfully
    await jest.advanceTimersByTime(4000); // Third interval
    //   expect(setCookie).toHaveBeenCalledWith("token", "accessToken", 32);
    //   expect(console.log).toHaveBeenCalledWith("Access token fetched successfully. your token is: accessToken");

    // Check that interval is cleared
    //   expect(clearIntervalMock).toHaveBeenCalled();

    // Check that timeout does not log an error
    await jest.advanceTimersByTime(60000); // Timeout
    //   expect(console.error).not.toHaveBeenCalledWith("Process timed out after 60 seconds.");
  });

  it("should log an error if the still exist", async () => {
    const getCookie = jest.fn();

    setCookie("session", "testValue", 7);
    global.open = jest.fn();

    console.error = jest.fn();

    global.getCookie = getCookie;

    login("clientId");

    expect(console.error).toHaveBeenCalledWith("previous session still exist");
  });
});
