const config = require("../loadConfig");
const auth = require("../auth");
const db = require("../controllers");
const {MS_CLIENTID:clientId,MS_CLIENTSECRET:clientSecret,HOSTNAME:hostname,CI:testing} = config;
const request = require("request-promise-native");

//Authenticate user and get authorised channels
async function authChannels(req,res){
  let decodedToken;
  if(req.signedCookies.username){
    decodedToken = {
      preferred_username:req.signedCookies.username
    };
  }else
  //If in testing mode, bypass authentication
  //See testing.md
  if(testing){
    decodedToken = {
      name:"tester",
      preferred_username:"tester@nushigh.edu.sg"
    };
    res.cookie("email", decodedToken.preferred_username, {
      maxAge:10*60*60*1000,
      secure:true,
      sameSite:"lax",
    });
  }else{
    const scopes = ["user.read","openid","profile"];
    //Check auth here
    //Temp var to store fresh token
    let tempToken; 
    //Check if token stored in cookie, 
    //if not, generate new token
    if(!(req.signedCookies && req.signedCookies.token)){

      //Check if authorization code is present
      //Auth codes can be exchanged for id_tokens
      if(!(req.query&&req.query.code)){
        console.log("redirected");
        res.redirect("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"+
          "response_type=code&"+
          `scope=https%3A%2F%2Fgraph.microsoft.com%2F${scopes.join("%20")}&`+
          `client_id=${clientId}&`+
          `redirect_uri=https://${hostname}/&`+
          "prompt=select_account&"+
          `response_mode=query`);
        return "redirected";
      } else {
        //Get id_token from auth code
        const code = req.query.code;
        const options = {
          method:"POST",
          uri:"https://login.microsoftonline.com/common/oauth2/v2.0/token",
          formData:{
            //grant_type:"id_token",
            grant_type:"authorization_code",
            scope:`https://graph.microsoft.com/${scopes.join(" ")}`,
            client_id:clientId,
            redirect_uri:"https://"+hostname+"/",
            code,
            client_secret:clientSecret
          }
        };
        try{
          const data = JSON.parse(await request(options));
          //Store token in cookie for easier login later
          //httpOnly, can be trusted
          res.cookie("token",data.id_token,{
            httpOnly:true,
            secure:true,
            signed:true,
            maxAge:2592000000,
            sameSite:"lax"
          });
          tempToken = data.id_token;
        }catch(e){
          console.log(e);
        }
      }
    }
    const token = req.signedCookies.token || tempToken;
    //Verify token (check signature and decode)
    try{
      decodedToken = await auth.verifyToken(token);
    }catch(e){
      console.log("Token error:",e.toString());
      res.clearCookie("token");
      res.redirect("/");
      throw e;
    }
    if(!decodedToken.preferred_username.endsWith("nushigh.edu.sg")){
      res.clearCookie("token");
      res.clearCookie("name");
      res.clearCookie("email");
      res.send("Please login with a NUSH email. Click <a href=/>here</a> to login again.");
      res.end();
      console.log("Invalid email:",decodedToken.preferred_username);
      return "redirected";
    }

    //Accessible and modifiable via client side JS\
    //DO NOT trust!!!
    //Just for analytics
    // Used for frontend UI
    res.cookie('email',decodedToken.preferred_username,{maxAge:2592000000,secure:true,sameSite:"lax"});
    res.cookie('name',decodedToken.name,{maxAge:2592000000,secure:true,sameSite:"lax"});
  }

  //Get authorised channels
  const channelData = {};
  const channels = await db.getUserChannels(decodedToken.preferred_username);
  for (const channel of channels){
    channelData[channel.name] = channel;
  }
  //Yey my failed attempt at functional programming
  const adminChannels =
  channels
    .filter(channel=>
    //Only users with at least admin permissions can edit homework
      channel.permissions>=2
    )
    .reduce((subjects,channel)=>{
    //Create object with channel names as keys and subject array as values
      subjects[channel.name] = channel.subjects;
      return subjects;
    },{});
  return {
    channelData,
    adminChannels,
    decodedToken
  };
}

module.exports = authChannels;