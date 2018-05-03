# Hwboard v2

## Important files
1. `database.js`   
  This file handles all the database logic, including getting, adding, deleting and editing homework in the database  
  @therealorange
2. `websocket.js`  
  Handles all the websocket logic  
  @Jro
3. `./views/index.ejs`  
  Main ejs file to be served @owl10124
4. `./views/template/homework.ejs`  
  A template for rendering homework  
  Simple wrapper for `./public/scripts/parse.js`  
  @owl10124

## Installation
This would start hwboard on port 3001 by default. Set the `PORT` environment variable to use a different port
1. Clone this repository
2. `npm install`
3. **Go to app.js and edit the hostname on line 2** This is important for CSP.
4. Configure your server to proxy HTTP and websocket connections from localhost:3001
5. If you are using caddy, proceed to step 6
    - NGINX users need to somehow setup HTTP2 and to push resources according to upstream `Link` headers
6. npm run start:dev
7. Navigate to your domain in a browser and run the following code:  
`document.cookie="dev=true"`   
This ensures that any accidental errors are not reported to Sentry. However, CSP violations will still be reported

## Testing
### TODO: implement in CI 
@therealorange
1. Dependency check    
        i. Ensure dependencies are latest version  
        `npm i -g npm-check-updates`  
        `ncu -e 2`  

      ii. Check for vulnerabilities in dependencies  
        `npm i -g snyk`  
        `snyk test`
2. Unit testing  
`npm test`

