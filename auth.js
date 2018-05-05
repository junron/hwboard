const jwksClient = require('jwks-rsa')
const jwt = require('jsonwebtoken')

async function verifyToken(token){
const atob = (base64) => Buffer.from(base64, 'base64').toString('ascii')
const kid = JSON.parse(atob(token.split(".")[0])).kid
const client = jwksClient({
  cache: true,
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys'
});
return new Promise(function(resolve){
  client.getSigningKey(kid, async function(err, key) {
    if(err) throw err;
    const signingKey = key.publicKey || key.rsaPublicKey
    const options = { 
      algorithms: ['RS256'],
      ignoreExpiration: true,
      maxAge: "1 year"
    }
    resolve(jwt.verify(token, signingKey,options))
  });
})
}
module.exports = {verifyToken}