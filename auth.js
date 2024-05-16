// const HOST = "https://9ad9-180-251-181-137.ngrok-free.app";
const HOST = "http://localhost:8080";

function login(clientId) {
  const sessionCookie = getCookie("session");
  if (!sessionCookie) {
    const randomSession = generateRandomCookie("session", 32);
    const loginUrl = `${HOST}/login-bento?client_id=${clientId}&session=${randomSession}`;
    window.open(loginUrl, "_blank");

    let isTimeOut = true;
    let attempts = 0;
    const maxAttempts = 15;
    const interval = setInterval(() => {
      console.log("pooling access token, please wait....");
      if (attempts < maxAttempts) {
        fetchAccessToken(clientId, randomSession)
          .then((tokenReceived) => {
            if (tokenReceived) {
              if (tokenReceived["token"] != null) {
                clearInterval(interval);
                setCookie("token", tokenReceived["token"], 32);
                isTimeOut = false;
                console.log(
                  "Access token fetched successfully. your token is: " +
                  tokenReceived["token"]
                );
              }
              attempts++;
            }
          })
          .catch((error) => {
            console.error("Error fetching access token:", error);
            attempts++;
          });
      } else {
        clearInterval(interval);
        console.error("Failed to fetch access token after maximum attempts.");
      }
    }, 4000); // pooling every 4s

    // Set a timeout to stop the fetch process after 60 seconds
    setTimeout(() => {
      clearInterval(interval);
      if (isTimeOut) {
        console.error("Process timed out after 60 seconds.");
      }
    }, 60000);
  }
}

async function fetchAccessToken(clientId, session) {
  return await fetch(
    `${HOST}/get-access-token?client_id=${clientId}&session=${session}`
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 404) {
        console.log("404 error: No token available.");
        return null; // Return null, so that the caller knows the fetch was unsuccessful
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.log("Fetch failed");
      throw error
    });
}

function logout(clientId, host) {
  const sessionCookie = getCookie("session");
  if (sessionCookie) {
    fetchLogout(clientId, sessionCookie, host);
  }
}

function getCookie(name) {
  let cookieArray = document.cookie.split(";");
  for (let i = 0; i < cookieArray.length; i++) {
    let cookiePair = cookieArray[i].split("=");
    if (name === cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
}

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function generateRandomCookie(name, days) {
  const randomValue =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  setCookie(name, randomValue, days);
  return randomValue;
}

function fetchLogout(clientId, session) {
  deleteCookie("session");
  deleteCookie("token");
  fetch(`${HOST}/logout?client_id=${clientId}&session=${session}`)
    .then((response) => {
      if (response.ok) {
        return;
      }
    })
    .then((data) => {
      console.log("successfuly logout");
      window.location.reload();
    });
}

function deleteCookie(name) {
  document.cookie = name + "=; max-age=0; path=/"; // This sets the cookie's max-age to zero seconds, causing it to expire immediately
}

module.exports = {
  login,
  logout,
  fetchAccessToken,
};
