# Hwboard v2 
Master Branch (stable)  
![pipeline status](https://git-badge.chatbox2.tk/orange/jro/hwboard2/master)  
[![Known Vulnerabilities](https://snyk.io/test/github/junron/hwboard/badge.svg?targetFile=package.json)](https://snyk.io/test/github/junron/hwboard?targetFile=package.json)  
 
Dev Branch:  
![pipeline status](https://git-badge.chatbox2.tk/orange/jro/hwboard2/dev)  
[![Known Vulnerabilities](https://snyk.io/test/github/junron/hwboard/dev/badge.svg)](https://snyk.io/test/github/junron/hwboard/dev)

## Installation
1. Clone this repository
2. Run `npm run hwboard config` to start the config process
3. Run `npm run hwboard add channel` to add a channel
4. Run `npm run start:dev` to start hwboard.
5. To run hwboard in the background, run `npm start`
    - This will start hwboard in cluster mode  
      This means that a hwboard process will be started for each core of your machine  
      Use `npm start -- -i <number of processes>` to override

## Running with  docker-compose  
Note: You may need `sudo` for commands that require docker.
1. Configure hwboard
    - `npm run hwboard config docker`
2. `docker-compose up`  
    - Add the `-d` option to detach
3. Get a bash shell within the container
    - `docker exec -it hwboard2_web_1 /bin/bash`
    - The container name should be `<current directory name>_web_1`
4. Run `npm run hwboard add channel` to add a channel
5. Run `npm start`

## Monitoring and scaling
Hwboard is run in production using `pm2`.
1. Install `pm2`
    - `npm i -g pm2`
2. List processes: `pm2 list`
3. Check memory usage: `pm2 monit`
3. Check logs: `pm2 log hwboard2-web`
    - Full logs are in `~/.pm2/logs`
4. Scale process: `pm2 scale hwboard2-web <number of nodes>`
5. Delete process: `pm2 delete hwboard2-web`


## Testing
Hwboard uses [snyk](https://snyk.io) to ensure that dependencies are free of vulnerabilities  
Snyk requires an authenticated account. Sign up [here](https://snyk.io/signup).

To run tests without checking dependencies, run `mocha test` instead of `npm test`.
You may also like to run `npm audit` to check dependencies.
