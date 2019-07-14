//Web worker for indexedDB
//Use promise based messaging
try {
  worker = new PromiseWorker(new Worker("./scripts/worker.js"));
} catch (e) {
  Sentry.captureException(e);
}

hwboard = {
  /**
   * Gets homework from websocket or cache
   * @param {Boolean} removeExpired Whether to remove expired homework
   */
  async getHomework(removeExpired = true) {
    if (typeof worker === "undefined") {
      worker = new PromiseWorker(new Worker("/scripts/worker.js"));
      console.log("Worker was not initialized.");
      console.log("Worker is now a(n)", typeof worker);
    }
    const settings = {
      channel,
      removeExpired
    };
    return new Promise((resolve, reject) => {
      try {
        conn.emit("dataReq", settings, function (err, data) {
          //Always check if error occurred
          if (err) throw err;
          //Put data into client-side database for caching
          //But only for main page
          if (channel === "" && removeExpired) {
            worker.postMessage({
              type: "set",
              data
            });
            //Add to localstorage as a fallback
            localStorage.setItem("data", JSON.stringify(data));
          }
          console.log("Load homework from websocket");
          resolve(data);
        });
      } catch (e) {
        resolve(worker.postMessage({
          type: "get",
        }).then(data => {
          console.log("Load homework from IndexedDB");
          if (channel !== "") {
            //Only show homework for current channel
            data = data.filter(a => a.channel == channel);
          }
          return data;
        }));
      }
    });
  },
  /**
   * Gets channel data from websocket or cache, whichever is fastest
   */
  async getChannelData() {
    if (typeof worker === "undefined") {
      worker = new PromiseWorker(new Worker("/scripts/worker.js"));
      console.log("Worker was not initialized.");
      console.log("Worker is now a(n)", typeof worker);
    }
    return new Promise((resolve, reject) => {
      try {
        conn.emit("channelDataReq", {}, function (err, data) {
          //Always check if error occurred
          if (err) throw err;
          //Put channel data into client-side database for caching and offline access
          worker.postMessage({
            type: "setChannels",
            data
          });
          //Add to localstorage as a fallback
          localStorage.setItem("channelData", JSON.stringify(data));
          console.log("Load channels from websocket");
          resolve(data);
        });
      } catch (e) {
        resolve(worker.postMessage({
          type: "getChannels",
        }).then(data => {
          console.log("Load channels from IndexedDB");
          return data;
        }));
      }
    });

  }
};