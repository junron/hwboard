# Testing mode
Testing mode allows users of homework board to bypass authentication via Microsoft.  

## When to use
1. CI environments
    - Gitlab
2. When developing locally on non-public network  
    - `localhost`

## Why tho?
Note: If you think any of the following points are wrong or can be mitigated, please do not hesitate to open an issue for discussion
1. The process of registering an app with Microsoft is non-trivial and inconvenient
2. Microsoft login requires a FQDN with a `https:// ` protocol  
    - `localhost` doesn't have `https`
    - `localhost` is definitely not a FQDN
    - Would you want to reverse proxy local hwboard to a FQDN in development???
3. Making a development version of hwboard publicly available on a FQDN is dangerous.
4. How would we login to Microsoft from a CI environment without exposing actual passwords??


## Features
1. Users do not need to login via Microsoft and will not be redirected to the Microsoft login page.
2. All users will be logged in with the email `tester@nushigh.edu.sg` and the name `tester`  
    - Any other existing tokens will be ignored
    - Users will only have access to channels that `tester@nushigh.edu.sg` has access to.

## Usage
Either set the `CI` environment variable to the string `true`  
  - `export CI="true"`  

OR

Run `hwboard config` and enter `yes` when asked if running in dev/testing mode.

OR

Manually set the `CI` property of `config.json` to the string `true`.

You should see a warning message:

    Hwboard is being run in testing mode.  
    Users do not need to be authenticated to access hwboard or modify hwboard.

when running hwboard.