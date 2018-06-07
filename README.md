# Hwboard v2 
Master Branch (stable)  
[![pipeline status](https://gitlab.therealorange.com/Jro/hwboard2/badges/master/pipeline.svg)](https://gitlab.therealorange.com/Jro/hwboard2/commits/master)  

[![Known Vulnerabilities](https://snyk.io/test/github/junron/hwboard/badge.svg?targetFile=package.json)](https://snyk.io/test/github/junron/hwboard?targetFile=package.json)  
 
Dev Branch:  
[![pipeline status](https://gitlab.therealorange.com/Jro/hwboard2/badges/dev/pipeline.svg)](https://gitlab.therealorange.com/Jro/hwboard2/commits/dev)

## Installation
1. Clone this repository
2. `npm install -g`
  - If you choose not to install globally, replace `hwboard` with `npm run hwboard` in the following commands
3. run `hwboard config` to start the config process
4. Run `hwboard add channel` to add a channel
5. Run `npm run start:dev` to start hwboard.
6. To run hwboard in the background, run `hwboard start detach`

## Running with  docker-compose  
`docker-compose up`  


## Testing
Hwboard uses [snyk](https://snyk.io) to ensure that dependencies are free of vulnerabilities  
Snyk requires an authenticated account. Sign up [here](https://snyk.io/signup).

To run tests without checking dependencies, run `mocha test` instead of `npm test`.
You may also like to run `npm audit` to check dependencies.
