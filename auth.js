const jwksClient = require('jwks-rsa')
const verify = require('jsonwebtoken/verify')

async function verifyToken(token){
  //Node has no atob
  const atob = base64 => Buffer.from(base64, 'base64').toString('ascii')
  const {kid} = JSON.parse(atob(token.split(".")[0]))
  const client = jwksClient({
    cache: true,
    jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys'
  });
  return new Promise(function(resolve,reject){
    //Grr why cant ppl use promises all da way
    client.getSigningKey(kid, async function(err, key) {
      if(err) return reject(err)
      try{
        const signingKey = key.publicKey || key.rsaPublicKey
        const options = { 
          algorithms: ['RS256'],
          ignoreExpiration: true,
          maxAge: "1 year"
        }
        const result = verify(token, signingKey ,options)
        resolve(result)
      }catch(e){
        reject(e)
      }
    });
  })
}
module.exports = {verifyToken}